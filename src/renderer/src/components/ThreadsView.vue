<template>
  <div
    class="w-60 h-full bg-muted overflow-hidden p-2 space-y-3 flex-shrink-0 border-r flex flex-col"
  >
    <!-- 固定在顶部的"新会话"按钮 -->
    <div class="flex-none">
      <Button
        variant="outline"
        size="sm"
        class="w-full text-xs text-muted-foreground justify-start gap-2 mt-2"
        @click="showWorkspaceDialog = true"
      >
        <Icon icon="lucide:package-plus" class="h-4 w-4" />
        <span>{{ t('common.newWorkspace') }}</span>
      </Button>
      <!-- Organization Add Dialog -->
      <OrganizationAddDialog
        v-model:open="showWorkspaceDialog"
      />

      <!-- Team Add Dialog -->
      <TeamAddDialog
        v-model:open="addTeamDialog"
        :organization="selectedOrganization"
        :parent-team="selectedTeam"
        @cancel="addTeamDialog = false; selectedOrganization=null; selectedTeam=null;"
      />
      <Button
        variant="outline"
        size="sm"
        class="w-full text-xs text-muted-foreground justify-start gap-2 mt-2"
        @click="showAgentAddModal=true"
      >
        <Icon icon="lucide:app-window" class="h-4 w-4" />
        <span>{{ t('common.newAgent') }}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="w-full text-xs text-muted-foreground justify-start gap-2 mt-2"
        @click="createNewThread"
      >
        <Icon icon="lucide:pen-line" class="h-4 w-4" />
        <span>{{ t('common.newChat') }}</span>
      </Button>
    </div>

    <!-- 워크스페이스/폴더 + 채팅 트리 구조 -->
    <ScrollArea ref="scrollAreaRef" class="flex-1">
      <template v-for="item in treeData" :key="item.id">
        <div>
          <div v-if="item.type === 'organization' || item.type === 'folder'" class="mb-2">
            <ThreadItemOrganization
              v-if="item.type === 'organization'"
              :thread="item"
              @toggleFolder="toggleFolder"
              @addTeam="showAddTeamDialogOrganization"
              @addAgent="showAddAgentDialogOrganization"
              @rename="showRenameDialogOrganization"
              @delete="showDeleteDialogOrganization"
              @renameTeam="showRenameDialogTeam"
              @deleteTeam="showDeleteDialogTeam"
              @edit="handleEditOrganizationModal"
              @view="handleViewOrganizationModal"
            >
<!--              <template v-for="child in item.children" :key="child.id">-->
<!--                <ThreadItemTeam-->
<!--                  v-if="child.type === 'team'"-->
<!--                  :thread="child"-->
<!--                  @toggleFolder="toggleFolder"-->
<!--                  @addAgent="showAddAgentDialogTeam"-->
<!--                  @rename="showRenameDialogTeam"-->
<!--                  @delete="showDeleteDialogTeam"-->
<!--                >-->
<!--                  <template v-for="sub in child.children" :key="sub.id">-->
<!--                    <ThreadItemAgent-->
<!--                      v-if="sub.type === 'agent'"-->
<!--                      :thread="sub"-->
<!--                      :active-thread-id="activeThreadId"-->
<!--                      @toggleFolder="toggleFolder"-->
<!--                      @edit="handleEditAgentModal"-->
<!--                      @copy="handleCopyAgent"-->
<!--                      @move="showMoveDialogAgent"-->
<!--                      @rename="showRenameDialogAgent"-->
<!--                      @delete="showDeleteDialogAgent"-->
<!--                      @selectZent="handleThreadSelect"-->
<!--                      @renameZent="showRenameDialog"-->
<!--                      @deleteZent="showDeleteDialogZent"-->
<!--                      @copyZent="handleCopyZent"-->
<!--                      @moveZent="showMoveDialogZent"-->
<!--                      @editZent="showEditDialogZent"-->
<!--                      @cleanmsgsZent="showCleanMessagesDialog"-->
<!--                    />-->

<!--                    <ThreadItemZent-->
<!--                      v-if="sub.type === 'zent'"-->
<!--                      :thread="sub"-->
<!--                      :is-active="sub.id === activeThreadId"-->
<!--                      :working-status="chatStore.getThreadWorkingStatus(sub.id)"-->
<!--                      @select="handleThreadSelect"-->
<!--                      @rename="showRenameDialog(sub)"-->
<!--                      @delete="showDeleteDialog(sub)"-->
<!--                      @copyZent="handleCopyZent(sub)"-->
<!--                      @moveZent="showMoveDialogZent(sub)"-->
<!--                      @editZent="showEditDialogZent(sub)"-->
<!--                      @cleanmsgs="showCleanMessagesDialog(sub)"-->
<!--                    />-->
<!--                  </template>-->
<!--                </ThreadItemTeam>-->

<!--                <ThreadItemAgent-->
<!--                  v-if="child.type === 'agent'"-->
<!--                  :thread="child"-->
<!--                  :active-thread-id="activeThreadId"-->
<!--                  @toggleFolder="toggleFolder"-->
<!--                  @edit="handleEditAgentModal"-->
<!--                  @copy="handleCopyAgent"-->
<!--                  @move="showMoveDialogAgent"-->
<!--                  @rename="showRenameDialogAgent"-->
<!--                  @delete="showDeleteDialogAgent"-->
<!--                  @selectZent="handleThreadSelect"-->
<!--                  @renameZent="showRenameDialog"-->
<!--                  @deleteZent="showDeleteDialogZent"-->
<!--                  @copyZent="handleCopyZent"-->
<!--                  @moveZent="showMoveDialogZent"-->
<!--                  @editZent="showEditDialogZent"-->
<!--                  @cleanmsgsZent="showCleanMessagesDialog"-->
<!--                />-->

<!--                <ThreadItemZent-->
<!--                  v-if="child.type === 'zent'"-->
<!--                  :thread="child"-->
<!--                  :is-active="child.id === activeThreadId"-->
<!--                  :working-status="chatStore.getThreadWorkingStatus(child.id)"-->
<!--                  @select="handleThreadSelect"-->
<!--                  @rename="showRenameDialogZent(child)"-->
<!--                  @delete="showDeleteDialogZent(child)"-->
<!--                  @copyZent="handleCopyZent(child)"-->
<!--                  @moveZent="showMoveDialogZent(child)"-->
<!--                  @editZent="showEditDialogZent(child)"-->
<!--                  @cleanmsgs="showCleanMessagesDialog(child)"-->
<!--                />-->
<!--              </template>-->
            </ThreadItemOrganization>

            <div v-else class="flex items-center px-2 py-1 hover:bg-accent rounded select-none group">
              <div class="flex items-center flex-1 cursor-pointer" @click="toggleFolder(item)">
                <Icon :icon="item.expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-4 h-4 mr-1" />
                <Icon icon="lucide:folder" class="w-4 h-4 mr-2" />
                <span class="font-bold text-xs">{{ item.name }}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop
                  >
                    <Icon icon="lucide:more-horizontal" class="h-3 w-3 text-muted-foreground"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem @select="showAddAgentDialogOrganization(item)">
                    <Icon icon="lucide:plus" class="mr-2 h-4 w-4"/>
                    <span>{{ t('thread.actions.addAgent') }}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem @select="showRenameDialogOrganization(item)">
                    <Icon icon="lucide:pencil" class="mr-2 h-4 w-4"/>
                    <span>{{ t('thread.actions.rename') }}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem class="text-destructive" @select="showDeleteDialogOrganization(item)">
                    <Icon icon="lucide:trash-2" class="mr-2 h-4 w-4"/>
                    <span>{{ t('thread.actions.delete') }}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div v-show="item.expanded" class="pl-6">
              <template v-for="child in item.children" :key="child.id">
                <ThreadItemTeam
                  v-if="child.type === 'team'"
                  :thread="child"
                  @toggleFolder="toggleFolder"
                  @addAgent="showAddAgentDialogTeam"
                  @rename="showRenameDialogTeam"
                  @delete="showDeleteDialogTeam"
                  @edit="handleEditTeamModal"
                  @view="handleViewTeamModal"
                >
                  <template v-for="sub in child.children" :key="sub.id">
                    <ThreadItemAgent
                      v-if="sub.type === 'agent'"
                      :thread="sub"
                      :active-thread-id="activeThreadId"
                      @toggleFolder="toggleFolder"
                      @edit="handleEditAgentModal"
                      @view="handleViewAgentModal"
                      @copy="handleCopyAgent"
                      @move="showMoveDialogAgent"
                      @rename="showRenameDialogAgent"
                      @delete="showDeleteDialogAgent"
                      @selectZent="handleThreadSelect"
                      @renameZent="showRenameDialog"
                      @deleteZent="showDeleteDialogZent"
                      @copyZent="handleCopyZent"
                      @moveZent="showMoveDialogZent"
                      @editZent="showEditDialogZent"
                      @cleanmsgsZent="showCleanMessagesDialog"
                    />

                    <ThreadItemZent
                      v-if="sub.type === 'zent'"
                      :thread="sub"
                      :is-active="sub.id === activeThreadId"
                      :working-status="chatStore.getThreadWorkingStatus(sub.id)"
                      @select="handleThreadSelect"
                      @rename="showRenameDialog(sub)"
                      @delete="showDeleteDialog(sub)"
                      @viewZent="showViewDialogZent(sub)"
                      @copyZent="handleCopyZent(sub)"
                      @moveZent="showMoveDialogZent(sub)"
                      @editZent="showEditDialogZent(sub)"
                      @cleanmsgs="showCleanMessagesDialog(sub)"
                    />
                  </template>
                </ThreadItemTeam>

                <ThreadItemAgent
                  v-if="child.type === 'agent'"
                  :thread="child"
                  :active-thread-id="activeThreadId"
                  @toggleFolder="toggleFolder"
                  @edit="handleEditAgentModal"
                  @view="handleViewAgentModal"
                  @copy="handleCopyAgent"
                  @move="showMoveDialogAgent"
                  @rename="showRenameDialogAgent"
                  @delete="showDeleteDialogAgent"
                  @selectZent="handleThreadSelect"
                  @renameZent="showRenameDialog"
                  @deleteZent="showDeleteDialogZent"
                  @copyZent="handleCopyZent"
                  @moveZent="showMoveDialogZent"
                  @editZent="showEditDialogZent"
                  @viewZent="showViewDialogZent"
                  @cleanmsgsZent="showCleanMessagesDialog"
                />

                <ThreadItemZent
                  v-else-if="child.type === 'zent'"
                  :thread="child"
                  :is-active="child.id === activeThreadId"
                  :working-status="chatStore.getThreadWorkingStatus(child.id)"
                  @select="handleThreadSelect"
                  @rename="showRenameDialogZent(child)"
                  @delete="showDeleteDialogZent(child)"
                  @copyZent="handleCopyZent(child)"
                  @moveZent="showMoveDialogZent(child)"
                  @editZent="showEditDialogZent(child)"
                  @viewZent="showViewDialogZent(child)"
                  @cleanmsgs="showCleanMessagesDialog(child)"
                />
              </template>
            </div>
          </div>
<!--          <ThreadItemAgent-->
<!--            v-else-if="item.type === 'agent'"-->
<!--            :thread="item"-->
<!--            :active-thread-id="activeThreadId"-->
<!--            @toggleFolder="toggleFolder"-->
<!--            @edit="handleEditAgentModal"-->
<!--            @copy="handleCopyAgent"-->
<!--            @move="showMoveDialogAgent"-->
<!--            @rename="showRenameDialogAgent"-->
<!--            @delete="showDeleteDialogAgent"-->
<!--            @selectZent="handleThreadSelect"-->
<!--            @renameZent="showRenameDialog"-->
<!--            @deleteZent="showDeleteDialogZent"-->
<!--            @copyZent="handleCopyZent"-->
<!--            @moveZent="showMoveDialogZent"-->
<!--            @editZent="showEditDialogZent"-->
<!--            @cleanmsgsZent="showCleanMessagesDialog"-->
<!--          />-->
<!--          <div v-else-if="item.type === 'zent'">-->
<!--            <ThreadItemZent-->
<!--              :thread="item"-->
<!--              :is-active="item.id === activeThreadId"-->
<!--              :working-status="chatStore.getThreadWorkingStatus(item.id)"-->
<!--              @select="handleThreadSelect"-->
<!--              @rename="showRenameDialogZent(item)"-->
<!--              @delete="showDeleteDialogZent(item)"-->
<!--              @copyZent="handleCopyZent(item)"-->
<!--              @moveZent="showMoveDialogZent(item)"-->
<!--              @editZent="showEditDialogZent(item)"-->
<!--              @cleanmsgs="showCleanMessagesDialog(item)"-->
<!--            />-->
<!--          </div>-->
          <div v-else-if="item.type === 'chat'">
          <ThreadItem
            :thread="item"
            :is-active="item.id === activeThreadId"
            :working-status="chatStore.getThreadWorkingStatus(item.id)"
            @select="handleThreadSelect"
            @rename="showRenameDialog(item)"
            @delete="showDeleteDialog(item)"
            @cleanmsgs="showCleanMessagesDialog(item)"
          />
        </div>
        </div>

      </template>
        <div v-for="thread in chatStore.threads" :key="thread.dt" class="space-y-1.5 mb-3">
          <div class="text-xs font-bold text-secondary-foreground px-2">{{ thread.dt }}</div>
          <ul class="space-y-1.5">
            <template v-for="dtThread in thread.dtThreads" :key="dtThread.id">
              <ThreadItemZent
                v-if="dtThread.type === 'zent'"
                :thread="dtThread"
                :is-active="dtThread.id === chatStore.activeThreadId"
                :working-status="chatStore.getThreadWorkingStatus(dtThread.id)"
                @select="handleThreadSelect"
                @rename="showRenameDialogZent(dtThread)"
                @delete="showDeleteDialogZent(dtThread)"
                @cleanmsgs="showCleanMessagesDialog(dtThread)"
                @editZent="showEditDialogZent(dtThread)"
                @viewZent="showViewDialogZent(dtThread)"
                @copyZent="handleCopyZent(dtThread)"
                @moveZent="showMoveDialogZent(dtThread)"
              />
              <ThreadItem
                v-else
                :thread="dtThread"
                :is-active="dtThread.id === chatStore.activeThreadId"
                :working-status="chatStore.getThreadWorkingStatus(dtThread.id)"
                @select="handleThreadSelect"
                @rename="showRenameDialog(dtThread)"
                @delete="showDeleteDialog(dtThread)"
                @cleanmsgs="showCleanMessagesDialog(dtThread)"
              />
            </template>
          </ul>
        </div>

    </ScrollArea>

      <Button
        size="sm"
        class="w-full text-xs
        justify-start gap-2 mt-2 pt-5 pb-5"
        @click="handleRecordingClick"
      >
       <Icon v-if="isLoadingRecording" icon="lucide:loader" class="w-4 h-4 mr-2 animate-spin" />
      <Icon v-else-if="isRecording" :icon="'lucide:circle'" class="h-4 w-4 animate-pulse text-red-500" />
      <Icon v-else :icon="isRecording ? 'lucide:square' : 'lucide:video'" class="h-4 w-4" />
        <span>{{ isLoadingRecording ?  t('common.loading', "Loading...") : isRecording ? t('common.stopRecording', "Stop Recording") : t('common.newRecording', "New Record") }}</span>
      </Button>
    <!-- Zent Move Dialog -->
    <ZentMoveDialog
      v-model:open="moveDialogZent"
      :zent="selectedZent"
      :organizations="organizationStore.organizations.value"
      :teams="teamStore.teams.value"
      :agents="agentStore.agents.value"
      @cancel="selectedOrganization=null; selectedAgent=null; selectedTeam=null; selectedZent=null; moveDialogZent=false;"
    />

    <!-- Agent Move Dialog -->
    <AgentMoveDialog
      v-model:open="moveDialogAgent"
      :agent="selectedAgent"
      :organizations="organizationStore.organizations.value"
      :teams="teamStore.teams.value"
      :loadTreeData="loadTreeData"
      @cancel="selectedOrganization=null; selectedAgent=null; selectedTeam=null; moveDialogAgent=false;"
    />

    <Dialog v-model:open="renameDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('dialog.rename.title') }}</DialogTitle>
          <DialogDescription>{{ t('dialog.rename.description') }}</DialogDescription>
        </DialogHeader>
        <Input v-if="renameThread" v-model="renameThread.title" />
        <DialogFooter>
          <Button variant="outline" @click="handleRenameDialogCancel">{{
            t('dialog.cancel')
          }}</Button>
          <Button variant="default" @click="handleThreadRename">{{ t('dialog.confirm') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Organization Dialogs -->
    <OrganizationRenameDialog
      v-model:open="renameDialogOrganization"
      :organization="selectedOrganization"
      @cancel="handleRenameDialogCancelOrganization"
    />

    <OrganizationDeleteDialog
      v-model:open="deleteDialogOrganization"
      :organization="selectedOrganization"
      @cancel="handleDeleteDialogCancelOrganization"
    />

    <!-- Team Dialogs -->
    <TeamRenameDialog
      v-model:open="renameDialogTeam"
      :team="selectedTeam"
      @cancel="handleRenameDialogCancelTeam"
    />

    <TeamDeleteDialog
      v-model:open="deleteDialogTeam"
      :team="selectedTeam"
      @cancel="handleDeleteDialogCancelTeam"
    />

    <!-- Recording Complete Dialog -->
    <Dialog v-model:open="recordingCompleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('common.recordingComplete', 'Recording Complete') }}</DialogTitle>
          <DialogDescription>
            {{ t('common.recordingCompleteDesc', 'Browser recording has been completed. What would you like to do?') }}
          </DialogDescription>
        </DialogHeader>
        <div class="mt-4">
          <p class="text-sm text-muted-foreground mb-2">
            {{ t('common.actionsRecorded', 'Actions recorded') }}: {{ recordedActions.length }}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="cancelRecording">
            {{ t('dialog.cancel', 'Cancel') }}
          </Button>
          <Button variant="default" @click="createAutomation">
            {{ t('common.createAutomation', 'Create Automation') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Agent Dialogs -->
    <AgentRenameDialog
      v-model:open="renameDialogAgent"
      :agent="selectedAgent"
      @cancel="handleRenameDialogCancelAgent"
    />

    <AgentDeleteDialog
      v-model:open="deleteDialogAgent"
      :agent="selectedAgent"
      @cancel="handleDeleteDialogCancelAgent"
    />

    <!-- Zent dialogs -->
    <ZentRenameDialog
      v-model:open="renameDialogZent"
      :zent="selectedZent"
      @cancel="handleRenameDialogCancelZent"
    />

    <ZentDeleteDialog
          v-model:open="deleteDialogZent"
      :zent="selectedZent"
          @cancel="handleDeleteDialogCancelZent"
        />

    <Dialog v-model:open="cleanMessagesDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('dialog.cleanMessages.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('dialog.cleanMessages.description') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="handleCleanMessagesDialogCancel">
            {{ t('dialog.cancel') }}
          </Button>
          <Button variant="destructive" @click="handleThreadCleanMessages">
            {{ t('dialog.cleanMessages.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="deleteDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialog.delete.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('dialog.delete.description') }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="handleDeleteDialogCancel">
          {{ t('dialog.cancel') }}
        </Button>
        <Button variant="destructive" @click="handleThreadDelete">
          {{ t('dialog.delete.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

    <!-- Agent Add Dialog -->
    <AgentAddDialog
      v-model:open="showAgentAddModal"
      :zents="zents"
      :organization="selectedOrganization"
      :team="selectedTeam"
      @cancel="showAgentAddModal = false; selectedOrganization = null; selectedTeam = null;"
    />

    <!-- Agent Edit Dialog -->
    <AgentDetailDialog
      v-model:open="showAgentEditModal"
      :agent="selectedAgent"
      :is-view-mode="isViewMode"
      :zents="zents"
      :agent-zents="selectedZents"
      @cancel="showAgentEditModal = false"
      @edit="isViewMode = false"
    />
  </div>

  <!-- Zent Edit Dialog -->
  <ZentDetailDialog
    v-model:open="editDialogZent"
    :zent="selectedZent"
    @edit="isViewMode = false"
    :is-view-mode="isViewMode"
    @cancel="editDialogZent = false"
  />

  <!-- Organization Detail Dialog -->
  <OrganizationDetail
    :open="showOrganizationDetailDialog"
    :organization="selectedOrganization"
    :is-view-mode="isViewMode"
    @update:open="showOrganizationDetailDialog = $event"
    @addTeam="showAddTeamDialogOrganization"
    @renameTeam="showRenameDialogTeam"
    @deleteTeam="showDeleteDialogTeam"
    @edit="isViewMode = false"
  />

  <!-- Team Detail Dialog -->
  <TeamDetailDialog
    :open="showTeamDetailDialog"
    :team="selectedTeam"
    @update:open="showTeamDetailDialog = $event"
    @addAgent="showAddAgentDialogTeam"
  />
</template>

<script setup lang="ts">
import {computed, reactive, ref, watch, nextTick} from 'vue'

const { toast } = useToast()
const orgP = usePresenter('organizationSQLitePresenter')
const agentP = usePresenter('agentSQLitePresenter')
const zentP = usePresenter('zentSQLitePresenter')

const showAgentAddModal = ref(false)
const agentAddName = ref('')
const agentAddPrompt = ref('')
const agentAddCategory = ref('')
const agentAddTags = ref('')
// Zent 목록, 검색, 선택 상태
const zents = ref<any[]>([])
const searchZent = ref('')
const selectedZents = ref<any[]>([])
const showZentDropdown = ref(false)
const zentInputBlurTimeout = ref<NodeJS.Timeout|null>(null)
const showAgentEditModal = ref(false)
const showOrganizationDetailDialog = ref(false)
const showTeamDetailDialog = ref(false)
const isViewMode = ref(false)
const agentEditName = ref('')
const agentEditPrompt = ref('')
const agentEditCategory = ref('')
const agentEditTags = ref('')
const agentEditId = ref(null)

// Dialog 열릴 때 zent 목록 불러오기
watch(showAgentAddModal, async (open) => {
  if (open) {
    const list = await zentStore.loadZents();
    console.log("list");
    console.log(list);
    zents.value = list
    selectedZents.value = []
    searchZent.value = ''
  }
})
// Dialog 열릴 때 zent 목록 불러오기
watch(showAgentEditModal, async (open) => {
  if (open) {
    const list = await zentStore.loadZents();
    console.log("list");
    console.log(list);
    zents.value = list
    selectedZents.value = []
    searchZent.value = ''
  }
})

const handleEditAgentModal = async (agent) => {
  isViewMode.value = false;
  try {
    console.log("handleEditAgentModal agent");
    console.log(agent);
    // Set the agent data to edit
    selectedAgent.value = agent;
    agentEditId.value = agent.id
    agentEditName.value = agent.name
    agentEditPrompt.value = agent.prompt
    agentEditCategory.value = agent.categories
    try {
      agentEditTags.value = agent.tags
    } catch (e) {

    }
    await zentStore.loadZents();
    console.log("zentStore.zents");
    console.log(zentStore.zents);
    // Set the zents associated with this agent
    const agentZents = zentStore.zents.value.filter(zent => zent.agent === agent.slug)
    console.log("agentZents");
    console.log(agentZents);
    selectedZents.value = agentZents

    // Open the edit modal
    showAgentEditModal.value = true
  } catch (error) {
    console.error('Failed to prepare agent for editing:', error)
    toast({ title: 'Failed to edit agent', description: error.message, variant: 'destructive' })
  }
}

const handleViewAgentModal = async (agent) => {
  handleEditAgentModal(agent);
  isViewMode.value = true;
}

const handleEditOrganizationModal = async (organization) => {
  isViewMode.value = false;
  try {
    // Set the organization data to edit
    selectedOrganization.value = organization;

    // Open the edit modal
    showOrganizationDetailDialog.value = true;
  } catch (error) {
    console.error('Failed to prepare organization for editing:', error);
    toast({ title: 'Failed to edit organization', description: error.message, variant: 'destructive' });
  }
}

const handleViewOrganizationModal = async (organization) => {
  handleEditOrganizationModal(organization);
  isViewMode.value = true;
}

const handleEditTeamModal = async (team) => {
  isViewMode.value = false;
  try {
    // Set the team data to edit
    selectedTeam.value = team;

    // Open the edit modal
    showTeamDetailDialog.value = true;
  } catch (error) {
    console.error('Failed to prepare team for editing:', error);
    toast({ title: 'Failed to edit team', description: error.message, variant: 'destructive' });
  }
}

const handleViewTeamModal = async (team) => {
  handleEditTeamModal(team);
  isViewMode.value = true;
}


const handleCopyAgent = async (agent) => {
  try {
    console.log("handleCopyAgent");
    console.log(agent);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Create a new agent with "Copy of" added to the name
    const newAgent = {
      ...agent,
      id: nanoid(),
      slug: `${agent.slug}-copy-${nanoid()}`,
      name: `Copy of ${agent.name}`,
      prompt: agent.prompt,
      organization: agent.organization,
      team: agent.team,
      categories: agent.categories,
      tags: agent.tags,
      is_public: agent.is_public,
      data: agent.data || {},
      user: user?.id,
      by: user?.username,
    }
    delete newAgent['children']

    // Save the new agent
    let b = await agentStore.addAgent(newAgent)

    await zentStore.loadZents();
    // Copy all zents associated with this agent
    const agentZents = zentStore.zents.value.filter(zent => zent.agent === agent.slug)

    // Prepare zents for the new agent
    const newZents = [];
    for (const zent of agentZents) {
      // Create a new zent with the same properties but linked to the new agent
      const newZent = {
        ...zent,
        id: nanoid(),
        slug: `${zent.slug}-copy-${nanoid()}`,
        name: `${zent.name}`,
        agent: newAgent.slug,
        user: user?.id,
        by: user?.username,
      }

      // Save the new zent
      await zentStore.addZent(newZent)
      newZents.push(newZent);
    }

    // Add zents to the agent data
    newAgent.data.zents = newZents;
    toast({ title: 'Agent and associated zents copied successfully!' });
    // Update the tree
    loadTreeData()

    // Make a single API request to clone the agent with all its zents
    try {
      await apiRequest('/zentrun-agent/clone/', 'POST', newAgent);

      await newZents.map(async (newZent) => {
        await apiRequest('/zentrun-zent/clone/', 'POST', newZent);
      })
    } catch (error: any) {
      toast({title: 'Error copying agent', description: error.message || 'API error', variant: 'destructive'});
    }
  } catch (error) {
    console.error('Failed to copy agent:', error)
    toast({ title: 'Failed to copy agent', description: error.message, variant: 'destructive' })
  }
}

const handleCopyZent = async (zent) => {
  try {
    // Create a new zent with "Copy of" added to the name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const newZent = {
      ...zent,
      id: nanoid(),
      slug: `${zent.slug}-copy-${nanoid()}`,
      name: `Copy of ${zent.name}`,
      user: user?.id,
      by: user?.username,
    }

    // Save the new zent
    await zentStore.addZent(newZent);

    toast({ title: 'Zent copied successfully!' })

  try {
    await apiRequest('/zentrun-zent/clone/', 'POST', newZent);
    toast({ title: 'Zent copied successfully!' });
  } catch (error: any) {
    toast({ title: 'Error copying zent', description: error.message || 'API error', variant: 'destructive' });
  }


    // // Update the tree
    // loadTreeData()
  } catch (error) {
    console.error('Failed to copy zent:', error)
    toast({ title: 'Failed to copy zent', description: error.message, variant: 'destructive' })
  }
}

function handleAgentAddSave() {
  // TODO: Replace with actual save logic
  showAgentAddModal.value = false
}

const treeData = reactive([])
const teamName = ref('')
const teamDesc = ref('')

// Toggle folder expansion/collapse
function toggleFolder(item) {
  item.expanded = !item.expanded
}


// Load and organize data
async function loadTreeData() {
  try {
    // Load data from stores
    const orgs = organizationStore.organizations.value
    const agents = agentStore.agents.value
    const teams = teamStore.teams.value
    const zents = zentStore.zents.value

    console.log('Loaded data:', { orgs, agents, zents, teams })

    // Build tree structure
    const tree = []

    // Add organizations as top-level folders
    for (const org of orgs) {
      const orgNode = {
        id: org.id,
        type: 'organization',
        name: org.name,
        expanded: true,
        children: [],
        ...org
      }

      // console.log('Processing organization:', org)

      // Add teams belonging to this organization
      const orgTeams = teams.filter(team => team.organization === org.slug)
      orgTeams.forEach(team => {
        const teamNode = {
          id: team.id,
          type: 'team',
          name: team.name,
          expanded: true,
          children: [],
          ...team
        }

        console.log('Processing team:', team)

        // Add agents belonging to this team
        const teamAgents = agents.filter(agent => agent.team === team.slug)
        teamAgents.forEach(agent => {
          const agentNode = {
            id: agent.id,
            type: 'agent',
            name: agent.name,
            expanded: true,
            children: [],
            ...agent
          }

          console.log('Processing agent:', agent)

          // Add zents associated with this agent
          const agentZents = zents.filter(zent => zent.agent === agent.slug)
          agentZents.forEach(zent => {
            agentNode.children.push({
              id: zent.id,
              type: 'zent',
              title: zent.name,
              name: zent.name,
              ...zent
            })
            // console.log('Added zent:', zent)
          })

          teamNode.children.push(agentNode)
        })

        // Add zents directly associated with this team
        const teamZents = zents.filter(zent => zent.team === team.slug)
        teamZents.forEach(zent => {
          teamNode.children.push({
            id: zent.id,
            type: 'zent',
            title: zent.name,
            name: zent.name,
            ...zent
          })
          console.log('Added team zent:', zent)
        })

        orgNode.children.push(teamNode)
      })

      // Add agents directly associated with this organization (not in any team)
      const orgAgents = agents.filter(agent => agent.organization === org.slug && !agent.team)
      orgAgents.forEach(agent => {
        const agentNode = {
          id: agent.id,
          type: 'agent',
          name: agent.name,
          expanded: true,
          children: [],
          ...agent
        }

        // console.log('Processing standalone agent:', agent)

        // Add zents associated with this agent
        const agentZents = zents.filter(zent => zent.agent === agent.slug)
        agentZents.forEach(zent => {
          agentNode.children.push({
            id: zent.id,
            type: 'zent',
            title: zent.name,
            name: zent.name,
            ...zent
          })
          // console.log('Added zent:', zent)
        })

        orgNode.children.push(agentNode)
      })

      // Add zents directly associated with this organization (not in any team)
      const orgZents = zents.filter(zent => zent.organization === org.slug && !zent.team)
      orgZents.forEach(zent => {
        orgNode.children.push({
          id: zent.id,
          type: 'zent',
          title: zent.name,
          name: zent.name,
          ...zent
        })
        // console.log('Added organization zent:', zent)
      })

      tree.push(orgNode)
    }

    // Add standalone teams (not associated with any organization)
    const standaloneTeams = teams.filter(team => !team.organization)
    if (standaloneTeams.length > 0) {
      const standaloneTeamsNode = {
        id: 'standalone-teams',
        type: 'folder',
        name: 'Teams',
        expanded: true,
        children: []
      }

      standaloneTeams.forEach(team => {
        const teamNode = {
          id: team.id,
          type: 'team',
          name: team.name,
          expanded: true,
          children: [],
          ...team
        }

        // Add agents belonging to this standalone team
        const teamAgents = agents.filter(agent => agent.team === team.slug)
        teamAgents.forEach(agent => {
          const agentNode = {
            id: agent.id,
            type: 'agent',
            name: agent.name,
            expanded: true,
            children: [],
            ...agent
          }

          // Add zents associated with this agent
          const agentZents = zents.filter(zent => zent.agent === agent.slug)
          agentZents.forEach(zent => {
            agentNode.children.push({
              id: zent.id,
              type: 'zent',
              title: zent.name,
              name: zent.name,
              ...zent
            })
          })

          teamNode.children.push(agentNode)
        })

        // Add zents directly associated with this team
        const teamZents = zents.filter(zent => zent.team === team.slug)
        teamZents.forEach(zent => {
          teamNode.children.push({
            id: zent.id,
            type: 'zent',
            title: zent.name,
            name: zent.name,
            ...zent
          })
        })

        standaloneTeamsNode.children.push(teamNode)
      })

      tree.push(standaloneTeamsNode)
    }

    // Add standalone agents (not associated with any organization or team)
    const standaloneAgents = agents.filter(agent => !agent.organization && !agent.team)
    if (standaloneAgents.length > 0) {
      const standaloneAgentsNode = {
        id: 'standalone-agents',
        type: 'folder',
        name: 'Apps',
        expanded: true,
        children: []
      }

      standaloneAgents.forEach(agent => {
        const agentNode = {
          id: agent.id,
          type: 'agent',
          name: agent.name,
          expanded: true,
          children: [],
          ...agent
        }

        // Add zents associated with this standalone agent
        const agentZents = zents.filter(zent => zent.agent === agent.slug)
        agentZents.forEach(zent => {
          agentNode.children.push({
            id: zent.id,
            type: 'zent',
            title: zent.name,
            name: zent.name,
            ...zent
          })
        })

        standaloneAgentsNode.children.push(agentNode)
      })

      tree.push(standaloneAgentsNode)
    }

    // Add standalone zents (not associated with any organization, team, or agent)
    const standaloneZents = zents.filter(zent => !zent.organization && !zent.agent && !zent.team)
    if (standaloneZents.length > 0) {
      const standaloneZentsNode = {
        id: 'standalone-zents',
        type: 'folder',
        name: 'Zents',
        expanded: true,
        children: []
      }

      standaloneZents.forEach(zent => {
        standaloneZentsNode.children.push({
          id: zent.id,
          type: 'zent',
          title: zent.name,
          name: zent.name,
          ...zent
        })
      })

      tree.push(standaloneZentsNode)
    }

    console.log('Final tree:', tree)

    // Update treeData
    treeData.splice(0, treeData.length, ...tree)
  } catch (error) {
    console.error('Error loading tree data:', error)
  }
}

// Load data when component is mounted
onMounted(async () => {
  await Promise.all([
    organizationStore.loadOrganizations(),
    agentStore.loadAgents(),
    zentStore.loadZents(),
    teamStore.loadTeams()
  ])
  loadTreeData()

  // Watch for changes in any of the stores
  watch([
    () => organizationStore.organizations.value,
    () => agentStore.agents.value,
    () => zentStore.zents.value,
    () => teamStore.teams.value
  ], () => {
    loadTreeData()
  }, { deep: true })
})

// Clean up when component is unmounted
onBeforeUnmount(() => {
  // Clean up recording resources if still recording
  if (isRecording.value) {
    stopRecording().catch(error => {
      console.error('Error stopping recording during unmount:', error)
    })
  }

  // Remove any event listeners
  window.electron.ipcRenderer.removeAllListeners('action-captured')
})

const activeThreadId = ref('')

// 팀스페이스 생성 다이얼로그 상태 및 입력값
const showWorkspaceDialog = ref(false)
const workspaceName = ref('')
const workspaceDesc = ref('')
const workspacePermission = ref('private')

watch(showWorkspaceDialog, (open) => {
  if (open) {
    workspaceName.value = ''
    workspaceDesc.value = ''
    workspacePermission.value = 'public'
  }
})


import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'
import ThreadItem from './ThreadItem.vue'
import ThreadItemZent from './ThreadItemZent.vue'
import ThreadItemAgent from './ThreadItemAgent.vue'
import ThreadItemOrganization from './ThreadItemOrganization.vue'
import ThreadItemTeam from './ThreadItemTeam.vue'
import ZentDeleteDialog from './dialogs/zent/delete.vue'
import ZentRenameDialog from './dialogs/zent/rename.vue'
import ZentDetailDialog from './dialogs/zent/detail.vue'
import ZentMoveDialog from './dialogs/zent/move.vue'
import AgentAddDialog from './dialogs/agent/add.vue'
import AgentDetailDialog from './dialogs/agent/detail.vue'
import AgentDeleteDialog from './dialogs/agent/delete.vue'
import AgentRenameDialog from './dialogs/agent/rename.vue'
import AgentMoveDialog from './dialogs/agent/move.vue'
import TeamAddDialog from './dialogs/team/add.vue'
import TeamDeleteDialog from './dialogs/team/delete.vue'
import TeamRenameDialog from './dialogs/team/rename.vue'
import OrganizationAddDialog from './dialogs/organization/add.vue'
import OrganizationDeleteDialog from './dialogs/organization/delete.vue'
import OrganizationRenameDialog from './dialogs/organization/rename.vue'
import OrganizationDetail from './dialogs/organization/detail.vue'
import TeamDetailDialog from './dialogs/team/detail.vue'
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue'
import { usePresenter } from '@/composables/usePresenter'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'

import { useChatStore } from '@/stores/chat'
import { CONVERSATION } from '@shared/presenter'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useEventListener } from '@vueuse/core'
import { SHORTCUT_EVENTS } from '@/events'
import {apiRequest} from "../api";
import {useToast} from "./ui/toast";
import {nanoid} from "nanoid";
import {organizationStore} from "../stores/organization";
import {teamStore} from "../stores/team";
import {agentStore} from "../stores/agent";
import {zentStore} from "../stores/zent";

const { t } = useI18n()
const chatStore = useChatStore()
const threadP = usePresenter('threadPresenter')

// Filter teams and agents based on selected organization
const filteredTeams = computed(() => {
  if (!selectedOrganization.value) return []
  return teamStore.teams.value.filter(team => team.organization === selectedOrganization.value.slug)
})

const filteredAgents = computed(() => {
  if (!selectedOrganization.value) return []
  if (!selectedTeam.value) return agentStore.agents.value.filter(agent => agent.organization === selectedOrganization.value.slug)
  return agentStore.agents.value.filter(agent => agent.organization === selectedOrganization.value.slug && agent.team === selectedTeam.value.slug)
})
const scrollAreaRef = ref<InstanceType<typeof ScrollArea> | null>(null)
const deleteDialog = ref(false)
const deleteThread = ref(null)
const renameDialog = ref(false)
const renameThread = ref(null)
const cleanMessagesDialog = ref(false)
const cleanMessagesThread = ref(null)
const currentPage = ref(1) // 当前页码

const deleteDialogOrganization = ref(false)
const renameDialogOrganization = ref(false)
const addTeamDialog = ref(false)
// const addAgentDialogOrganization = ref(false)

// Dialog states for Team, Agent, Zent actions
const deleteDialogTeam = ref(false)
const renameDialogTeam = ref(false)
const deleteDialogAgent = ref(false)
const renameDialogAgent = ref(false)
const deleteDialogZent = ref(false)
const renameDialogZent = ref(false)
const moveDialogZent = ref(false)
const moveDialogAgent = ref(false)
const editDialogZent = ref(false)

// Selected items for actions
const selectedOrganization = ref<any>(null)
const selectedTeam = ref<any>(null)
const selectedAgent = ref<any>(null)
const selectedZent = ref<any>(null)
const isLoadingRecording = ref(false)

// Recording functionality
const isRecording = ref(false)
const recordedActions = ref<any[]>([])
const recordingCompleteDialog = ref(false)
let cdpConnection: any = null

// Handle recording button click
const handleRecordingClick = async () => {
  if (isRecording.value) {
    // Stop recording
    await stopRecording()
  } else {
    // Start recording
    await startRecording()
  }
}

// Start browser recording
const startRecording = async () => {
  try {
    isLoadingRecording.value = true
    // Start Chrome with CDP enabled on port 9222
    await window.electron.ipcRenderer.invoke('start-chrome-with-cdp')

    // Connect to Chrome CDP
    cdpConnection = await connectToCDP()

    // Start capturing actions
    await startCapturingActions()

    // Update recording state
    isRecording.value = true
    recordedActions.value = []

    toast({
      title: t('common.recordingStarted', 'Recording Started'),
      description: t('common.recordingStartedDesc', 'Browser actions are now being recorded'),
    })
    isLoadingRecording.value = false
  } catch (error) {
    console.error('Failed to start recording:', error)
    toast({
      title: t('common.error.recordingFailed', 'Recording Failed'),
      description: String(error),
      variant: 'destructive'
    })
  }
}

// Stop browser recording
const stopRecording = async () => {
  try {
    // Stop capturing actions
    if (cdpConnection) {
      await stopCapturingActions()
      cdpConnection = null
    }
    console.log('Recorded actions:', recordedActions.value)

    // Update recording state
    isRecording.value = false

    // Show recording complete dialog if we have actions
    if (recordedActions.value.length > 0) {
      recordingCompleteDialog.value = true
    } else {
      toast({
        title: t('common.recordingStopped', 'Recording Stopped'),
        description: t('common.noActionsRecorded', 'No actions were recorded'),
      })
    }
  } catch (error) {
    console.error('Failed to stop recording:', error)
    isRecording.value = false
    toast({
      title: t('common.error.recordingStopFailed', 'Failed to Stop Recording'),
      description: String(error),
      variant: 'destructive'
    })
  }
}

// Connect to Chrome DevTools Protocol
const connectToCDP = async () => {
  try {
    // Connect to Chrome CDP on port 9222
    return await window.electron.ipcRenderer.invoke('connect-to-cdp')
  } catch (error) {
    console.error('Failed to connect to CDP:', error)
    throw new Error('Failed to connect to Chrome DevTools Protocol')
  }
}

// Start capturing user actions
const startCapturingActions = async () => {
  try {
    // Set up event listeners for user actions via CDP
    await window.electron.ipcRenderer.invoke('start-capturing-actions')

    // Set up event listener for captured actions
    window.electron.ipcRenderer.on('action-captured', (event, action) => {
      recordedActions.value.push(action)
    })
  } catch (error) {
    console.error('Failed to start capturing actions:', error)
    throw new Error('Failed to start capturing browser actions')
  }
}

// Stop capturing user actions
const stopCapturingActions = async () => {
  try {
    // Remove event listeners
    window.electron.ipcRenderer.removeAllListeners('action-captured')

    // Stop capturing actions via CDP
    await window.electron.ipcRenderer.invoke('stop-capturing-actions')
  } catch (error) {
    console.error('Failed to stop capturing actions:', error)
    throw new Error('Failed to stop capturing browser actions')
  }
}

// Create automation from recorded actions
const createAutomation = async () => {
  try {
    // Close the dialog
    recordingCompleteDialog.value = false

    // Show loading toast
    toast({
      title: t('common.generatingAutomation', 'Generating Automation'),
      description: t('common.generatingAutomationDesc', 'Creating automation code from recorded actions...'),
    })

    console.log("recordedActions.value");
    console.log(recordedActions.value);

    // Format the recorded actions as JSON
    const formattedActions = JSON.stringify(recordedActions.value, null, 2);

    // Create a prompt for the automation code
    const prompt = `
I need to create a browser automation script based on the following recorded user actions:

\`\`\`json
${formattedActions}
\`\`\`

Please generate a Python script using Selenium and Chrome DevTools Protocol (CDP) that reproduces these actions.
The script should:
1. Initialize Chrome with CDP enabled on port 9222
2. Connect to CDP
3. Navigate to the URLs and perform the recorded actions (clicks, keyboard inputs, etc.)
4. Use both Selenium for high-level actions and CDP for more complex interactions
5. Include proper error handling and waiting for elements
6. Be well-commented and easy to understand
    `.trim();

    // Create a zentData object
    const zentData = {
      name: t('common.browserAutomation', 'Browser Automation'),
      systemPrompt: 'You are an expert in browser automation. Generate clean, working Python code using Selenium and Chrome DevTools Protocol.',
      temperature: 0.2,
      maxTokens: 2000,
      think: false,
      search: false
    };

    // Execute the zent with the prompt
    const threadId = await chatStore.executeZent(
      zentData,
      prompt,
      [], // No tool calls
      [], // No locked inputs
      t
    );

    // Success toast
    toast({
      title: t('common.automationCreated', 'Automation Created'),
      description: t('common.automationCreatedDesc', 'Automation code has been generated successfully'),
    })
  } catch (error) {
    console.error('Failed to create automation:', error)
    toast({
      title: t('common.error.automationFailed', 'Automation Creation Failed'),
      description: String(error),
      variant: 'destructive'
    })
  }
}

// Cancel recording
const cancelRecording = () => {
  recordingCompleteDialog.value = false
  recordedActions.value = []
}

// 创建新会话
const createNewThread = async () => {
  try {
    await chatStore.createNewEmptyThread()
  } catch (error) {
    console.error(t('common.error.createChatFailed'), error)
  }
}

// 处理滚动事件
const handleScroll = async () => {
  // 通过event.target获取滚动元素
  // const target = event.target as HTMLElement
  // const { scrollTop, scrollHeight, clientHeight } = target
  // 使用viewportRef直接获取
  const viewportElement = scrollAreaRef.value?.$el?.querySelector('.h-full.w-full') as HTMLElement
  const viewportScrollTop = viewportElement?.scrollTop || 0
  const viewportScrollHeight = viewportElement?.scrollHeight || 0
  const viewportClientHeight = viewportElement?.clientHeight || 0
  // console.log('滚动检测数据:', {
  //   scrollTop, scrollHeight, clientHeight,
  //   viewportScrollTop, viewportScrollHeight, viewportClientHeight,
  //   diff: viewportScrollHeight - viewportScrollTop - viewportClientHeight,
  //   isLoading: chatStore.isLoading,
  //   hasMore: chatStore.hasMore
  // })

  // 使用viewport的滚动位置判断
  if (
    viewportScrollHeight - viewportScrollTop - viewportClientHeight < 30 &&
    !chatStore.isLoading &&
    chatStore.hasMore
  ) {
    currentPage.value++
    console.log('触发加载更多, 下一页:', currentPage.value)
    await chatStore.loadThreads(currentPage.value)
  }
}

// 选择会话
const handleThreadSelect = async (thread) => {
  try {
    await chatStore.setActiveThread(thread.id)
  } catch (error) {
    console.error(t('common.error.selectChatFailed'), error)
  }
}

// 重命名会话
const handleThreadRename = async () => {
  try {
    if (!renameThread.value) {
      return
    }
    await chatStore.renameThread(renameThread.value.id, renameThread.value.title)
  } catch (error) {
    console.error(t('common.error.renameChatFailed'), error)
  }

  renameDialog.value = false
  renameThread.value = null
}

const showDeleteDialog = (thread) => {
  deleteDialog.value = true
  deleteThread.value = thread
}

const handleDeleteDialogCancel = () => {
  deleteDialog.value = false
  deleteThread.value = null
}

// 删除会话
const handleThreadDelete = async () => {
  try {
    console.log("handleThreadDelete")
    console.log(deleteThread.value)
    console.log(deleteThread.value.id)
    console.log(chatStore.threads[0].dtThreads.length)
    if (!deleteThread.value) {
      return
    }
    let result = await threadP.deleteConversation(deleteThread.value.id)
    console.log("result")
    console.log(result)

    // 删除后重新加载第一页
    currentPage.value = 1
    await chatStore.loadThreads(1)

    if (chatStore.threads.length > 0 && chatStore.threads[0].dtThreads.length > 0) {
      chatStore.setActiveThread(chatStore.threads[0].dtThreads[0].id)
    } else {
      chatStore.createThread(t('common.newChat'), {
        systemPrompt: '',
        temperature: 0.7,
        contextLength: 1000,
        maxTokens: 2000,
        providerId: '',
        modelId: ''
      })
    }
  } catch (error) {
    console.error(t('common.error.deleteChatFailed'), error)
  }

  deleteDialog.value = false
  deleteThread.value = null
}

const showMoveDialogZent = (thread) => {
  moveDialogZent.value = true
  selectedZent.value = thread
}

const showMoveDialogAgent = (thread) => {
  moveDialogAgent.value = true
  selectedAgent.value = thread
}

// 显示清空消息对话框
const showCleanMessagesDialog = (thread) => {
  cleanMessagesDialog.value = true
  cleanMessagesThread.value = thread
}

// 取消清空消息对话框
const handleCleanMessagesDialogCancel = () => {
  cleanMessagesDialog.value = false
  cleanMessagesThread.value = null
}

// 清空会话消息
const handleThreadCleanMessages = async () => {
  try {
    if (!cleanMessagesThread.value) {
      return
    }
    await chatStore.clearAllMessages(cleanMessagesThread.value.id)
  } catch (error) {
    console.error(t('common.error.cleanMessagesFailed'), error)
  }

  cleanMessagesDialog.value = false
  cleanMessagesThread.value = null
}

const showRenameDialog = (thread) => {
  renameDialog.value = true
  renameThread.value = thread
}

const handleRenameDialogCancel = () => {
  renameDialog.value = false
  renameThread.value = null
}

// 处理清除聊天历史
const handleCleanChatHistory = () => {
  if (chatStore.activeThread) {
    showCleanMessagesDialog(chatStore.activeThread)
  }
}

// 重命名会话
const handleThreadRenameOrganization = async () => {
  try {
    if (!selectedOrganization.value) {
      return
    }
    await organizationStore.updateOrganization(selectedOrganization.value.id,
      {name: selectedOrganization.value.name})


    await apiRequest('/zentrun-organization/', 'PUT', {
      slug: selectedOrganization.value.slug,
      name: selectedOrganization.value.name
    })

  } catch (error) {
    console.error(t('common.error.renameChatFailed'), error)
  }
  renameDialogOrganization.value = false
  selectedOrganization.value = null
}


// 删除会话
const handleThreadDeleteOrganization = async () => {
  try {
    if (!selectedOrganization.value) {
      return
    }
    await organizationStore.deleteOrganization(selectedOrganization.value.id)

    await apiRequest('/zentrun-organization/', 'DELETE', {
      slug: selectedOrganization.value.slug
    })

  } catch (error) {
    console.error(t('common.error.renameChatFailed'), error)
  }
  deleteDialogOrganization.value = false
  selectedOrganization.value = null
}

const showRenameDialogOrganization = (item) => {
  renameDialogOrganization.value = true
  selectedOrganization.value = item
}

const handleRenameDialogCancelOrganization = () => {
  renameDialogOrganization.value = false
  selectedOrganization.value = null
}

const showDeleteDialogOrganization = (item) => {
  deleteDialogOrganization.value = true
  selectedOrganization.value = item
}

const handleDeleteDialogCancelOrganization = () => {
  deleteDialogOrganization.value = false
  selectedOrganization.value = null
}

const showAddTeamDialogOrganization = (item) => {
  addTeamDialog.value = true
  showOrganizationDetailDialog.value = false
  selectedOrganization.value = item
}

const showAddTeamDialogTeam = (item) => {
  addTeamDialog.value = true
  selectedTeam.value = item
}

const showAddAgentDialogOrganization = (item) => {
  showAgentAddModal.value = true
  selectedOrganization.value = item
}

const showAddAgentDialogTeam = (item) => {
  showAgentAddModal.value = true
  selectedTeam.value = item
}


// Team actions
const showRenameDialogTeam = (team: any) => {
  renameDialogTeam.value = true
  selectedTeam.value = team
}

const handleRenameDialogCancelTeam = () => {
  renameDialogTeam.value = false
  selectedTeam.value = null
}

const showDeleteDialogTeam = (team: any) => {
  deleteDialogTeam.value = true
  selectedTeam.value = team
}

const handleDeleteDialogCancelTeam = () => {
  deleteDialogTeam.value = false
  selectedTeam.value = null
}

// Agent actions
const showRenameDialogAgent = (agent: any) => {
  renameDialogAgent.value = true
  selectedAgent.value = agent
}

const handleRenameDialogCancelAgent = () => {
  renameDialogAgent.value = false
  selectedAgent.value = null
}

const showDeleteDialogAgent = (agent: any) => {
  deleteDialogAgent.value = true
  selectedAgent.value = agent
}

const handleDeleteDialogCancelAgent = () => {
  deleteDialogAgent.value = false
  selectedAgent.value = null
}

// Zent actions
const showRenameDialogZent = (zent: any) => {
  renameDialogZent.value = true
  selectedZent.value = zent
}

const handleRenameDialogCancelZent = () => {
  renameDialogZent.value = false
  selectedZent.value = null
}

const showDeleteDialogZent = (zent: any) => {
  deleteDialogZent.value = true
  selectedZent.value = zent
}

const handleDeleteDialogCancelZent = () => {
  deleteDialogZent.value = false
  selectedZent.value = null
}


const showEditDialogZent = async (zent) => {
  console.log("showEditDialogZent called with zent:", zent);
  selectedZent.value = zent
  editDialogZent.value = true
  isViewMode.value = false
  console.log("After setting selectedZent:", selectedZent.value);
}

const showViewDialogZent = async (zent) => {
  console.log("showEditDialogZent called with zent:", zent);
  selectedZent.value = zent
  editDialogZent.value = true
  isViewMode.value = true
  console.log("After setting selectedZent:", selectedZent.value);
}

// 在组件挂载时加载会话列表
onMounted(async () => {
  currentPage.value = 1 // 重置页码
  await chatStore.loadThreads(1)

  // 使用nextTick确保DOM已更新
  nextTick(() => {
    const viewportElement = scrollAreaRef.value?.$el?.querySelector('.h-full.w-full') as HTMLElement
    if (viewportElement) {
      console.log('设置直接DOM滚动监听')
      useEventListener(viewportElement, 'scroll', handleScroll)
    }
  })

  // 监听清除聊天历史的快捷键事件
  window.electron.ipcRenderer.on(SHORTCUT_EVENTS.CLEAN_CHAT_HISTORY, () => {
    handleCleanChatHistory()
  })
})

// 在组件卸载前移除事件监听
onBeforeUnmount(() => {
  // 移除清除聊天历史的事件监听
  window.electron.ipcRenderer.removeAllListeners(SHORTCUT_EVENTS.CLEAN_CHAT_HISTORY)
})
</script>

<style scoped></style>
