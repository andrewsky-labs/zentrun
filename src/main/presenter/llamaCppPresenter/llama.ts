// import path from 'path'
// import {
//   ChatHistoryItem,
//   getLlama,
//   LlamaChatSession,
//   LlamaModel,
//   LlamaContext
// } from 'node-llama-cpp'
// import { MessagePortMain } from 'electron'

// type WorkerMessage = {
//   type: 'prompt' | 'newChat'
//   text?: string
// }
// process.title += 'llama process'
// let mySession: LlamaChatSession | null = null
// let myModel: LlamaModel | null = null
// let myPort: MessagePortMain | null = null
// let myContext: LlamaContext | null = null
// // const chatWrapper = new TemplateChatWrapper({
// //   template: '{{systemPrompt}}\n{{history}}model: {{completion}}\nuser: ',
// //   historyTemplate: {
// //     system: 'system: {{message}}\n',
// //     user: 'user: {{message}}\n',
// //     model: 'model: {{message}}\n'
// //   }
// //   // functionCallMessageTemplate: { // optional
// //   //     call: "[[call: {{functionName}}({{functionParams}})]]",
// //   //     result: " [[result: {{functionCallResult}}]]"
// //   // }
// // })
// async function initializeLlama() {
//   const llama = await getLlama()
//   myModel = await llama.loadModel({
//     modelPath: path.join(
//       '/Users/zerob13/Downloads',
//       'models',
//       'DeepSeek-R1-Distill-Qwen-1.5B-Q2_K.gguf'
//     ),
//     onLoadProgress: (pro: number) => {
//       console.info('on loading', Math.floor(pro * 100) + '%')
//     }
//   })

//   myContext = await myModel.createContext()
//   mySession = new LlamaChatSession({
//     contextSequence: myContext.getSequence()
//     // chatWrapper: chatWrapper
//   })
// }
// function processChatHistory() {
//   if (!mySession) {
//     return
//   }
//   const oriChatHistory: ChatHistoryItem[] = mySession.getChatHistory()
//   const updatedChatHistory = oriChatHistory.map((item) => {
//     if ('response' in item) {
//       item.response = item.response.map((resp) => {
//         if (typeof resp === 'string') {
//           return resp.replace(/<think>.*?<\/think>/gs, '')
//         } else {
//           return resp
//         }
//       })
//     }
//     return item
//   })
//   mySession.setChatHistory(updatedChatHistory)
// }
// async function handleMessage(session: LlamaChatSession, message: WorkerMessage) {
//   console.log('worker process message', message)
//   switch (message.type) {
//     case 'prompt':
//       if (!message.text) {
//         return
//       }
//       processChatHistory() // 调用 processChatHistory 函数
//       return await session.prompt(message.text, {
//         onTextChunk: (chunk: string) => {
//           // console.info('chunk', chunk)
//           if (myPort) {
//             myPort.postMessage({
//               type: 'response-chunk',
//               chunk
//             })
//           }
//         }
//       })
//     default:
//       throw new Error('Unsupported message type')
//   }
// }

// process.parentPort!.on('message', (e) => {
//   const [port] = e.ports
//   myPort = port
//   myPort.on('message', async (e: { data: WorkerMessage }) => {
//     if (!mySession || !myPort) {
//       return
//     }
//     console.log('handle msg', e.data)
//     if (e.data.type === 'newChat') {
//       if (myModel && myContext) {
//         mySession.resetChatHistory()
//         // mySession.dispose()
//         // myContext.dispose()
//         // myContext = await myModel.createContext()
//         // mySession = new LlamaChatSession({
//         //   contextSequence: myContext.getSequence()
//         //   // chatWrapper: chatWrapper
//         // })
//       }
//       return
//     }
//     try {
//       const response = await handleMessage(mySession, e.data)
//       myPort.postMessage({
//         type: 'response',
//         content: response
//       })
//     } catch (error) {
//       myPort.postMessage({
//         type: 'error',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       })
//     }
//   })
//   myPort.start()
// })
// // Main worker execution
// initializeLlama()
//   .then(() => {
//     console.info('inited')
//     if (myPort) {
//       // Signal ready
//       myPort.postMessage({ type: 'ready' })
//     }
//   })
//   .catch((error) => {
//     if (process.send) {
//       process.send({
//         type: 'error',
//         error: error instanceof Error ? error.message : 'Failed to initialize'
//       })
//     }
//   })
