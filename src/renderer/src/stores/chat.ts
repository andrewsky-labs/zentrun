import { defineStore } from 'pinia'
import {ref, computed, toRaw} from 'vue'
import type {
  UserMessageContent,
  AssistantMessageBlock,
  AssistantMessage,
  UserMessage,
  Message
} from '@shared/chat'
import type { CONVERSATION, CONVERSATION_SETTINGS, MCPToolCall, LLM_PROVIDER } from '@shared/presenter'
import { usePresenter } from '@/composables/usePresenter'
import { CONVERSATION_EVENTS, DEEPLINK_EVENTS } from '@/events'
import router from '@/router'
import { zentStore } from '@/stores/zent'
import { runHistoryStore } from '@/stores/runHistory'
import { apiRequest } from '@/api'
import { useArtifactStore } from '@/stores/artifact'
import { nanoid } from 'nanoid'
import i18n from '@/i18n'
import { getMarkdown, parseMarkdownToStructure } from '@/lib/markdown.helper'
const t = i18n.global.t
// 定义会话工作状态类型
export type WorkingStatus = 'working' | 'error' | 'completed' | 'none'

export const useChatStore = defineStore('chat', () => {
  const threadP = usePresenter('threadPresenter')
  const windowP = usePresenter('windowPresenter')
  const notificationP = usePresenter('notificationPresenter')
  const llmPresenter = usePresenter('llmproviderPresenter')
  const mcpPresenter = usePresenter('mcpPresenter')
  const chatStore = useChatStore()

  // Check if current provider is zentrun
  const isZentrunProvider = async (): Promise<boolean> => {
    try {
      return chatStore.chatConfig.providerId === 'zentrun'
    } catch (error) {
      console.error('Error checking provider:', error)
      return false
    }
  }

  // 状态
  const activeThreadId = ref<string | null>(null)
  const threads = ref<
    {
      dt: string
      dtThreads: CONVERSATION[]
    }[]
  >([])
  const messages = ref<AssistantMessage[] | UserMessage[]>([])
  const isLoading = ref(false)
  const generatingThreadIds = ref(new Set<string>())
  const pageSize = ref(40)
  const hasMore = ref(true)
  const isSidebarOpen = ref(false)
  const activeAgent = ref<any>(null)
  const activeZpilot = ref<any>(null)

  // 使用Map来存储会话工作状态
  const threadsWorkingStatus = ref<Map<string, WorkingStatus>>(new Map())

  // 添加消息生成缓存
  const generatingMessagesCache = ref<
    Map<
      string,
      {
        message: AssistantMessage | UserMessage
        threadId: string
      }
    >
  >(new Map())

  // 对话配置状态
  const chatConfig = ref<CONVERSATION_SETTINGS>({
    systemPrompt: '',
    temperature: 0.7,
    contextLength: 32000,
    maxTokens: 8000,
    providerId: '',
    modelId: '',
    artifacts: 0
  })

  // Deeplink 消息缓存
  const deeplinkCache = ref<{
    msg?: string
    modelId?: string
    systemPrompt?: string
    autoSend?: boolean
  } | null>(null)

  // Getters
  const activeThread = computed(() => {
    return threads.value.flatMap((t) => t.dtThreads).find((t) => t.id === activeThreadId.value)
  })

  // Actions
  const loadThreads = async (page: number) => {
    if (isLoading.value || (!hasMore.value && page !== 1)) {
      return
    }
    try {
      isLoading.value = true
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let result = await threadP.getConversationList(page, pageSize.value)
      let result_list = await result.list.filter((conversation) => {
        return conversation.settings?.userApptoken === user?.appTokenCode
      })
      result.list = result_list;
      // 按日期分组处理会话列表
      const groupedThreads: Map<string, CONVERSATION[]> = new Map()

      result.list.forEach((conv) => {
        const date = new Date(conv.updatedAt).toISOString().split('T')[0]
        if (!groupedThreads.has(date)) {
          groupedThreads.set(date, [])
        }
        groupedThreads.get(date)?.push({
          ...conv
        })
      })

      // 转换为组件所需的数据结构
      const newThreads = Array.from(groupedThreads.entries()).map(([dt, dtThreads]) => ({
        dt,
        dtThreads
      }))

      // 判断是否还有更多数据
      hasMore.value = result.list.length === pageSize.value

      if (page === 1) {
        threads.value = newThreads
      } else {
        // 合并现有数据和新数据，需要处理同一天的数据
        newThreads.forEach((newThread) => {
          const existingThread = threads.value.find((t) => t.dt === newThread.dt)
          if (existingThread) {
            existingThread.dtThreads.push(...newThread.dtThreads)
          } else {
            threads.value.push(newThread)
          }
        })
      }
      // 按日期排序
      threads.value.sort((a, b) => new Date(b.dt).getTime() - new Date(a.dt).getTime())
    } catch (error) {
      console.error('加载会话列表失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const createNewEmptyThread = async () => {
    try {
      await clearActiveThread()
      await loadThreads(1)
    } catch (error) {
      console.error('清空活动会话并加载第一页失败:', error)
      throw error
    }
  }

  const createThread = async (title: string, settings: Partial<CONVERSATION_SETTINGS>) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      settings.userAppToken = user.appTokenCode;

      const threadId = await threadP.createConversation(title, settings)
      await loadThreads(1)
      return threadId
    } catch (error) {
      console.error('创建会话失败:', error)
      throw error
    }
  }

  const setActiveThread = async (threadId: string) => {
    try {
      // 如果当前会话状态为completed或error，从状态map中移除
      if (
        threadsWorkingStatus.value.get(threadId) === 'completed' ||
        threadsWorkingStatus.value.get(threadId) === 'error'
      ) {
        threadsWorkingStatus.value.delete(threadId)
      }

      activeThreadId.value = threadId
      messages.value = []
      await threadP.setActiveConversation(threadId)
      // no need to load messages and chat config here, because they will be loaded when the conversation-activated event is triggered
      // await loadMessages()
      // await loadChatConfig() // 加载对话配置
    } catch (error) {
      console.error('设置活动会话失败:', error)
      throw error
    }
  }

  const clearActiveThread = async () => {
    if (!activeThreadId.value) return
    await threadP.clearActiveThread()
    activeThreadId.value = null
  }

  // 处理消息的 extra 信息
  const enrichMessageWithExtra = async (message: Message): Promise<Message> => {
    if (
      Array.isArray((message as AssistantMessage).content) &&
      (message as AssistantMessage).content.some((block) => block.extra)
    ) {
      const attachments = await threadP.getMessageExtraInfo(message.id, 'search_result')
      // 更新消息中的 extra 信息
      ;(message as AssistantMessage).content = (message as AssistantMessage).content.map(
        (block) => {
          if (block.type === 'search' && block.extra) {
            return {
              ...block,
              extra: {
                ...block.extra,
                pages: attachments.map((attachment) => ({
                  title: attachment.title,
                  url: attachment.url,
                  content: attachment.content,
                  description: attachment.description,
                  icon: attachment.icon
                }))
              }
            }
          }
          return block
        }
      )
      // 处理变体消息的 extra 信息
      const assistantMessage = message as AssistantMessage
      if (assistantMessage.variants && assistantMessage.variants.length > 0) {
        assistantMessage.variants = await Promise.all(
          assistantMessage.variants.map((variant) => enrichMessageWithExtra(variant))
        )
      }
    }

    return message
  }

  const loadMessages = async () => {
    if (!activeThreadId.value) return

    try {
      const result = await threadP.getMessages(activeThreadId.value, 1, 100)
      // 合并数据库消息和缓存中的消息
      const mergedMessages = [...result.list]
      console.log("mergedMessages");
      console.log(mergedMessages);
      // 查找当前会话的缓存消息
      for (const [, cached] of generatingMessagesCache.value) {
        if (cached.threadId === activeThreadId.value) {
          const message = cached.message
          if (message.is_variant && message.parentId) {
            // 如果是变体消息，找到父消息并添加到其 variants 数组中
            const parentMsg = mergedMessages.find((m) => m.parentId === message.parentId)
            if (parentMsg) {
              if (!parentMsg.variants) {
                parentMsg.variants = []
              }
              const existingVariantIndex = parentMsg.variants.findIndex((v) => v.id === message.id)
              if (existingVariantIndex !== -1) {
                parentMsg.variants[existingVariantIndex] = await enrichMessageWithExtra(message)
              } else {
                parentMsg.variants.push(await enrichMessageWithExtra(message))
              }
            }
          } else {
            // 如果是非变体消息，直接更新或添加到消息列表
            const existingIndex = mergedMessages.findIndex((m) => m.id === message.id)
            if (existingIndex !== -1) {
              mergedMessages[existingIndex] = await enrichMessageWithExtra(message)
            } else {
              mergedMessages.push(await enrichMessageWithExtra(message))
            }
          }
        }
      }

      // 处理所有消息的 extra 信息
      messages.value = (await Promise.all(
        mergedMessages.map((msg) => enrichMessageWithExtra(msg))
      )) as AssistantMessage[] | UserMessage[]
      console.log("messages.value");
      console.log(messages.value);
    } catch (error) {
      console.error('加载消息失败:', error)
      throw error
    }
  }

  const sendMessageByZpilot = async (content: UserMessageContent | AssistantMessageBlock[]) => {
      console.log("sendMessage started", activeThreadId.value)
      console.log("zpilot")
    if (!activeThreadId.value || !content) return

    try {
      // 清除之前的 artifact，避免新消息发送时旧的 artifact 仍然显示
      const artifactStore = useArtifactStore()
      artifactStore.hideArtifact()

      generatingThreadIds.value.add(activeThreadId.value)
      // 设置当前会话的workingStatus为working
      updateThreadWorkingStatus(activeThreadId.value, 'working')
      // Check if there's an active agent and this is a user message
      let isAgentMode = false;


      const aiResponseMessage = await threadP.sendMessage(
        activeThreadId.value,
        JSON.stringify(content),
        'user'
      )

      // 将消息添加到缓存
      generatingMessagesCache.value.set(aiResponseMessage.id, {
        message: aiResponseMessage,
        threadId: activeThreadId.value
      })

      await loadMessages()

        console.log("zpilot mode");
        isAgentMode = true;
        // Get agents for this zpilot
        const zpilotAgents = activeZpilot.value.agents || [];

        if (zpilotAgents.length > 0) {
          // Create a planner prompt to determine how to execute the agents
          const plannerPrompt = [
            {
              role: 'system',
              content: `You are a planner that determines how to execute agents based on the user's input.
An agent is an AI assistant with specific capabilities and knowledge.
You will be given a list of available agents and a user query.
Your task is to plan the execution sequence of these agents to best address the user's query.
For each agent, explain briefly how it should be used in the context of the user's request.
Respond with a JSON array of objects, each containing 'agent_slug' and 'instructions' fields.`
            },
            {
              role: 'user',
              content: `Available agents:
${zpilotAgents.map(agent => `- ${agent.name} (slug: ${agent.slug}): ${agent.description || t('no-description')}`).join('\n')}

User query: ${content.text}

How should these agents be executed? Respond with a JSON array of execution steps.`
            }
          ]

          // Get model settings from the chat config
          const providerId = chatConfig.value.providerId
          const modelId = chatConfig.value.modelId

          if (providerId && modelId) {
            try {
              // Generate the plan
              const planResult = await llmPresenter.generateCompletion(
                providerId,
                plannerPrompt,
                modelId,
                0.7,  // temperature
                1000  // maxTokens
              )

              console.log("planResult", planResult);

              // Parse the execution plan
              let executionPlan;
              try {
                // Extract JSON if there's any surrounding text
                const jsonMatch = planResult.match(/\[[\s\S]*\]/);
                const jsonStr = jsonMatch ? jsonMatch[0] : planResult;
                executionPlan = JSON.parse(jsonStr);
              } catch (error) {
                console.error("Failed to parse execution plan:", error);
                await handleStreamResponse({
                  eventId: activeThreadId.value,
                  content: "I couldn't create a valid execution plan. Please try again with a clearer request.",
                });
                return;
              }

              if (executionPlan && executionPlan.length > 0) {
                // Create a message indicating the execution plan
                const agentNames = executionPlan.map(step => {
                  const agent = zpilotAgents.find(a => a.slug === step.agent_slug);
                  return agent ? agent.name : step.agent_slug;
                }).join(', ');

                await handleStreamResponse({
                  eventId: activeThreadId.value,
                  content: `I'll execute the following agents in sequence: ${agentNames}.`,
                });
                await loadMessages();

                console.log("executionPlan", executionPlan)

                // Execute each agent in the plan
                for (const step of executionPlan) {
                  const agent = zpilotAgents.find(a => a.slug === step.agent_slug);
                  if (agent) {
                    try {
                      // Set the active agent
                      setAgent({
                        id: agent.id,
                        name: agent.name,
                        slug: agent.slug,
                        prompt: agent.prompt
                      });

                      // // Create a message with the agent's instructions
                      // await handleStreamResponse({
                      //   eventId: activeThreadId.value,
                      //   content: `Executing agent: ${agent.name}\nInstructions: ${step.instructions}`,
                      // });

                      // // AI 메시지 내용 직접 수정
                      // await threadP.messageManager.editMessage(
                      //   aiResponseMessage.id,
                      //   JSON.stringify([{
                      //     type: 'text',
                      //     content: '원하는 AI 응답 내용',
                      //     status: 'success'
                      //   }])
                      // )

                      await loadMessages();

                      // Create a user message for the agent
                      const agentMessage = {
                        text: content.text + "\n\n" + "Specific instructions: " + step.instructions,
                        files: [],
                        links: [],
                        isPreventingAgentMode: true // Prevent recursive agent execution
                      };

                      // Send the message to the agent
                      await sendMessageByAgent(agentMessage, true);
                    } catch (error) {
                      console.error(`Error executing agent ${agent.name}:`, error);
                      await handleStreamResponse({
                        eventId: activeThreadId.value,
                        content: `Error executing agent ${agent.name}: ${error.message || t('sync.error.unknown')}`,
                      });
                    }
                  }
                }

                // Clear the active agent when done
                clearAgent();
                return;
              } else {
                await handleStreamResponse({
                  eventId: activeThreadId.value,
                  content: t('i-couldnt-determine-which-agents-to-execute-please-try-again-with-a-clearer-request'),
                });
              }
            } catch (error) {
              console.error("Error in zpilot execution:", error);
              await handleStreamResponse({
                eventId: activeThreadId.value,
                content: `Error in zpilot execution: ${error.message || t('sync.error.unknown')}`,
              });
            } finally {
              // Clear the zpilot when done
              clearZpilot();
            }
          }
        }

    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }

  const sendMessageByAgent = async (content: UserMessageContent | AssistantMessageBlock[], isFromZpilot: boolean = false) => {
    console.log("sendMessageByAgent started", activeThreadId.value, isFromZpilot ? "from zpilot" : "")

      console.log("agent mode");
    if (!activeThreadId.value || !content) return

    try {
      // 清除之前的 artifact，避免新消息발송시 旧的 artifact 仍然显示
      const artifactStore = useArtifactStore()
      artifactStore.hideArtifact()

      generatingThreadIds.value.add(activeThreadId.value)
      // 设置当前会话的workingStatus为working
      updateThreadWorkingStatus(activeThreadId.value, 'working')
      // Check if there's an active agent and this is a user message
      let isAgentMode = false;

      let aiResponseMessage;

      console.log("agent mode");
      // console.log(content);
      // console.log(content.text);
      // const sqlCheckPrompt = `\n\n[Prompt]\n\n${content.text}\n\n[Agent Prompt]\n\n${activeAgent.value.prompt}`;
      // console.log(sqlCheckPrompt);
      // isAgentMode = true;
      // // Get zents for this agent
      // const agentZents = zentStore.zents.value.filter(zent => zent.agent === activeAgent.value.slug)
      //
      //
      // // Get model settings from the chat config
      // const providerId = chatConfig.value.providerId
      // const modelId = chatConfig.value.modelId
      //
      // let isUsingSql = false;
//       let sqlCheck = await llmPresenter.generateCompletion(
//         providerId,
//         [
//             {
//               role: 'system',
//               content: `유저의 프롬프트 내용이 로컬 데이터베이스를 참고해야되는거면 SQL 문으로 반환해줘.  관련된 내용이 아니면 null 로 반환해줘. 답변 줄 때 다른 추가 설명은 반환하지말고 SQL 문 또는 null 로만 반환해줘. 유저가 만약 뭔가 액션을 해달라는거면 코드를 짜주는게 맞으니까 쿼리는 하지말고 null 로만 반환하는게 맞아.`
//             },
//             {
//               role: 'user',
//               content: sqlCheckPrompt
//             }
//           ],
//         modelId,
//         0.7,  // temperature
//         1000  // maxTokens
//       )
//
//       console.log("SQL Check Result before :", sqlCheck);
//       sqlCheck = sqlCheck?.trim().split('```sql')[sqlCheck.split('```sql').length - 1].split('```')[0];
//
//       console.log("SQL Check Result:", sqlCheck);
//
//       // Check if the result contains an SQL query
//       if (sqlCheck && sqlCheck?.trim().toLowerCase() !== 'null' && !sqlCheck.includes('null')) {
//         isUsingSql = true;
//         console.log("Using SQL query:", sqlCheck);
//
//         try {
//           // Get the agent's database path
//           const agentSQLitePresenter = usePresenter('agentSQLitePresenter');
//           const genericSQLitePresenter = usePresenter('genericSQLitePresenter');
//
//           // Get the database path for the current agent
//           const dbPath = await agentSQLitePresenter.getAgentDatabasePath(activeAgent.value.slug);
//           console.log("dbPath:", dbPath);
//
//           // Execute the SQL query
//           const queryResult = await genericSQLitePresenter.executeQuery(dbPath, sqlCheck);
//           console.log("queryResult:", queryResult);
//
//           // Format the query result as a message
//           let formattedResult = '';
//           if (queryResult && queryResult.length > 0) {
//             formattedResult = JSON.stringify(queryResult, null, 2);
//
//             // Create a prompt with the database results for the LLM
//             content.text = `[User Prompt]
//
// ${content.text}
//
// [Reference SQL Query executed]
//
// ${sqlCheck}
//
// [Reference Query results]
//
// ${formattedResult}
//
// Reference 쿼리 결과가 User Prompt의 프롬프트에 답변이나 참고가 될 수 있으면 그걸 토대로 답변해줘.`;
//             content.content[0].content = content.text
//           }
//           // return;
//         } catch (error) {
//           console.error("Error executing SQL query:", error);
//         }
//       }
//
//       console.log("sql checked");
//       console.log(content);
//       console.log(content.text);

      console.log("sendMessageByAgent activeAgent");
      console.log(activeAgent);

//       if (agentZents.length > 0) {
//           // Create a decider prompt to determine which zents to use
//           const deciderPrompt = [
//             {
//               role: 'system',
//               content: `You are a decision maker that determines which zents should be executed based on the user's input.
// A zent is a predefined workflow with specific tools and capabilities.
// You will be given a list of available zents and a user query.
// Your task is to select the most appropriate zents for the query, or indicate if none of the available zents are suitable.
// You can select multiple zents multiple times if needed.
// Respond with a comma-separated list of the slugs of the selected zents, or "NONE" if no zent is appropriate.`
//             },
//             {
//               role: 'user',
//               content: `Available zents:
// ${agentZents.map(zent => `- ${zent.name} (slug: ${zent.slug}): ${zent.description || t('no-description')}`).join('\n')}
//
// User query: ${content.text}
//
// Which zents should be executed? Respond with a comma-separated list of slugs or "NONE".`
//             }
//           ]
//
//           if (providerId && modelId) {
//             try {
//               // Generate the decision
//               const decisionResult = await llmPresenter.generateCompletion(
//                 providerId,
//                 deciderPrompt,
//                 modelId,
//                 0.7,  // temperature
//                 1000  // maxTokens
//               )
//
//               console.log("decisionResult", decisionResult);
//
//               // Extract the zent slugs from the result
//               const zentSlugs = decisionResult.trim().split(',').map(slug => slug.trim())
//
//               // Find the selected zents
//               const selectedZents = agentZents.filter(zent =>
//                 zentSlugs.some(slug =>
//                   zent.slug === slug ||
//                   slug.includes(zent.slug)
//                 )
//               )
//
//               console.log("agentZents", agentZents);
//               console.log("selectedZents", selectedZents);
//
//               if (selectedZents.length > 0 && !zentSlugs.includes("NONE")) {
//                 // Create a message indicating which zents will be executed
//                 const zentNames = selectedZents.map(zent => zent.name).join(', ');
//
//                 // // 이건 되는데 한 번 넣으면 더 이상 안 되서 막음
//                 // await handleStreamResponse({
//                 //     eventId: activeThreadId.value,
//                 //     content: `I'll execute the following zents: ${zentNames}.`,
//                 // });
//                 // await loadMessages()
//
//                 let lastThreadId = activeThreadId.value;
//
//                 for (const zent of selectedZents) {
//                   try {
//                     // Generate a customized prompt for the zent
// //                     const promptGenerationResult = await llmPresenter.generateCompletion(
// //                       providerId,
// //                       [
// //                         {
// //                           role: 'system',
// //                           content: `You are a prompt customizer. Your task is to review and modify a prompt template based on the user's input.
// // The prompt template will be used to execute a zent (a predefined workflow).
// // Modify the prompt to better match the user's specific request while preserving the original intent of the template.
// // Respond with ONLY the modified prompt text.`
// //                         },
// //                         {
// //                           role: 'user',
// //                           content: `Original prompt template:
// // ${zent.prompt}
// //
// // User input:
// // ${content.text}
// //
// // Please provide the customized prompt:`
// //                         }
// //                       ],
// //                       modelId,
// //                       0.7,  // temperature
// //                       1000  // maxTokens
// //                     );
// //                     console.log(`execute zent ${zent.name} started`, promptGenerationResult.trim());
// //                     const threadId = await executeZent(
// //                       zent,
// //                       promptGenerationResult.trim(),
// //                       zent.tool_calls,
// //                       zent.tool_calls.map(() => true),
// //                       t,
// //                       activeThreadId.value
// //                     );
//
//                     console.log(`execute zent ${zent.name} started`, zent.prompt);
//                     const threadId = await executeZent(
//                       zent,
//                       zent.prompt,
//                       zent.tool_calls,
//                       zent.tool_calls.map(() => true),
//                       t,
//                       activeThreadId.value
//                     );
//                     // lastThreadId = threadId;
//                     await loadMessages()
//                     console.log(`execute zent ${zent.name} finished`);
//                   } catch (error) {
//                     console.error(`Failed to execute zent ${zent.name}:`, error);
//                   }
//                 }
//
//                 // Start stream completion if from zpilot
//                 if (isFromZpilot) {
//                   const currentAgentId = activeAgent.value ? activeAgent.value.id : undefined
//                   await threadP.startStreamCompletion(activeThreadId.value, undefined, currentAgentId)
//                   return undefined
//                 }
//
//                 // Return the ID of the last thread created
//                 return aiResponseMessage?.id;
//               } else {
//                 // If no zents to execute, set isAgentMode to false and start stream completion if from zpilot
//                 isAgentMode = false;
//                 if (isFromZpilot) {
//                   const currentAgentId = activeAgent.value ? activeAgent.value.id : undefined
//                   await threadP.startStreamCompletion(activeThreadId.value, undefined, currentAgentId)
//                   return undefined
//                 }
//               }
//             } catch (error) {
//               console.error('Failed to determine zent:', error)
//               isAgentMode = false;
//               if (isFromZpilot) {
//                 const currentAgentId = activeAgent.value ? activeAgent.value.id : undefined
//                 await threadP.startStreamCompletion(activeThreadId.value, undefined, currentAgentId)
//                 return undefined
//               }
//             }
//           } else {
//             isAgentMode = false;
//             if (isFromZpilot) {
//               const currentAgentId = activeAgent.value ? activeAgent.value.id : undefined
//               await threadP.startStreamCompletion(activeThreadId.value, undefined, currentAgentId)
//               return undefined
//             }
//           }
//         }
//         else {
//             isAgentMode = false;
//             if (isFromZpilot) {
//               const currentAgentId = activeAgent.value ? activeAgent.value.id : undefined
//               await threadP.startStreamCompletion(activeThreadId.value, undefined, currentAgentId)
//               return undefined
//             }
//           }
      if (!isAgentMode) {
        // If called from zpilot, we don't need to send another user message
        if (isFromZpilot) {
          const currentAgentId = activeAgent.value ? activeAgent.value.id : undefined
          await threadP.startStreamCompletion(activeThreadId.value, undefined, currentAgentId)
          return undefined
        } else {
          generatingThreadIds.value.add(activeThreadId.value)
          updateThreadWorkingStatus(activeThreadId.value, 'working')
          const aiResponseMessage = await threadP.sendMessage(
            activeThreadId.value,
            JSON.stringify(content),
            'user'
          )
          generatingMessagesCache.value.set(aiResponseMessage.id, {
            message: aiResponseMessage,
            threadId: activeThreadId.value
          })
          await loadMessages()
          const currentAgentId = activeAgent.value ? activeAgent.value.id : undefined
          await threadP.startStreamCompletion(activeThreadId.value, undefined, currentAgentId)
          return aiResponseMessage?.id
        }
      }

    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }

  const sendMessage = async (content: UserMessageContent | AssistantMessageBlock[]) => {
      console.log("sendMessage started", activeThreadId.value)
    if (!activeThreadId.value || !content) return

    try {
      // 清除之前的 artifact，避免新消息发送时旧的 artifact 仍然显示
      const artifactStore = useArtifactStore()
      artifactStore.hideArtifact()

      if (activeZpilot.value && typeof content === 'object' && 'text' in content && !content.isPreventingAgentMode) {
        sendMessageByZpilot(content)
      } else if (activeAgent.value && typeof content === 'object' && 'text' in content && !content.isPreventingAgentMode) {
        sendMessageByAgent(content)
        }
      else {
        generatingThreadIds.value.add(activeThreadId.value)
        // 设置当前会话的workingStatus为working
        updateThreadWorkingStatus(activeThreadId.value, 'working')
        // Check if there's an active agent and this is a user message

        const aiResponseMessage = await threadP.sendMessage(
          activeThreadId.value,
          JSON.stringify(content),
          'user'
        )

        // 将消息添加到缓存
        generatingMessagesCache.value.set(aiResponseMessage.id, {
          message: aiResponseMessage,
          threadId: activeThreadId.value
        })

        await loadMessages()
        const currentAgentId = activeAgent.value ? activeAgent.value.id : undefined
      console.log("sendMessage activeAgent");
      console.log(activeAgent.value);
          await threadP.startStreamCompletion(activeThreadId.value, undefined, currentAgentId)
        return aiResponseMessage?.id
      }

    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }

  const showMessage = async (content: UserMessageContent | AssistantMessageBlock[]) => {
    if (!activeThreadId.value || !content) return

    try {
      generatingThreadIds.value.add(activeThreadId.value)
      // 设置当前会话的workingStatus为working
      updateThreadWorkingStatus(activeThreadId.value, 'working')
      const aiResponseMessage = await threadP.showMessage(
        activeThreadId.value,
        JSON.stringify(content),
        'user'
      )

      // 将消息添加到缓存
      generatingMessagesCache.value.set(aiResponseMessage.id, {
        message: aiResponseMessage,
        threadId: activeThreadId.value
      })

      await loadMessages()
      // await threadP.startStreamCompletion(activeThreadId.value)
      // const state = await threadP.getGeneratingMessageState(activeThreadId.value);
      // console.log("threadP state");
      // console.log(state);
      //
      // state.message.content.push({
      //     type: 'error',
      //     content: 'common.error.noModelResponse',
      //     status: 'error',
      //     timestamp: Date.now()
      //   })

    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }

    return activeThreadId.value
  }

  const retryMessage = async (messageId: string) => {
    if (!activeThreadId.value) return
    try {
      const aiResponseMessage = await threadP.retryMessage(messageId, chatConfig.value.modelId)
      // 将消息添加到缓存
      generatingMessagesCache.value.set(aiResponseMessage.id, {
        message: aiResponseMessage,
        threadId: activeThreadId.value
      })
      await loadMessages()
      generatingThreadIds.value.add(activeThreadId.value)
      // 设置当前会话的workingStatus为working
      updateThreadWorkingStatus(activeThreadId.value, 'working')
      const currentAgentId = activeAgent.value ? activeAgent.value.id : undefined
      console.log("retry message activeAgent");
      console.log(activeAgent);
      // console.log(this.activeAgent);
      await threadP.startStreamCompletion(activeThreadId.value, messageId, currentAgentId)
    } catch (error) {
      console.error('重试消息失败:', error)
      throw error
    }
  }

  // 创建会话分支（从指定消息开始fork一个新会话）
  const forkThread = async (messageId: string, forkTag: string = '(fork)') => {
    if (!activeThreadId.value) return

    try {
      // 获取当前会话信息
      const currentThread = await threadP.getConversation(activeThreadId.value)

      // 创建分支会话标题
      const newThreadTitle = `${currentThread.title} ${forkTag}`

      // 调用main层的forkConversation方法
      const newThreadId = await threadP.forkConversation(
        activeThreadId.value,
        messageId,
        newThreadTitle,
        currentThread.settings
      )

      // 重新加载会话列表
      await loadThreads(1)

      // 切换到新会话
      await setActiveThread(newThreadId)

      return newThreadId
    } catch (error) {
      console.error('创建会话分支失败:', error)
      throw error
    }
  }

  const handleStreamResponse = (msg: {
    eventId: string
    content?: string
    reasoning_content?: string
    tool_call_id?: string
    tool_call_name?: string
    tool_call_params?: string
    tool_call_response?: string
    maximum_tool_calls_reached?: boolean
    tool_call_server_name?: string
    tool_call_server_icons?: string
    tool_call_server_description?: string
    tool_call?: 'start' | 'end' | 'error'
    totalUsage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
    tool_call_response_raw?: unknown
    image_data?: {
      data: string
      mimeType: string
    }
  }) => {
    // 从缓存中查找消息
    let cached = generatingMessagesCache.value.get(msg.eventId)
    if (!cached) {
      cached = Object.values(Object.fromEntries(toRaw(generatingMessagesCache.value)))[0];
    }
    if (cached) {
      const curMsg = cached.message as AssistantMessage
      if (curMsg.content) {
        // 处理工具调用达到最大次数的情况
        if (msg.maximum_tool_calls_reached) {
          const lastBlock = curMsg.content[curMsg.content.length - 1]
          if (lastBlock) {
            lastBlock.status = 'success'
          }
          curMsg.content.push({
            type: 'action',
            content: 'common.error.maximumToolCallsReached',
            status: 'success',
            timestamp: Date.now(),
            action_type: 'maximum_tool_calls_reached',
            tool_call: {
              id: msg.tool_call_id,
              name: msg.tool_call_name,
              params: msg.tool_call_params,
              server_name: msg.tool_call_server_name,
              server_icons: msg.tool_call_server_icons,
              server_description: msg.tool_call_server_description
            },
            extra: {
              needContinue: true
            }
          })
        } else if (msg.tool_call) {
          if (msg.tool_call === 'start') {
            // 创建新的工具调用块
            const lastBlock = curMsg.content[curMsg.content.length - 1]
            if (lastBlock) {
              lastBlock.status = 'success'
            }

            curMsg.content.push({
              type: 'tool_call',
              content: '',
              status: 'loading',
              timestamp: Date.now(),
              tool_call: {
                id: msg.tool_call_id,
                name: msg.tool_call_name,
                params: msg.tool_call_params || '',
                server_name: msg.tool_call_server_name,
                server_icons: msg.tool_call_server_icons,
                server_description: msg.tool_call_server_description
              }
            })
          } else if (msg.tool_call === 'end' || msg.tool_call === 'error') {
            // 查找对应的工具调用块
            const existingToolCallBlock = curMsg.content.find(
              (block) =>
                block.type === 'tool_call' &&
                ((msg.tool_call_id && block.tool_call?.id === msg.tool_call_id) ||
                  block.tool_call?.name === msg.tool_call_name) &&
                block.status === 'loading'
            )
            if (existingToolCallBlock && existingToolCallBlock.type === 'tool_call') {
              if (msg.tool_call === 'error') {
                existingToolCallBlock.status = 'error'
                if (existingToolCallBlock.tool_call) {
                  existingToolCallBlock.tool_call.response =
                    msg.tool_call_response || 'tool call failed'
                }
              } else {
                existingToolCallBlock.status = 'success'
                if (msg.tool_call_response && existingToolCallBlock.tool_call) {
                  existingToolCallBlock.tool_call.response = msg.tool_call_response
                }
              }
            }
          }
        }
        // 处理图像数据
        else if (msg.image_data) {
          const lastBlock = curMsg.content[curMsg.content.length - 1]
          if (lastBlock) {
            lastBlock.status = 'success'
          }

          curMsg.content.push({
            type: 'image',
            content: 'image',
            status: 'success',
            timestamp: Date.now(),
            image_data: {
              data: msg.image_data.data,
              mimeType: msg.image_data.mimeType
            }
          })
        }
        // 处理普通内容
        else if (msg.content) {
          const lastContentBlock = curMsg.content[curMsg.content.length - 1]
          if (lastContentBlock && lastContentBlock.type === 'content') {
            lastContentBlock.content += msg.content
          } else {
            if (lastContentBlock) {
              lastContentBlock.status = 'success'
            }
            curMsg.content.push({
              type: 'content',
              content: msg.content,
              status: 'loading',
              timestamp: Date.now()
            })
          }
        }

        // 处理推理内容
        if (msg.reasoning_content) {
          const lastReasoningBlock = curMsg.content[curMsg.content.length - 1]
          if (lastReasoningBlock && lastReasoningBlock.type === 'reasoning_content') {
            lastReasoningBlock.content += msg.reasoning_content
          } else {
            if (lastReasoningBlock) {
              lastReasoningBlock.status = 'success'
            }
            curMsg.content.push({
              type: 'reasoning_content',
              content: msg.reasoning_content,
              status: 'loading',
              timestamp: Date.now()
            })
          }
        }
      }

      // 处理使用情况统计
      if (msg.totalUsage) {
        curMsg.usage = {
          ...curMsg.usage,
          total_tokens: msg.totalUsage.total_tokens,
          input_tokens: msg.totalUsage.prompt_tokens,
          output_tokens: msg.totalUsage.completion_tokens
        }
      }

      // 如果是当前激活的会话，更新显示
      if (cached.threadId === activeThreadId.value) {
        const msgIndex = messages.value.findIndex((m) => m.id === msg.eventId)
        if (msgIndex !== -1) {
          messages.value[msgIndex] = curMsg
        }
      }
    }
  }

  const handleStreamEnd = async (msg: { eventId: string }) => {
    // 从缓存中移除消息
    console.log("handleStreamEnd")
    let cached = generatingMessagesCache.value.get(msg.eventId)
    if (!cached) {
      cached = Object.values(Object.fromEntries(toRaw(generatingMessagesCache.value)))[0];
    }
    if (cached) {
      // 获取最新的消息并处理 extra 信息
      const updatedMessage = await threadP.getMessage(msg.eventId)
      // console.log("updatedMessage");
      // console.log(updatedMessage);
      let enrichedMessage = null;
      if (updatedMessage) {
        enrichedMessage = await enrichMessageWithExtra(updatedMessage)
      }


      generatingMessagesCache.value.delete(msg.eventId)
      generatingThreadIds.value.delete(cached.threadId)
      // 设置会话的workingStatus为completed
      // 如果是当前活跃的会话，则直接从Map中移除
      if (activeThreadId.value === cached.threadId) {
        threadsWorkingStatus.value.delete(cached.threadId)
      } else {
        updateThreadWorkingStatus(cached.threadId, 'completed')
      }

      // 检查窗口是否聚焦，如果未聚焦则发送通知
      const isFocused = await windowP.isMainWindowFocused()
      if (!isFocused) {
        // 获取生成内容的前20个字符作为通知内容
        let notificationContent = ''
        if (enrichedMessage && (enrichedMessage as AssistantMessage).content) {
          const assistantMsg = enrichedMessage as AssistantMessage
          // 从content中提取文本内容
          for (const block of assistantMsg.content) {
            if (block.type === 'content' && block.content) {
              notificationContent = block.content.substring(0, 20)
              if (block.content.length > 20) notificationContent += '...'
              break
            }
          }
        }

        // 发送通知
        await notificationP.showNotification({
          id: `chat/${cached.threadId}/${msg.eventId}`,
          title: t('chat.notify.generationComplete'),
          body: notificationContent || t('chat.notify.generationComplete')
        })
      }

      // 如果是变体消息，需要更新主消息
      if (enrichedMessage && enrichedMessage.is_variant && enrichedMessage.parentId) {
        // 获取主消息
        const mainMessage = await threadP.getMainMessageByParentId(
          cached.threadId,
          enrichedMessage.parentId
        )

        if (mainMessage) {
          const enrichedMainMessage = await enrichMessageWithExtra(mainMessage)
          // 如果是当前激活的会话，更新显示
          if (cached.threadId === activeThreadId.value) {
            const mainMsgIndex = messages.value.findIndex((m) => m.id === mainMessage.id)
            if (mainMsgIndex !== -1) {
              messages.value[mainMsgIndex] = enrichedMainMessage as AssistantMessage | UserMessage
            }
          }
        }
      } else {
        // 如果是当前激活的会话，更新显示
        if (cached.threadId === activeThreadId.value) {
          const msgIndex = messages.value.findIndex((m) => m.id === msg.eventId)
          if (msgIndex !== -1) {
            messages.value[msgIndex] = enrichedMessage as AssistantMessage | UserMessage
          }
        }
      }

      // 检查是否需要更新标题（仅在对话刚开始时）
      if (cached.threadId === activeThreadId.value) {
        const thread = await threadP.getConversation(cached.threadId)
        const { list: messages } = await threadP.getMessages(cached.threadId, 1, 10)
        // 只有当对话刚开始（只有一问一答两条消息）时才生成标题
        if (messages.length === 2 && thread && thread.is_new === 1) {
          try {
            console.info('自动生成标题 start', messages.length, thread)
            await threadP.summaryTitles().then(async (title) => {
              if (title) {
                console.info('自动生成标题', title)
                await threadP.renameConversation(cached.threadId, title)
                // 重新加载会话列表以更新标题
                await loadThreads(1)
              }
            })
          } catch (error) {
            console.error('自动生成标题失败:', error)
          }
        }
      }
      loadThreads(1)
    }

      // Refresh zentrun usage stats if provider is zentrun
      await refreshZentrunUsage()
  }

  const handleStreamError = async (msg: { eventId: string }) => {
    // 从缓存中获取消息
    let cached = generatingMessagesCache.value.get(msg.eventId)
    if (!cached) {
      cached = Object.values(Object.fromEntries(toRaw(generatingMessagesCache.value)))[0];
    }
    if (cached) {
      if (cached.threadId === activeThreadId.value) {
        try {
          const updatedMessage = await threadP.getMessage(msg.eventId)
          const enrichedMessage = await enrichMessageWithExtra(updatedMessage)

          if (enrichedMessage.is_variant && enrichedMessage.parentId) {
            // 处理变体消息的错误状态
            const parentMsgIndex = messages.value.findIndex(
              (m) => m.id === enrichedMessage.parentId
            )
            if (parentMsgIndex !== -1) {
              const parentMsg = messages.value[parentMsgIndex] as AssistantMessage
              if (!parentMsg.variants) {
                parentMsg.variants = []
              }
              const variantIndex = parentMsg.variants.findIndex((v) => v.id === enrichedMessage.id)
              if (variantIndex !== -1) {
                parentMsg.variants[variantIndex] = enrichedMessage
              } else {
                parentMsg.variants.push(enrichedMessage)
              }
              messages.value[parentMsgIndex] = { ...parentMsg }
            }
          } else {
            // 非变体消息的原有错误处理逻辑
            const messageIndex = messages.value.findIndex((m) => m.id === msg.eventId)
            if (messageIndex !== -1) {
              messages.value[messageIndex] = enrichedMessage as AssistantMessage | UserMessage
            }
          }

          // 检查窗口是否聚焦，如果未聚焦则发送错误通知
          const isFocused = await windowP.isMainWindowFocused()
          if (!isFocused) {
            // 获取错误信息
            let errorMessage = t('chat.notify.generationError')
            if (enrichedMessage && (enrichedMessage as AssistantMessage).content) {
              const assistantMsg = enrichedMessage as AssistantMessage
              // 查找错误信息块
              for (const block of assistantMsg.content) {
                if (block.status === 'error' && block.content) {
                  errorMessage = block.content.substring(0, 20)
                  if (block.content.length > 20) errorMessage += '...'
                  break
                }
              }
            }

            // 发送错误通知
            await notificationP.showNotification({
              id: `error-${msg.eventId}`,
              title: t('chat.notify.generationError'),
              body: errorMessage
            })
          }
        } catch (error) {
          console.error('加载错误消息失败:', error)
        }
      }
      generatingMessagesCache.value.delete(msg.eventId)
      generatingThreadIds.value.delete(cached.threadId)
      // 设置会话的workingStatus为error
      // 如果是当前活跃的会话，则直接从Map中移除
      if (activeThreadId.value === cached.threadId) {
        threadsWorkingStatus.value.delete(cached.threadId)
      } else {
        updateThreadWorkingStatus(cached.threadId, 'error')
      }
    }
  }

  const renameThread = async (threadId: string, title: string) => {
    await threadP.renameConversation(threadId, title)
    loadThreads(1)
  }
  const toggleThreadPinned = async (threadId: string, isPinned: boolean) => {
    await threadP.toggleConversationPinned(threadId, isPinned)
    loadThreads(1)
  }
  // 配置相关的方法
  const loadChatConfig = async () => {
    if (!activeThreadId.value) return
    try {
      const conversation = await threadP.getConversation(activeThreadId.value)
      const threadToUpdate = threads.value
        .flatMap((thread) => thread.dtThreads)
        .find((t) => t.id === activeThreadId.value)
      if (threadToUpdate) {
        Object.assign(threadToUpdate, conversation)
      }
      if (conversation) {
        chatConfig.value = { ...conversation.settings }
      }
      // console.log('loadChatConfig', chatConfig.value)
    } catch (error) {
      console.error('加载对话配置失败:', error)
      throw error
    }
  }

  const saveChatConfig = async () => {
    if (!activeThreadId.value) return
    try {
      await threadP.updateConversationSettings(activeThreadId.value, chatConfig.value)
    } catch (error) {
      console.error('保存对话配置失败:', error)
      throw error
    }
  }

  const updateChatConfig = async (newConfig: Partial<CONVERSATION_SETTINGS>) => {
    chatConfig.value = { ...chatConfig.value, ...newConfig }
    await saveChatConfig()
    await loadChatConfig() // 加载对话配置
  }

  const deleteMessage = async (messageId: string) => {
    if (!activeThreadId.value) return
    try {
      await threadP.deleteMessage(messageId)
      loadMessages()
    } catch (error) {
      console.error('删除消息失败:', error)
    }
  }
  const cancelGenerating = async (threadId: string) => {
    if (!threadId) return
    try {
      // 找到当前正在生成的消息
      const generatingMessage = Array.from(generatingMessagesCache.value.entries()).find(
        ([, cached]) => cached.threadId === threadId
      )

      if (generatingMessage) {
        const [messageId] = generatingMessage
        await threadP.stopMessageGeneration(messageId)
        // 从缓存中移除消息
        generatingMessagesCache.value.delete(messageId)
        generatingThreadIds.value.delete(threadId)
        // 设置会话的workingStatus为completed
        // 如果是当前活跃的会话，则直接从Map中移除
        if (activeThreadId.value === threadId) {
          threadsWorkingStatus.value.delete(threadId)
        } else {
          updateThreadWorkingStatus(threadId, 'completed')
        }
        // 获取更新后的消息
        const updatedMessage = await threadP.getMessage(messageId)
        // 更新消息列表中的对应消息
        const messageIndex = messages.value.findIndex((msg) => msg.id === messageId)
        if (messageIndex !== -1) {
          messages.value[messageIndex] = updatedMessage
        }
      }
    } catch (error) {
      console.error('取消生成失败:', error)
    }
  }
  const continueStream = async (conversationId: string, messageId: string) => {
    if (!conversationId || !messageId) return
    try {
      generatingThreadIds.value.add(conversationId)
      // 设置会话的workingStatus为working
      updateThreadWorkingStatus(conversationId, 'working')

      // 创建一个新的助手消息
      const aiResponseMessage = await threadP.sendMessage(
        conversationId,
        JSON.stringify({
          text: 'continue',
          files: [],
          links: [],
          search: false,
          think: false,
          continue: true
        }),
        'user'
      )

      if (!aiResponseMessage) {
        console.error('创建助手消息失败')
        return
      }

      // 将消息添加到缓存
      generatingMessagesCache.value.set(aiResponseMessage.id, {
        message: aiResponseMessage,
        threadId: conversationId
      })

      await loadMessages()
      console.log("activeAgent");
      console.log(activeAgent);
      const currentAgentId = activeAgent.value ? activeAgent.value.id : undefined
      await threadP.continueStreamCompletion(conversationId, messageId, currentAgentId)
    } catch (error) {
      console.error('继续生成失败:', error)
      throw error
    }
  }
  const clearAllMessages = async (threadId: string) => {
    if (!threadId) return
    try {
      await threadP.clearAllMessages(threadId)
      // 清空本地消息列表
      if (threadId === activeThreadId.value) {
        messages.value = []
      }
      // 清空生成缓存中的相关消息
      for (const [messageId, cached] of generatingMessagesCache.value.entries()) {
        if (cached.threadId === threadId) {
          generatingMessagesCache.value.delete(messageId)
        }
      }
      generatingThreadIds.value.delete(threadId)
      // 从状态Map中移除会话状态
      threadsWorkingStatus.value.delete(threadId)
    } catch (error) {
      console.error('清空消息失败:', error)
      throw error
    }
  }

  window.electron.ipcRenderer.on(CONVERSATION_EVENTS.ACTIVATED, (_, msg) => {
    // console.log(CONVERSATION_EVENTS.ACTIVATED, msg)
    activeThreadId.value = msg.conversationId

    // 如果存在状态为completed或error的会话，从Map中移除
    if (activeThreadId.value) {
      const status = threadsWorkingStatus.value.get(activeThreadId.value)
      if (status === 'completed' || status === 'error') {
        threadsWorkingStatus.value.delete(activeThreadId.value)
      }
    }

    loadMessages()
    loadChatConfig() // 加载对话配置
  })
  const handleMessageEdited = async (msgId: string) => {
    // 首先检查是否在生成缓存中
    const cached = generatingMessagesCache.value.get(msgId)
    if (cached) {
      // 如果在缓存中，获取最新的消息
      const updatedMessage = await threadP.getMessage(msgId)
      // 处理 extra 信息
      // console.log("updatedMessage");
      // console.log(updatedMessage);
      const enrichedMessage = await enrichMessageWithExtra(updatedMessage)

      // 更新缓存
      cached.message = enrichedMessage

      // 如果是当前会话的消息，也更新显示
      if (cached.threadId === activeThreadId.value) {
        const msgIndex = messages.value.findIndex((m) => m.id === msgId)
        if (msgIndex !== -1) {
          messages.value[msgIndex] = enrichedMessage
        }
      }
    } else if (activeThreadId.value) {
      // 如果不在缓存中但是当前会话的消息，直接更新显示
      const msgIndex = messages.value.findIndex((m) => m.id === msgId)
      if (msgIndex !== -1) {
        const updatedMessage = await threadP.getMessage(msgId)
        // 处理 extra 信息
        const enrichedMessage = await enrichMessageWithExtra(updatedMessage)
        messages.value[msgIndex] = enrichedMessage
      }
    }
  }

  // 注册消息编辑事件处理
  window.electron.ipcRenderer.on(CONVERSATION_EVENTS.MESSAGE_EDITED, (_, msgId: string) => {
    handleMessageEdited(msgId)
  })

  window.electron.ipcRenderer.on(DEEPLINK_EVENTS.START, async (_, data) => {
    console.log('DEEPLINK_EVENTS.START', data)
    // 检查当前路由，如果不在新会话页面，则跳转
    const currentRoute = router.currentRoute.value
    if (currentRoute.name !== 'chat') {
      await router.push({ name: 'chat' })
    }
    // 检查是否存在 activeThreadId，如果存在则创建新会话
    if (activeThreadId.value) {
      await clearActiveThread()
    }
    // 存储 deeplink 数据到缓存
    if (data) {
      deeplinkCache.value = {
        msg: data.msg,
        modelId: data.modelId,
        systemPrompt: data.systemPrompt,
        autoSend: data.autoSend
      }
    }
  })

  // 清理 Deeplink 缓存
  const clearDeeplinkCache = () => {
    deeplinkCache.value = null
  }

  // Refresh zentrun usage stats
  const refreshZentrunUsage = async () => {
    try {
      if (await isZentrunProvider()) {
        console.log('Refreshing Zentrun usage stats...')
        const response = await apiRequest('/refresh-zentrun/', 'GET')
        console.log('Zentrun usage refreshed:', response)
        localStorage.setItem('user', JSON.stringify(response));
        return response
      }
    } catch (error) {
      console.error('Error refreshing Zentrun usage:', error)
    }
  }

  // Set active agent
  const setAgent = (agent: any) => {
    activeAgent.value = agent
  }

  // Clear active agent
  const clearAgent = () => {
    activeAgent.value = null
  }

  // Set active zpilot
  const setZpilot = (zpilot: any) => {
    activeZpilot.value = zpilot
  }

  // Clear active zpilot
  const clearZpilot = () => {
    activeZpilot.value = null
  }

  // 新增更新会话workingStatus的方法
  const updateThreadWorkingStatus = (threadId: string, status: WorkingStatus) => {
    // 如果是活跃会话，且状态为completed或error，直接从Map中移除
    if (activeThreadId.value === threadId && (status === 'completed' || status === 'error')) {
      // console.log(`活跃会话状态移除: ${threadId}`)
      threadsWorkingStatus.value.delete(threadId)
      return
    }

    // 记录状态变更
    const oldStatus = threadsWorkingStatus.value.get(threadId)
    if (oldStatus !== status) {
      // console.log(`会话状态变更: ${threadId} ${oldStatus || 'none'} -> ${status}`)
      threadsWorkingStatus.value.set(threadId, status)
    }
  }

  // 获取会话工作状态的方法
  const getThreadWorkingStatus = (threadId: string): WorkingStatus | null => {
    return threadsWorkingStatus.value.get(threadId) || null
  }

  // Execute a zent with the given parameters
  const executeZent = async (
    zentData: any,
    editedPrompt: string,
    editedToolCalls: any[],
    lockedInputs: boolean[],
    t: any,
    conversationId: any
  ) => {
    try {
      console.log("executeZent");
      console.log("zentData");
      console.log(zentData);
      console.log(lockedInputs);

      // Process tool calls if they exist

      let threadId = activeThreadId.value;
      // let conversationId;
      console.log("conversationId", conversationId);
      let conversationIdForAnswer = conversationId;
      if (conversationId) {
        console.log("handleStreamResponse", conversationId);
            // await handleStreamResponse({
            //     eventId: conversationId,
            //     content: editedPrompt + "\n\n Preparing... \n\n",
            // });

            // generatingThreadIds.value.add(conversationId)
            // // 设置会话的workingStatus为working
            // updateThreadWorkingStatus(conversationId, 'working')
            //
            // const aiResponseMessage = await threadP.sendMessage(
            //   conversationId,
            //   JSON.stringify({
            //     text: zentData.prompt,
            //     files: [],
            //     links: [],
            //     search: false,
            //     think: false,
            //     continue: true
            //   }),
            //   'user'
            // )
            //
            // // 将消息添加到缓存
            // generatingMessagesCache.value.set(aiResponseMessage.id, {
            //   message: aiResponseMessage,
            //   threadId: conversationId
            // })
            // conversationIdForAnswer = activeThreadId.value;
            // await loadMessages();

      } else {

        console.log("editedToolCalls", editedToolCalls)
        // Get model settings from the chat config (user-selected)
        const modelSettings = {
          systemPrompt: zentData.systemPrompt || '',
          temperature: zentData.temperature || 0.7,
          contextLength: zentData.contextLength || 1000,
          maxTokens: zentData.maxTokens || 2000,
          providerId: chatConfig.value.providerId,
          modelId: chatConfig.value.modelId
        };

        // Create a new thread with the zent name
        threadId = await createThread(zentData.name, modelSettings);
        // Set the active thread
        await setActiveThread(threadId);
        // Format the message as a UserMessageContent object
        const messageContent = {
          text: editedPrompt || '',
          files: [],
          links: [],
          type: 'content',
          think: zentData.think || false,
          isPreventingToolCalls: true, // Prevent automatic tool call generation
          isPreventingAgentMode: true, // Prevent automatic tool call generation
          search: zentData.search || false
        };

        console.log("messageContent", messageContent)
        if (editedToolCalls?.length === 0) {
          await sendMessage(messageContent);
        } else {
          await showMessage(messageContent);
        }
        // Always use the thread ID for the conversation ID
        conversationIdForAnswer = threadId;

        // toast({
        //   title: t('zent.planning.title', 'Planning Tool Calls'),
        //   description: t('zent.planning.description', 'Asking the LLM to plan tool calls based on your prompt...'),
        // });

        console.log("Object.values(lockedInputs).filter(value => value === true).length");
        console.log(Object.values(lockedInputs).filter(value => value === true).length);
        console.log("lockedInputs.length");
        console.log(lockedInputs.length);

        let plannedToolCalls: any[] = [];

        if (Object.values(lockedInputs).filter(value => value === true).length < editedToolCalls.length) {
          // Plan tool calls based on the prompt and editedToolCalls
          plannedToolCalls = await planToolCalls(
            editedPrompt,
            editedToolCalls,
            lockedInputs,
            t
          );
        } else {
          plannedToolCalls = editedToolCalls;
        }

        if (!plannedToolCalls) {
          // toast({
          //   title: t('zent.planning.failed', 'Planning Failed'),
          //   description: t('zent.planning.usingOriginal', 'Using original tool calls instead'),
          //   variant: 'destructive'
          // });
          // Fall back to original tool calls if planning failed
          plannedToolCalls = editedToolCalls;
        } else {
          // toast({
          //   title: t('zent.planning.success', 'Planning Complete'),
          //   description: t('zent.planning.executing', 'Executing planned tool calls...'),
          //   variant: 'default'
          // });
        }

        // Second phase: Execute the planned tool calls
        console.log('Processing planned tool calls:', plannedToolCalls);

        // Process each tool call sequentially
        for (const toolCall of plannedToolCalls) {
          try {
            // Generate a unique ID if not present
            const toolId = toolCall.id || `tool-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            // Parse params if it's a string
            const params = typeof toolCall.params === 'string' ?
              toolCall.params :
              JSON.stringify(toolCall.params);

            // Format the tool call for the MCP presenter
            const mcpToolCall: MCPToolCall = {
              id: toolId,
              type: 'function',
              function: {
                name: toolCall.name,
                arguments: params
              },
              server: {
                name: toolCall.server_name,
                icons: toolCall.server_icons || '',
                description: toolCall.server_description || ''
              }
            };

            // Display tool call start in the thread
            await handleStreamResponse({
                eventId: conversationIdForAnswer,
                tool_call: 'start',
                tool_call_id: mcpToolCall.id,
                tool_call_name: mcpToolCall.function.name,
                tool_call_params: mcpToolCall.function.arguments,
                tool_call_server_name: mcpToolCall.server.name,
                tool_call_server_icons: mcpToolCall.server.icons,
                tool_call_server_description: mcpToolCall.server.description
            });

            const isRunningServer = await mcpPresenter.isServerRunning(mcpToolCall.server.name);
            console.log("mcpPresenter.isServerRunning(mcpToolCall.server.name)");
            console.log(isRunningServer);

            if (!isRunningServer) {
              mcpPresenter.startServer(mcpToolCall.server.name);
            }

            // Call the tool using the MCP presenter
            console.log('Calling tool:', mcpToolCall);
            try {
              const response = await mcpPresenter.callTool(mcpToolCall);
              console.log('Tool response:', response);

              await handleStreamResponse({
                eventId: conversationIdForAnswer,
                tool_call: 'end',
                tool_call_id: mcpToolCall.id,
                tool_call_name: mcpToolCall.function.name,
                tool_call_params: mcpToolCall.function.arguments,
                tool_call_response: response.content,
                tool_call_server_name: mcpToolCall.server.name,
                tool_call_server_icons: mcpToolCall.server.icons,
                tool_call_server_description: mcpToolCall.server.description,
                tool_call_response_raw: response.rawData
              });

              // Add the response to the thread if it was successful
              if (response && !response.isError) {
                // Currently not sending tool responses as separate messages
                // This is intentional as the LLM will handle the response
              } else if (response && response.isError) {
                // toast({
                //   title: t('zent.toolCall.error', 'Tool Call Error'),
                //   description: `${toolCall.name}: ${response.content}`,
                //   variant: 'destructive'
                // });
              }
            } catch (toolError) {
              console.error(`Tool execution error for ${mcpToolCall.function.name}:`, toolError);
              const errorMessage = toolError instanceof Error ? toolError.message : String(toolError);
              // toast({
              //   title: t('zent.toolCall.error', 'Tool Call Error'),
              //   description: `${toolCall.name}: ${errorMessage}`,
              //   variant: 'destructive'
              // });
            }
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            runHistoryStore.addRunHistory({
              type: 'zent',
              status: 'Success',
              run_slug: zentData.slug,
              prompt: editedPrompt,
              tool_calls: editedToolCalls,
              user: user?.id,
              by: user?.username,
              agent: zentData.agent,
              zent: zentData.slug,
              zent_name: zentData.name,
              team: zentData.team,
              organization: zentData.organization
              // data: any // JSON parsed
            });

            try {
              await apiRequest('/zentrun-run-history/', 'POST', {
                type: 'zent',
                status: 'Success',
                run_slug: zentData.slug,
                prompt: editedPrompt,
                tool_calls: editedToolCalls,
                user: user?.id,
                by: user?.username,
                agent: zentData.agent,
                team: zentData.team,
                organization: zentData.organization,
                // data: any // JSON parsed
              });
            } catch (error) {
              console.log(error);
            }

          } catch (error) {
            console.error(`Error processing tool call ${toolCall.name}:`, error);
            toast({
              title: t('zent.toolCall.error', 'Tool Call Error'),
              description: `${toolCall.name}: ${error.message || t('unknown-error')}`,
              variant: 'destructive'
            });
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            runHistoryStore.addRunHistory({
              type: 'zent',
              status: 'Failed',
              status_description: error.message,
              run_slug: zentData.slug,
              prompt: editedPrompt,
              tool_calls: editedToolCalls,
              user: user?.id,
              by: user?.username,
              zent: zentData.slug,
              zent_name: zentData.name,
              agent: zentData.agent,
              team: zentData.team,
              organization: zentData.organization,
              // data: any // JSON parsed
            });

            try {
              await apiRequest('/zentrun-run-history/', 'POST', {
                type: 'zent',
                status: 'Failed',
                status_description: error.message,
                run_slug: zentData.slug,
                prompt: editedPrompt,
                tool_calls: editedToolCalls,
                user: user?.id,
                by: user?.username,
                agent: zentData.agent,
                team: zentData.team,
                organization: zentData.organization,
                // data: any // JSON parsed
              });
            } catch (error) {
              console.log(error);
            }
          }
        }

        // Auto-execute code if enabled in Zent settings
        if (zentData.data?.runningCodeAutoMode && zentData.data?.runningCodeAutoMode !== 'off') {
          try {
            // Send a user message to indicate that code is being executed
            const userMessageId = await threadP.sendMessageByMessageManager(
              conversationIdForAnswer,
              JSON.stringify({
                text: "Running...",
                files: [],
                links: [],
                type: 'content'
              }),
              'user',
              '',
              false,
              {
                totalTokens: 0,
                generationTime: 0,
                firstTokenTime: 0,
                tokensPerSecond: 0,
                inputTokens: 0,
                outputTokens: 0,
                model: chatConfig.value.modelId,
                provider: chatConfig.value.providerId
              }
            );

            console.log("userMessageId");
            console.log(userMessageId);

            // // 将消息添加到缓存
            // generatingMessagesCache.value.set(aiResponseMessage.id, {
            //   message: aiResponseMessage,
            //   threadId: conversationId
            // })

            // await loadMessages()

            console.log("runningCodeAutoMode");
            console.log(zentData.data);
            console.log(zentData.data?.runningCodeAutoMode);
            // Get the latest message content
            // const messages = await threadP.getMessages(conversationIdForAnswer);
            const messages = zentData.data?.messages;

            console.log("messages");
            console.log(messages);
            if (messages && messages.length > 0) {
              // Find the last assistant message
              const assistantMessages = messages.filter(msg => msg.role === 'assistant');
              if (assistantMessages.length > 0) {
                const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];

                // Send the AI response message to the thread if it's not already there
                // This ensures the AI message with the code is displayed in the thread


                console.log("lastAssistantMessage");
                console.log(lastAssistantMessage);
                // Extract content blocks
                const contentBlocks = lastAssistantMessage.content.filter(block => block.type === 'content');

                const aiResponseMessage = await threadP.sendMessageByMessageManager(
                  conversationIdForAnswer,
                  JSON.stringify(contentBlocks),
                  'assistant',
                  userMessageId.id,
                  false,
                  {
                    totalTokens: 0,
                    generationTime: 0,
                    firstTokenTime: 0,
                    tokensPerSecond: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    model: chatConfig.value.modelId,
                    provider: chatConfig.value.providerId
                  }
                );
                // Function to extract Python code blocks from message content
                const extractPythonCode = (content) => {
                  if (!content) return null;

                  const md = getMarkdown();
                  const parsedNodes = parseMarkdownToStructure(content, md);

                  // Find all Python code blocks
                  const pythonCodeBlocks = parsedNodes.filter(node =>
                    node.type === 'code_block' &&
                    (node.language === 'python' || node.language === 'py')
                  );

                  // If no code blocks found, return null
                  if (pythonCodeBlocks.length === 0) return null;

                  // Return all code blocks or just the last one based on mode
                  return zentData.data?.runningCodeAutoMode === 'all'
                    ? pythonCodeBlocks.map(block => block.code)
                    : [pythonCodeBlocks[pythonCodeBlocks.length - 1].code];
                };

                // Function to extract JavaScript code blocks from message content
                const extractJavaScriptCode = (content) => {
                  if (!content) return null;

                  const md = getMarkdown();
                  const parsedNodes = parseMarkdownToStructure(content, md);

                  // Find all JavaScript code blocks
                  const jsCodeBlocks = parsedNodes.filter(node =>
                    node.type === 'code_block' &&
                    (node.language === 'javascript' || node.language === 'js')
                  );

                  // If no code blocks found, return null
                  if (jsCodeBlocks.length === 0) return null;

                  // Return all code blocks or just the last one based on mode
                  return zentData.data?.runningCodeAutoMode === 'all'
                    ? jsCodeBlocks.map(block => block.code)
                    : [jsCodeBlocks[jsCodeBlocks.length - 1].code];
                };

                console.log("contentBlocks");
                console.log(contentBlocks);

                // Process each content block
                for (const block of contentBlocks) {
                  if (block.content) {
                    // Check for Python code
                    const pythonCodes = extractPythonCode(block.content);
                    if (pythonCodes && pythonCodes.length > 0) {
                      for (const code of pythonCodes) {
                        console.log('Auto-executing Python code:', code);
                        const result = await mcpPresenter.runPythonCode(code.split('</antArtifact>')[0]);
                        console.log('Python execution result:', result);

                        // Add result as a system message with more descriptive content
                        const systemMessage = await threadP.sendMessageByMessageManager(
                          conversationIdForAnswer,
                          JSON.stringify([
                            // {
                            //   type: 'content',
                            //   content: `코드 실행 결과`,
                            //   // text: `123`,
                            //   timestamp: Date.now(),
                            //   status: 'success'
                            // },
                            {
                              type: 'content',
                              content: `\`\`\`\n${result}\n\`\`\``,
                              timestamp: Date.now(),
                              status: 'success'
                            },
                            ]),
                          'assistant',
                          userMessageId.id,
                          false,
                          {
                            totalTokens: 0,
                            generationTime: 0,
                            firstTokenTime: 0,
                            tokensPerSecond: 0,
                            inputTokens: 0,
                            outputTokens: 0,
                            model: chatConfig.value.modelId,
                            provider: chatConfig.value.providerId
                          }
                        );

                        // Check if the result contains an image
                        const imageMarkerIndex = result.indexOf('__IMAGE_DATA__:');
                        const artifactStore = useArtifactStore();

                        if (imageMarkerIndex !== -1) {
                          // Split the result into text and image parts
                          const textResult = result.substring(0, imageMarkerIndex).trim();
                          const imageData = result.substring(imageMarkerIndex + '__IMAGE_DATA__:'.length);

                          // Create an artifact for the image
                          const artifactId = `py-execution-${nanoid(6)}`;
                          artifactStore.showArtifact(
                            {
                              id: artifactId,
                              type: 'image/png',
                              title: t('result', 'Result'),
                              content: imageData,
                              status: 'loaded'
                            },
                            systemMessage.id,
                            conversationIdForAnswer
                          );
                        } else {
                          // No image, just text output
                          // Create an artifact for the code execution result
                          const artifactId = `py-execution-${nanoid(6)}`;
                          artifactStore.showArtifact(
                            {
                              id: artifactId,
                              type: 'application/vnd.ant.code',
                              title: t('executionResult', 'Execution Result'),
                              content: result,
                              status: 'loaded'
                            },
                            systemMessage.id,
                            conversationIdForAnswer
                          );
                        }
                      }
                    }

                    // Check for JavaScript code
                    const jsCodes = extractJavaScriptCode(block.content);
                    if (jsCodes && jsCodes.length > 0) {
                      for (const code of jsCodes) {
                        console.log('Auto-executing JavaScript code:', code);
                        const result = await mcpPresenter.runJavaScriptCode(code);
                        console.log('JavaScript execution result:', result);

                        // Add result as a system message with more descriptive content
                        const systemMessage = await threadP.sendMessageByMessageManager(
                          conversationIdForAnswer,
                          JSON.stringify([
                            {
                              type: 'content',
                              content: `\`\`\`\n${result}\n\`\`\``,
                              timestamp: Date.now(),
                              status: 'success'
                            },
                            ]),
                          'assistant',
                          userMessageId.id,
                          false,
                          {
                            totalTokens: 0,
                            generationTime: 0,
                            firstTokenTime: 0,
                            tokensPerSecond: 0,
                            inputTokens: 0,
                            outputTokens: 0,
                            model: chatConfig.value.modelId,
                            provider: chatConfig.value.providerId
                          }
                        );


                        // Check if the result contains an image
                        const imageMarkerIndex = result.indexOf('__IMAGE_DATA__:');
                        const artifactStore = useArtifactStore();

                        if (imageMarkerIndex !== -1) {
                          // Split the result into text and image parts
                          const textResult = result.substring(0, imageMarkerIndex).trim();
                          const imageData = result.substring(imageMarkerIndex + '__IMAGE_DATA__:'.length);

                          // Create an artifact for the image
                          const artifactId = `py-execution-${nanoid(6)}`;
                          artifactStore.showArtifact(
                            {
                              id: artifactId,
                              type: 'image/png',
                              title: t('result', 'Result'),
                              content: imageData,
                              status: 'loaded'
                            },
                            systemMessage.id,
                            conversationIdForAnswer
                          );
                        } else {
                          // Create an artifact for the code execution result
                          const artifactStore = useArtifactStore();
                          const artifactId = `js-execution-${nanoid(6)}`;
                          artifactStore.showArtifact(
                            {
                              id: artifactId,
                              type: 'application/vnd.ant.code',
                              title: t('executionResult', 'Execution Result'),
                              content: result,
                              status: 'loaded'
                            },
                            systemMessage.id,
                            conversationIdForAnswer
                          );
                          console.log("artifactId");
                          console.log(artifactId);
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error auto-executing code:', error);
          }
        }

        // Add completion event to signal end of tool executions
        await handleStreamEnd({
            eventId: conversationIdForAnswer,
            // userStop: false
          });
      }

      // // Emit the select event to navigate to the thread
      // emit('select', { id: threadId });
      // toast({
      //   title: t('zent.execute.success', 'Zent Executed'),
      //   description: t('zent.execute.complete', 'Zent execution completed successfully'),
      //   variant: 'default'
      // });
      console.log("execute zent finished");

      // Make sure we're returning the correct thread ID
      return conversationId || threadId;
    } catch (error) {
      console.error('Failed to execute zent:', error);
      throw error;
    }
  };

  // Plan tool calls using the LLM
  const planToolCalls = async (
    prompt: string,
    toolCalls: any[],
    lockedInputs: boolean[],
    t: any // Translation function
  ) => {
    try {
      const llmPresenter = usePresenter('llmproviderPresenter');
      const isPlanning = ref(false);
      isPlanning.value = true;

      // Get model settings from the chat config (user-selected)
      const providerId = chatConfig.value.providerId;
      const modelId = chatConfig.value.modelId;

      const toast = (options: any) => {
        // This is a placeholder for the toast function
        // In the component, this would show a notification
        console.log("Toast:", options);
      };

      if (!providerId || !modelId) {
        toast({
          title: t('zent.planning.error', 'Planning Error'),
          description: t('zent.planning.noModel', 'No model selected for planning tool calls'),
          variant: 'destructive'
        });
        return null;
      }

      // Prepare the tool calls with lock status indicators
      const toolCallsWithLockInfo = toolCalls.map((toolCall, idx) => {
        const params = typeof toolCall.params === 'string' ?
          JSON.parse(toolCall.params) : toolCall.params;

        // Mark locked parameters
        const markedParams = {};
        for (const [key, value] of Object.entries(params)) {
          markedParams[key] = lockedInputs[idx] ? `🔒 ${value}` : value;
        }

        let data = {
            "id": toolCall.id,
            "name": toolCall.name,
            "params": toolCall.params,
            "server_name": toolCall.server_name,
            "server_icons": toolCall.server_icons,
            "server_description": toolCall.server_description
        };
        if (lockedInputs[idx]) {
          data.isLocked = true;
        }

        return data;
      });

      console.log("toolCalls");
      console.log(toolCalls);
      console.log("lockedInputs");
      console.log(lockedInputs);
      console.log("toolCallsWithLockInfo");
      console.log(toolCallsWithLockInfo);

      // Create the planning prompt
      const planningPrompt = [
        {
          role: 'system',
          content: `This is a tool call planner. So you need to return list of tool call based on the sequence of tool calls with prompt that you received.
Some parameters in tool calls may already be locked (indicated by isLocked). Do not change these parameters.
For unlocked parameters, it generates the appropriate params value based on the current context and operation.
So the response must follow the input parameter structure exactly, except for the changed params value.
Don't attach anything else but just answer the list of tool call that is edited.`
        },
        {
          role: 'user',
          content: `[Prompt]
${prompt}

[Tool Calls]
${JSON.stringify(toolCallsWithLockInfo, null, 2)}`
        }
      ];

      console.log("Generate the plan started");
      // Generate the plan
      const planResult = await llmPresenter.generateCompletion(
        providerId,
        planningPrompt,
        modelId,
        0.7,  // temperature
        2000  // maxTokens
      );

      console.log("planResult");
      console.log(planResult);

      // Parse the plan
      try {
        // Extract JSON if there's any surrounding text
        const jsonMatch = planResult.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : planResult;

        const plannedCalls = JSON.parse(jsonStr);

        // Process the planned calls to ensure they have the right structure
        const processedCalls = plannedCalls.map((plannedCall, idx) => {
          const originalCall = toolCalls[idx];

          // If the parameter is locked, use the original value
          if (lockedInputs[idx]) {
            return originalCall;
          }

          // Otherwise, use the planned value but keep the original structure
          return {
            ...originalCall,
            params: plannedCall.params
          };
        });

        return processedCalls;
      } catch (error) {
        console.error('Failed to parse planned tool calls:', error);
        toast({
          title: t('zent.planning.error', 'Planning Error'),
          description: t('zent.planning.parseError', 'Failed to parse planned tool calls'),
          variant: 'destructive'
        });
        return null;
      }
    } catch (error) {
      console.error('Failed to plan tool calls:', error);
      const toast = (options: any) => {
        // This is a placeholder for the toast function
        console.log("Toast:", options);
      };
      toast({
        title: t('zent.planning.error', 'Planning Error'),
        description: t('zent.planning.generalError', 'Failed to plan tool calls'),
        variant: 'destructive'
      });
      return null;
    } finally {
      const isPlanning = ref(false);
      isPlanning.value = false;
    }
  };

  return {
    renameThread,
    // 状态
    createNewEmptyThread,
    isSidebarOpen,
    activeThreadId,
    threads,
    messages,
    isLoading,
    hasMore,
    generatingMessagesCache,
    generatingThreadIds,
    // Getters
    activeThread,
    // Actions
    loadThreads,
    createThread,
    setActiveThread,
    loadMessages,
    sendMessage,
    showMessage,
    handleStreamResponse,
    handleStreamEnd,
    handleStreamError,
    handleMessageEdited,
    // 导出配置相关的状态和方法
    chatConfig,
    updateChatConfig,
    retryMessage,
    deleteMessage,
    clearActiveThread,
    cancelGenerating,
    clearAllMessages,
    continueStream,
    deeplinkCache,
    clearDeeplinkCache,
    forkThread,
    updateThreadWorkingStatus,
    getThreadWorkingStatus,
    threadsWorkingStatus,
    toggleThreadPinned,
    // Agent related
    setAgent,
    clearAgent,
    activeAgent,
    // Zpilot related
    setZpilot,
    clearZpilot,
    activeZpilot,
    // Zent execution
    executeZent,
    // Zentrun related
    refreshZentrunUsage,
    isZentrunProvider
  }
})
