<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-full h-[90vh]">
      <DialogHeader>
        <div class="flex items-center">
          <button class=" hover:text-gray-800 flex items-center" @click="$emit('update:open', false)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {{ t('back') }}
          </button>
          <h2 class="text-xl font-medium ml-4">{{ t('dialog.organization.edit.title') }}</h2>
        </div>
      </DialogHeader>

      <!-- Modal content -->
      <div class="overflow-y-auto">

        <!-- Cover Image Section -->
        <div v-if="!isViewMode || (isViewMode && cover_image_url)" class="relative w-full h-48 bg-gray-100 mb-6">
          <img v-if="cover_image_url" :src="getImageUrl(cover_image_url)" :alt="t('cover-image')" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
            <span>{{ t('no-cover-image') }}</span>
          </div>
          <button
            v-if="!isViewMode && !isViewer"
            class="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded shadow flex items-center"
            @click="showCoverImageUploader = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {{ t('edit-cover-image') }}
          </button>
          <div v-if="showCoverImageUploader" class="absolute inset-0 bg-white p-4 z-10">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium">{{ t('edit-cover-image') }}</h3>
              <button @click="showCoverImageUploader = false" class="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CoverImageUploader v-model="cover_image_url" :label="t('dialog.organization.edit.coverImage', 'Cover Image')" />
            <div class="flex justify-end mt-4">
              <Button @click="showCoverImageUploader = false" variant="default">{{ t('done') }}</Button>
            </div>
          </div>
        </div>
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 ">

          <!-- Left column -->
          <div class="space-y-6">
            <!-- Organization Profile -->
            <div class="pb-4 border-b">
              <div v-if="!editingProfile" class="flex items-start">
<!--                <div class="relative w-16 h-16 mr-4">-->
<!--                  <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">-->
<!--                    <img v-if="thumbnail" :src="getImageUrl(thumbnail)" :alt="t('organization-thumbnail')" class="w-full h-full object-cover" />-->
<!--                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">-->
<!--                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />-->
<!--                    </svg>-->
<!--                  </div>-->
<!--                  <button-->
<!--                    v-if="!isViewMode && !isViewer"-->
<!--                    @click="editingProfile = true"-->
<!--                    class="absolute bottom-0 right-0 bg-white rounded-full p-0.5 border border-gray-200 hover:bg-gray-100"-->
<!--                  >-->
<!--                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">-->
<!--                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />-->
<!--                    </svg>-->
<!--                  </button>-->
<!--                </div>-->
                <div>
                  <div class="flex items-center">
                    <h3 class="text-lg font-medium">{{ name || 'Organization Name' }}</h3>
                    <button
                      v-if="!isViewMode && !isViewer"
                      @click="editingProfile = true"
                      class="ml-2 text-gray-400 hover:"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-sm  mt-1">
                    {{ bio || 'Organization bio goes here' }}
                  </p>
                </div>
              </div>

              <!-- Profile Edit Form -->
              <div v-else class="space-y-4">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-medium">{{ t('edit-profile') }}</h3>
                  <button
                    @click="editingProfile = false"
                    class="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div class="flex items-center space-x-4">
<!--                  <ThumbnailSelectorZpilot v-model="thumbnail" label="" :required="true" />-->
                  <div class="flex-1 space-y-2">
                    <Label class="flex flex-col gap-1">
                      <span class="text-xs font-medium">{{t('name')}} <span class="text-red-500">*</span></span>
                      <Input v-model="name" type="text" class="input input-bordered" :placeholder="t('dialog.organization.add.nameLabel')" />
                    </Label>
                    <Label class="flex flex-col gap-1">
                      <span class="text-xs font-medium">{{ t('bio') }} <span v-if="!isPublic" class="text-black">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
                      <Textarea v-model="bio" rows="2" class="w-full border rounded p-2 text-sm" :placeholder="t('organization-description')" />
                    </Label>
                  </div>
                </div>

                <div class="flex justify-end">
                  <Button
                    @click="editingProfile = false"
                    variant="default"
                    size="sm"
                  >
                    {{ t('done') }}
                  </Button>
                </div>
              </div>
            </div>

            <!-- Agent List with Expandable Zents -->
            <div>
              <h3 class="text-sm font-medium mb-4">{{ t('agent-list') }}</h3>
              <p class="text-xs  mb-4">
                {{ t('agents-in-this-organization-with-their-associated-zents') }}
              </p>

              <div class="space-y-2 border rounded p-2">
                <div v-for="agent in organizationAgents" :key="agent.id" class="border-b pb-2 last:border-b-0 last:pb-0">
                  <div class="flex items-center px-2 py-1 hover:bg-accent rounded select-none group cursor-pointer" @click="toggleAgentExpanded(agent)">
                    <Icon :icon="agent.expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-4 h-4 mr-1" />
                    <img v-if="agent.thumbnail" :src="getImageUrl(agent.thumbnail)" class="w-8 h-8 mr-2" style="border-radius: 10px" />
                    <span v-else class="w-8 h-8 mr-2 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon icon="lucide:app-window" class="w-4 h-4 text-blue-500" />
                    </span>
                    <span class="font-bold text-xs">{{ agent.name }}</span>
                    <Icon v-if="agent.is_public" icon="lucide:globe" class="w-3 h-3 ml-1 text-blue-500" :title="t('public')" />
                  </div>

                  <!-- Expandable Zent List -->
                  <div v-show="agent.expanded" class="pl-6 mt-1 space-y-1">
                    <div v-for="zent in agent.zents" :key="zent.id" class="flex items-center px-2 py-1 hover:bg-gray-50 rounded text-xs">
                      <Icon icon="lucide:file-text" class="w-3 h-3 mr-2 text-gray-500" />
                      <span>{{ zent.name }}</span>

                      <!-- Tool Calls Icons -->
                      <div class="flex ml-2 space-x-1">
                        <div v-if="zent.tool_calls && zent.tool_calls.length > 0"
                             v-for="tool_call in zent.tool_calls"
                             :key="tool_call.id"
                             class=" text-xs p-1 border-[1px] border-gray-300" style="border-radius:3px">
                          {{ tool_call.server_icons }}
                        </div>
                      </div>
                    </div>
                    <div v-if="agent.zents.length === 0" class="text-xs text-gray-500 px-2 py-1">
                      {{ t('no-zents-found-for-this-agent') }}
                    </div>
                  </div>
                </div>
                <div v-if="organizationAgents.length === 0" class="text-xs text-gray-500 p-2">
                  {{ t('no-agents-found-in-this-organization') }}
                </div>
              </div>
            </div>

            <!-- Connected MCPs -->
            <div>
              <h3 class="text-sm font-medium mb-4">{{ t('connected-mcps') }}</h3>
              <p class="text-xs  mb-4">
                {{ t('mcps-connected-to-agents-in-this-organization') }}
              </p>

              <div class="space-y-2">
                <div v-for="mcp in uniqueMcps" :key="mcp.server_name"
                     class="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                  <div class="flex items-center">
                    <span v-if="mcp.server_icons" class="mr-2">{{mcp.server_icons}}</span>
                    <span class="text-sm">{{ mcp.server_name }}</span>
                  </div>
                  <div class="flex items-center">
                    <span v-if="isInstalledMcp(mcp.server_name)" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                      {{ t('connected') }}
                    </span>
                    <button v-else @click="openInstallMcpModal(mcp.server_name)"
                            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white border border-gray-300 text-gray-800 mr-2 hover:bg-gray-50">
                      {{ t('install') }}
                    </button>
                  </div>
                </div>
                <div v-if="uniqueMcps.length === 0" class="text-xs text-gray-500 p-2">
                  {{ t('no-mcps-found-in-organization-agents') }}
                </div>
              </div>
            </div>


            <!-- Creator Info -->
            <div v-if="organization?.data?.userInfo" class="pb-6 border-b">
              <h3 class="text-sm font-medium mb-4">{{ t('creator-info') }}</h3>
              <div class="border rounded-md p-4">
                <div class="flex items-center mb-2">
                  <div class="w-10 h-10 rounded-full overflow-hidden mr-3">
                    <img
                      v-if="organization?.data?.userInfo?.imageUrl"
                      :src="organization.data.userInfo.imageUrl"
                      :alt="t('user-profile')"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p class="font-medium text-sm">{{ organization.data.userInfo.username || 'Unknown creator' }}</p>
                  </div>
                </div>

                <!-- Bio -->
                <p v-if="organization?.data?.userInfo?.bio" class="text-xs  mb-5 mt-5">
                  {{ organization.data.userInfo.bio }}
                </p>

                <!-- Social Links -->
                <div class="flex flex-wrap gap-2">
                  <!-- Website URL -->
                  <a
                    v-if="organization?.data?.userInfo?.url"
                    :href="organization.data.userInfo.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <span class="mr-1">🌐</span> {{ t('website') }}
                  </a>

                  <!-- Twitter URL -->
                  <a
                    v-if="organization?.data?.userInfo?.urlTwitter"
                    :href="organization.data.userInfo.urlTwitter"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <span class="mr-1">🐦</span> {{ t('twitter') }}
                  </a>

                  <!-- LinkedIn URL -->
                  <a
                    v-if="organization?.data?.userInfo?.urlLinkedin"
                    :href="organization.data.userInfo.urlLinkedin"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <span class="mr-1">💼</span> LinkedIn
                  </a>

                  <!-- YouTube URL -->
                  <a
                    v-if="organization?.data?.userInfo?.urlYoutube"
                    :href="organization.data.userInfo.urlYoutube"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    <span class="mr-1">📺</span> YouTube
                  </a>
                </div>
              </div>
            </div>

            <!-- Categories, Tags, Permission -->
            <div v-if="!isMarketplaceMode" class="pb-6 border-b">
              <div class="grid grid-cols-1 gap-4">
                <Label class="flex flex-col gap-1">
                  <span class="font-semibold">{{ t('dialog.organization.add.permission') }}</span>
                  <select v-if="!isViewMode && permission === 'public'" v-model="permission" class="w-full border rounded p-2 mt-1">
                    <option value="public">{{ t('dialog.organization.add.permissionPublic') }}</option>
                    <option value="private">{{ t('dialog.organization.add.permissionPrivate') }}</option>
                  </select>
                  <div v-else class="w-full border rounded p-2 mt-1 bg-gray-50">
                    {{ permission === 'public' ? t('dialog.organization.add.permissionPublic') : t('dialog.organization.add.permissionPrivate') }}
                  </div>
                  <p class="text-xs text-muted-foreground mt-1">
                    {{ permission === 'public' ? t('dialog.organization.add.permissionPublicDesc') : t('dialog.organization.add.permissionPrivateDesc') }}
                  </p>
                </Label>
                  <Button
                    v-if="permission === 'private' && !isViewMode && !isViewer && !isEnterpriseMode && isBuildMode"
                    variant="outline"
                    class="mt-2"
                    v-bind:disabled="isLoading.deploy.value"
                    @click="deployToMarketplace"
                  >
                    <div v-if="isLoading.deploy.value" class="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-black"></div>
                    <Icon v-else icon="lucide:upload-cloud" class="h-4 w-4 mr-2" />
                    {{ t('deploy-to-marketplace-0') }}
                  </Button>

                  <p v-if="!props.isViewMode && permission === 'private'" class="text-xs text-muted-foreground mt-1">
                    {{ !user.bio && t('common.introduceProfileSettings') }}
                  </p>
              </div>
            </div>
          </div>

          <!-- Right column -->
          <div class="space-y-6">
            <!-- Tabs for different sections -->
            <Tabs defaultValue="overview" class="w-full">
              <TabsList v-if="!isMarketplaceMode && !isViewer" class="grid grid-cols-5">
                <TabsTrigger value="overview">{{ t('overview') }}</TabsTrigger>
                <TabsTrigger value="members">{{ t('members') }}</TabsTrigger>
                <TabsTrigger value="teams">{{ t('teams') }}</TabsTrigger>
                <TabsTrigger value="activity">{{ t('activity') }}</TabsTrigger>
                <TabsTrigger value="runHistory">{{ t('run-history') }}</TabsTrigger>
              </TabsList>
              <TabsList v-else class="grid grid-cols-1">
                <TabsTrigger value="overview">{{ t('overview') }}</TabsTrigger>
              </TabsList>

              <!-- Overview Tab -->
              <TabsContent value="overview" class="space-y-4">
                <div>
                  <h3 class="text-lg font-medium mb-2">{{ t('organization-description') }}</h3>
                  <div class="mb-4">
                    <div class="flex items-center justify-between">
                      <h4 class="text-sm font-medium">{{ t('description') }} <span v-if="isPublic" class="text-red-500">*</span></h4>
                      <button
                        v-if="!isViewMode && !isViewer"
                        @click="editingDescription = !editingDescription"
                        class="text-gray-400 hover:"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                    <p class="text-xs  mt-2 mb-5">
                      {{ t('describe-the-purpose-and-goals-of-this-organization') }}
                    </p>

                    <div v-if="!editingDescription" class="p-3 border rounded-md bg-gray-50">
                      <p class="text-sm text-gray-700 whitespace-pre-wrap">
                        {{ description || 'Organization description goes here' }}
                      </p>
                    </div>

                    <div v-else class="border rounded-md p-3">
                      <Textarea
                        v-model="description"
                        rows="6"
                        class="w-full border rounded p-2 text-sm"
                        :placeholder="t('enter-organization-description')"
                      />
                      <div class="flex justify-end mt-2">
                        <Button
                          @click="editingDescription = false"
                          variant="default"
                          size="sm"
                        >
                          {{ t('done') }}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Quick Stats -->
                <div v-if="!isMarketplaceMode">
                  <h3 class="text-lg font-medium">{{ t('organization.overview.stats', 'Quick Stats') }}</h3>
                  <div class="grid grid-cols-3 gap-4 mt-2">
                    <div class="p-4 border rounded bg-muted/50">
                      <div class="text-2xl font-bold">{{ teamCount }}</div>
                      <div class="text-sm text-muted-foreground">{{ t('organization.overview.teams', 'Teams') }}</div>
                    </div>
                    <div class="p-4 border rounded bg-muted/50">
                      <div class="text-2xl font-bold">{{ agentCount }}</div>
                      <div class="text-sm text-muted-foreground">{{ t('organization.overview.agents', 'Agents') }}</div>
                    </div>
                    <div class="p-4 border rounded bg-muted/50">
                      <div class="text-2xl font-bold">{{ memberCount }}</div>
                      <div class="text-sm text-muted-foreground">{{ t('organization.overview.members', 'Members') }}</div>
                    </div>
                  </div>
                </div>

                <!-- Organization Mode -->
                <div v-if="!isEnterpriseMode && !isMarketplaceMode">
                  <h3 class="text-lg font-medium">{{ t('organization.overview.mode', 'Organization Mode') }}</h3>
                  <p class="text-sm text-muted-foreground mb-2">{{ t('organization.overview.modeDescription', 'Choose how members collaborate in this organization') }}</p>

                  <!-- If mode is service or agency, just show the current mode -->
                  <div v-if="organization.mode === 'service' || organization.mode === 'agency'" class="mt-2">
                    <div class="p-2 border rounded">
                      <div class="font-medium">
                        {{ organization.mode === 'service'
                          ? t('dialog.organization.add.modeService', 'Service Mode')
                          : t('dialog.organization.add.modeAgency', 'Agency Mode') }}
                      </div>
                      <p class="text-sm text-muted-foreground">
                        {{ organization.mode === 'service'
                          ? t('dialog.organization.add.modeServiceDesc', 'Deploy your workspace to the marketplace to share with users for free or provide services for an hourly fee.')
                          : t('dialog.organization.add.modeAgencyDesc', 'Process automation tasks for your clients and provide a system that combines your service costs with monthly payments for Vapi, n8n, make.com, etc. to bill your clients.') }}
                      </p>
                      <p class="text-xs text-amber-500 mt-1">
                        {{ t('dialog.organization.add.modeWarning', 'Once you select this mode, you cannot change to another mode later.') }}
                      </p>
                    </div>
                  </div>

                  <!-- If mode is team or not set, allow selection but disable service and agency if already team -->
                  <RadioGroup v-else v-model="organizationMode" class="mt-2">
                    <div class="flex items-start space-x-2 p-2 border rounded">
                      <RadioGroupItem value="team" id="team" />
                      <div>
                        <Label for="team" class="font-medium">{{ t('dialog.organization.add.modeTeam', 'Team Mode') }}</Label>
                        <p class="text-sm text-muted-foreground">{{ t('dialog.organization.add.modeTeamDesc', 'Invite team members to your workspace and collaborate together.') }}</p>
                      </div>
                    </div>

                    <div class="flex items-start space-x-2 p-2 border rounded mt-2" :class="{ 'opacity-50': organization.mode === 'team' }">
                      <RadioGroupItem value="service" id="service" :disabled="organization.mode === 'team'" />
                      <div>
                        <Label for="service" class="font-medium">{{ t('dialog.organization.add.modeService', 'Service Mode') }}</Label>
                        <p class="text-sm text-muted-foreground">{{ t('dialog.organization.add.modeServiceDesc', 'Deploy your workspace to the marketplace to share with users for free or provide services for an hourly fee.') }}</p>
                        <p v-if="organizationMode === 'service'" class="text-xs text-amber-500 mt-1">
                          {{ t('dialog.organization.add.modeWarning', 'Once you select this mode, you cannot change to another mode later.') }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-start space-x-2 p-2 border rounded mt-2" :class="{ 'opacity-50': organization.mode === 'team' }">
                      <RadioGroupItem value="agency" id="agency" :disabled="organization.mode === 'team'" />
                      <div>
                        <Label for="agency" class="font-medium">{{ t('dialog.organization.add.modeAgency', 'Agency Mode') }}</Label>
                        <p class="text-sm text-muted-foreground">{{ t('dialog.organization.add.modeAgencyDesc', 'Process automation tasks for your clients and provide a system that combines your service costs with monthly payments for Vapi, n8n, make.com, etc. to bill your clients.') }}</p>
                        <p v-if="organizationMode === 'agency'" class="text-xs text-amber-500 mt-1">
                          {{ t('dialog.organization.add.modeWarning', 'Once you select this mode, you cannot change to another mode later.') }}
                        </p>
                      </div>
                    </div>
                  </RadioGroup>

                  <div v-if="organizationMode === 'agency'" class="mt-4">
                    <Label>{{ t('organization.overview.seatPrice', 'Seat Price') }}</Label>
                    <div class="flex items-center mt-1">
                      <span class="p-2 border border-r-0 rounded-l bg-muted">$</span>
                      <Input v-model="seatPrice" type="number" min="0" step="0.01" class="rounded-l-none" />
                    </div>
                  </div>

                  <Button
                    v-if="!isViewer"
                    variant="outline"
                    class="mt-4"
                    @click="saveOrganizationSettings"
                    :disabled="organization.mode === 'service' || organization.mode === 'agency'"
                  >
                    {{ t('organization.overview.saveSettings', 'Save Settings') }}
                  </Button>
                </div>
              </TabsContent>

              <!-- Members Tab -->
              <TabsContent v-if="!isViewer" value="members" class="space-y-4">
                <div v-if="!isEnterpriseMode">
                  <div class="flex justify-between items-center">
                    <h3 class="text-lg font-medium">{{ t('organization.members.seatsLeft', 'Seats Left', ) }} : {{ seatLimit - memberCount }}</h3>
                    <Button
                      v-if="hasZentrunCore"
                      variant="outline"
                      @click="!isEnterpriseMode && hasZentrunCore && ZentrunSeatPricingPlan ? (showSeatPricingPlan = true) : toast({
                        title: t('feature-unavailable'),
                        description: t('seat-pricing-plan-unavailable'),
                        variant: 'destructive'
                      })"
                    >
                      <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
                      {{ t('organization.members.addSeat', '+ Add Seat') }}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 class="text-lg font-medium">{{ t('organization.members.invite', 'Invite Members') }}</h3>
                  <div class="flex gap-2 mt-2">
                    <Input v-model="inviteEmail" :placeholder="t('organization.members.emailPlaceholder', 'Email address')" class="flex-1" />
                    <Select v-model="inviteRole">
                      <SelectTrigger class="w-[180px]">
                        <SelectValue :placeholder="t('organization.members.selectRole', 'Select role')" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{{ t('organization.members.admin', 'Admin') }}</SelectItem>
                        <SelectItem value="editor">{{ t('organization.members.editor', 'Editor') }}</SelectItem>
                        <SelectItem value="viewer">{{ t('organization.members.viewer', 'Viewer') }}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button @click="inviteMember">{{ t('organization.members.invite', 'Invite') }}</Button>
                  </div>

                  <!-- Additional fields for agency mode -->
                  <div v-if="organization.mode === 'agency'" class="mt-4 space-y-3">
                    <p class="text-sm text-muted-foreground">{{ t('organization.members.agencyTokensDescription', 'Please provide the following tokens for agency services:') }}</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{{ t('organization.members.vapiToken', 'Vapi Token') }}</Label>
                        <Input v-model="inviteTokens.vapi" class="mt-1" />
                      </div>
                      <div>
                        <Label>{{ t('organization.members.n8nToken', 'n8n Cloud Token') }}</Label>
                        <Input v-model="inviteTokens.n8n" class="mt-1" />
                      </div>
                      <div>
                        <Label>{{ t('organization.members.makeToken', 'Make.com Token') }}</Label>
                        <Input v-model="inviteTokens.make" class="mt-1" />
                      </div>
                      <div>
                        <Label>{{ t('organization.members.openaiToken', 'OpenAI Token') }}</Label>
                        <Input v-model="inviteTokens.openai" class="mt-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div class="flex justify-between items-center">
                    <h3 class="text-lg font-medium">{{ t('organization.members.membersList', 'Members') }}</h3>
                    <div v-if="!isEnterpriseMode" class="text-sm text-muted-foreground">
                      {{ t('organization.members.seatsUsed', '{used} of {total} seats used', { used: memberCount, total: seatLimit }) }}
                    </div>
                    <div v-else class="text-sm text-muted-foreground">
                      {{ t('organization.members.totalMembers', 'Total members: {count}', { count: memberCount }) }}
                    </div>
                  </div>

                  <div class="border rounded mt-2 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{{ t('organization.members.name', 'Name') }}</TableHead>
                          <TableHead>{{ t('organization.members.email', 'Email') }}</TableHead>
                          <TableHead>{{ t('organization.members.role', 'Role') }}</TableHead>
                          <TableHead>{{ t('organization.members.status', 'Status') }}</TableHead>
                          <TableHead>{{ t('organization.members.actions', 'Actions') }}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow v-if="members.length === 0">
                          <TableCell colspan="5" class="text-center py-4">
                            {{ t('organization.members.noMembers', 'No members found') }}
                          </TableCell>
                        </TableRow>
                        <TableRow v-for="member in members" :key="member.id">
                          <TableCell>{{ member.name }}</TableCell>
                          <TableCell>{{ member.email }}</TableCell>
                          <TableCell>
                            <Select v-model="member.role" @update:modelValue="updateMemberRole(member)">
                              <SelectTrigger class="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">{{ t('organization.members.admin', 'Admin') }}</SelectItem>
                                <SelectItem value="editor">{{ t('organization.members.editor', 'Editor') }}</SelectItem>
                                <SelectItem value="viewer">{{ t('organization.members.viewer', 'Viewer') }}</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge :variant="member.status === 'active' ? 'default' : 'outline'">
                              {{ member.status === 'active' ? t('organization.members.active', 'Active') : t('organization.members.pending', 'Pending') }}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" @click="removeMember(member)">
                              <Icon icon="lucide:trash-2" class="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <!-- Teams Tab -->
              <TabsContent v-if="!isViewer" value="teams" class="space-y-4">
                <div class="flex justify-between items-center">
                  <h3 class="text-lg font-medium">{{ t('organization.teams.title', 'Teams') }}</h3>
                  <Button @click="$emit('addTeam', organization)">
                    <Icon icon="lucide:folder-plus" class="h-4 w-4 mr-2" />
                    {{ t('organization.teams.addTeam', 'Add Team') }}
                  </Button>
                </div>

                <div class="border rounded overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{{ t('organization.teams.name', 'Name') }}</TableHead>
                        <TableHead>{{ t('organization.teams.description', 'Description') }}</TableHead>
                        <TableHead>{{ t('organization.teams.members', 'Members') }}</TableHead>
                        <TableHead>{{ t('organization.teams.agents', 'Agents') }}</TableHead>
                        <TableHead>{{ t('organization.teams.actions', 'Actions') }}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-if="teams.length === 0">
                        <TableCell colspan="5" class="text-center py-4">
                          {{ t('organization.teams.noTeams', 'No teams found') }}
                        </TableCell>
                      </TableRow>
                      <TableRow v-for="team in teams" :key="team.id">
                        <TableCell>{{ team.name }}</TableCell>
                        <TableCell>{{ team.description || t('organization.teams.noDescription', 'No description') }}</TableCell>
                        <TableCell>{{ getTeamMemberCount(team) }}</TableCell>
                        <TableCell>{{ getTeamAgentCount(team) }}</TableCell>
                        <TableCell>
                          <div class="flex gap-1">
                            <Button variant="ghost" size="icon" @click="$emit('renameTeam', team)">
                              <Icon icon="lucide:pencil" class="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" @click="$emit('deleteTeam', team)">
                              <Icon icon="lucide:trash-2" class="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <!-- Activity Tab -->
              <TabsContent v-if="!isViewer" value="activity" class="space-y-4">
                <h3 class="text-lg font-medium">{{ t('organization.activity.title', 'Activity Log') }}</h3>

                <div class="border rounded overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{{ t('organization.activity.date', 'Date') }}</TableHead>
                        <TableHead>{{ t('organization.activity.user', 'User') }}</TableHead>
                        <TableHead>{{ t('organization.activity.action', 'Action') }}</TableHead>
                        <TableHead>{{ t('organization.activity.details', 'Details') }}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-if="activityLogs.length === 0">
                        <TableCell colspan="4" class="text-center py-4">
                          {{ t('organization.activity.noLogs', 'No activity logs found') }}
                        </TableCell>
                      </TableRow>
                      <TableRow v-for="log in activityLogs" :key="log.id">
                        <TableCell>{{ formatDate(log.created_at) }}</TableCell>
                        <TableCell>{{ log.user }}</TableCell>
                        <TableCell>{{ log.action }}</TableCell>
                        <TableCell>{{ log.entity_name }}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <!-- Run History Tab -->
              <TabsContent v-if="!isViewer" value="runHistory" class="space-y-4">
                <h3 class="text-lg font-medium">{{ t('organization.runHistory.title', 'Run History') }}</h3>

                <div class="border rounded overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{{ t('organization.runHistory.date', 'Date') }}</TableHead>
                        <TableHead>{{ t('organization.runHistory.type', 'Type') }}</TableHead>
                        <TableHead>{{ t('organization.runHistory.agent', 'Agent') }}</TableHead>
                        <TableHead>{{ t('organization.runHistory.status', 'Status') }}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-if="runHistories.length === 0">
                        <TableCell colspan="5" class="text-center py-4">
                          {{ t('organization.runHistory.noHistory', 'No run history found') }}
                        </TableCell>
                      </TableRow>
                      <TableRow v-for="history in runHistories" :key="history.id">
                        <TableCell>{{ formatDate(history.created_at) }}</TableCell>
                        <TableCell>{{ history.type }}</TableCell>
                        <TableCell>{{ history.agent_name }}</TableCell>
                        <TableCell>
                          <Badge :variant="getStatusVariant(history.status)">
                            {{ history.status }}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <!-- Save Button or Run Zpilot Button at bottom right -->
      <div class="flex justify-end p-4 border-t">
        <Button
          variant="outline"
          class="mr-2"
          @click="$emit('update:open', false)"
        >
          {{ t('close') }}
        </Button>
        <Button
          v-if="props.isViewMode && !isMarketplaceMode"
          variant="outline"
          class="text-sm mr-2 "
          @click="$emit('edit')"
        >
          <Icon icon="lucide:edit" class="h-4 w-4 mr-2" />
          {{ t('edit') }}
        </Button>
        <Button
          v-if="!isViewMode && !isMarketplaceMode"
          variant="default"
          v-bind:disabled="isLoading.save.value"
          class="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-md text-sm"
          @click="handleOrganizationUpdate({
            id: organization?.id,
            name,
            description,
            permission,
            thumbnail,
            bio,
            cover_image_url,
            mode: organizationMode,
            seatPrice
          })"
        >
          <div v-if="isLoading.save.value" class="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></div>
          {{ t('dialog.organization.edit.save') }}
        </Button>
        <Button
          v-else-if="isMarketplaceMode && props.organization.data?.service_cost"
          variant="default"
          class=" font-bold py-2 px-4 rounded-md text-sm"
          @click="openPaymentUrl"
        >
          <Icon icon="lucide:credit-card" class="h-4 w-4 mr-2" />
          {{ t('Rent') }} - ${{ props.organization.data?.service_cost }}/{{ t('Month') }}
        </Button>
        <Button
          v-else-if="isMarketplaceMode"
          variant="default"
          class=" font-bold py-2 px-4 rounded-md text-sm"
          @click="cloneOrganization"
        >
          <Icon icon="lucide:copy" class="h-4 w-4 mr-2" />
          {{ t('clone') }}
        </Button>
        <Button
          v-else
          variant="default"
          class=" font-bold py-2 px-4 rounded-md text-sm"
          @click="handleExecuteZpilot"
        >
          <Icon icon="lucide:play" class="h-4 w-4 mr-2" />
          {{ t('run-zpilot') }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- MCP Installation Modal -->
  <McpInstallDialog
    v-if="installMcpModalOpen"
    :open="installMcpModalOpen"
    :server-name="currentMcpToInstall"
    @update:open="installMcpModalOpen = $event"
    @install="handleInstallMcp"
  />

  <!-- Seat Pricing Plan Dialog - Only shown when zentrun-app-core is available -->
  <Dialog v-if="hasZentrunCore && ZentrunSeatPricingPlan" :open="showSeatPricingPlan" @update:open="showSeatPricingPlan = $event">
    <DialogContent class="max-w-6xl h-[90vh] p-0">
      <component
        :is="ZentrunSeatPricingPlan"
        :organization="organization"
        :currentSeats="seatLimit"
        @seatAdded="handleSeatAdded"
        @close="showSeatPricingPlan = false"
      />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { nanoid } from 'nanoid'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@iconify/vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { teamStore } from '@/stores/team'
import { agentStore } from '@/stores/agent'
import { zentStore } from '@/stores/zent'
import { runHistoryStore } from '@/stores/runHistory'
import { activityStore } from '@/stores/activity'
import { useMcpStore } from "@/stores/mcp"
import { useChatStore } from '@/stores/chat'
import { apiRequest } from '@/api'
import ThumbnailSelectorZpilot from '@/components/ThumbnailSelectorZpilot.vue'
import CoverImageUploader from '@/components/CoverImageUploader.vue'
import McpInstallDialog from '@/components/dialogs/mcp/install.vue'
// ZentrunSeatPricingPlan will be imported dynamically if available
import router from '@/router'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group'
import { usePresenter } from '@/composables/usePresenter'
import {organizationStore} from "@/stores/organization";
import { isViewerRole } from '@/lib/roleUtils';

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  organization: {
    type: Object,
    required: true
  },
  isViewMode: {
    type: Boolean,
    default: false
  },
  isMarketplaceMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'save', 'addTeam', 'renameTeam', 'deleteTeam', 'edit'])

const { t } = useI18n()
const { toast } = useToast()
const mcpStore = useMcpStore()
const chatStore = useChatStore()
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Organization profile data
const name = ref('')
const bio = ref('')
const description = ref('')
const thumbnail = ref('')
const cover_image_url = ref('')
const permission = ref('private')
const isPublic = computed(() => permission.value === 'public')
const showCoverImageUploader = ref(false)
const editingProfile = ref(false)
const editingDescription = ref(false)

// Check if the current user has a viewer role in this organization
const isViewer = computed(() => {
  return isViewerRole(props.organization.slug)
})

// Organization settings
const organizationMode = ref('team')
const seatPrice = ref(0)
const seatLimit = ref(0)

// Members management
const inviteEmail = ref('')
const inviteRole = ref('viewer')
const inviteTokens = ref({
  vapi: '',
  n8n: '',
  make: '',
  openai: ''
})
const members = ref([])
const showSeatPricingPlan = ref(false)
const hasZentrunCore = ref(false)
const ZentrunSeatPricingPlan = ref(null)

// Import the utility functions
import { getZentrunCorePath, hasZentrunCore as checkZentrunCore } from '@shared/zentrunCore'

// Check if zentrun-app-core module is available
const checkZentrunCoreAvailability = () => {
  // Use the utility function to check if zentrun-app-core is available
  hasZentrunCore.value = checkZentrunCore()

  // Get the appropriate module path
  const zentrunCorePath = getZentrunCorePath()

  // Dynamically import the component
  import(`@shared/${zentrunCorePath}/views/ZentrunSeatPricingPlan.vue`)
    .then(module => {
      ZentrunSeatPricingPlan.value = module.default
    })
    .catch(error => {
      console.error(`Error loading ZentrunSeatPricingPlan from ${zentrunCorePath}:`, error)
      hasZentrunCore.value = false
    })
}

// Teams, agents, and activity data
const teams = computed(() => {
  return teamStore.teams.value.filter(team => team.organization === props.organization.slug)
})

const agentCount = computed(() => {
  return agentStore.agents.value.filter(agent => agent.organization === props.organization.slug).length
})

const teamCount = computed(() => teams.value.length)

const memberCount = ref(0)

const activityLogs = ref([])
const runHistories = ref([])

const isLoading = {
  deploy: ref(false),
  clone: ref(false),
  save: ref(false),
}

// Handle organization update
const handleOrganizationUpdate = async (organizationData) => {
  isLoading.save.value = true;
  console.log('handleOrganizationUpdate organizationData:', organizationData);

  // Validate required fields
  const missingFields = [];

  // Always require name
  if (!organizationData.name) {
    missingFields.push('name');
  }

  // If permission is public, also require bio and description
  if (organizationData.permission === 'public') {
    if (!organizationData.bio) missingFields.push('bio');
    if (!organizationData.description) missingFields.push('description');
  }

  if (missingFields.length > 0) {
    toast({
      title: t('please-fill-in-all-required-fields'),
      description: t('the-following-fields-are-required') + `${missingFields.join(', ')}`,
      variant: 'destructive'
    });
    isLoading.save.value = false;
    return;
  }

  try {
    // Prepare the organization data
    const updatedOrganization = {
      name: organizationData.name,
      description: organizationData.description,
      slug: props.organization.slug,
      bio: organizationData.bio,
      thumbnail: organizationData.thumbnail,
      cover_image_url: organizationData.cover_image_url,
      mode: organizationData.mode,
      is_public: organizationData.permission === 'public' ? 1 : 0,
    };

    // If seat price is provided, add it to the data field
    if (organizationData.seatPrice) {
      updatedOrganization.data = {
        seat_price: organizationData.seatPrice
      };
    }

    // Update organization in local store
    await organizationStore.updateOrganization(props.organization.id, updatedOrganization);

    toast({ title: t('organization-updated-successfully') });

    // Close the dialog
    emit('update:open', false);

    // Update organization via API
    try {
      // Create a deep copy of the data before making the API request
      const updateData = structuredClone(JSON.parse(JSON.stringify({
        name: organizationData.name,
        description: organizationData.description,
        slug: props.organization.slug,
        bio: organizationData.bio,
        thumbnail: organizationData.thumbnail,
        cover_image_url: organizationData.cover_image_url,
        mode: organizationData.mode,
        is_public: organizationData.permission === 'public',
        seat_price: organizationData.seatPrice
      })));
      await apiRequest(`/zentrun-organization/`, 'PUT', updateData);
    } catch (error) {
      console.error('Failed to update organization via API:', error);
    }
  } catch (error) {
    console.error('Error updating organization:', error);
    toast({
      title: t('error-updating-organization'),
      description: error.message || t('an-error-occurred'),
      variant: 'destructive'
    });
  } finally {
    isLoading.save.value = false;
  }
};

// MCP related
const installMcpModalOpen = ref(false)
const currentMcpToInstall = ref('')
const installedMcps = ref({})

// Get mcpPresenter
const mcpPresenter = usePresenter('mcpPresenter')

// Agent list with expandable Zents
const organizationAgents = ref([])

// Check if enterprise mode is enabled
const isEnterpriseMode = computed(() => {
  return import.meta.env.VITE_ZENTRUN_ENTERPRISE_MODE === 'true'
})
const isBuildMode = computed(() => {
  return import.meta.env.VITE_IS_FOR_BUILD === 'true'
})

function getImageUrl(imageName) {
  return new URL(`../../../assets/images/characters/${imageName}`, import.meta.url).href;
}

// Initialize the MCP servers data on component mount
onMounted(async () => {
  try {
    // Check if zentrun-app-core is available
    checkZentrunCoreAvailability()

    // Fetch MCP servers from the presenter
    installedMcps.value = await mcpPresenter.getMcpServers()
    if (props.organization) {
      // Load organization data
      await loadMembers()
      await loadActivityLogs()
      await loadRunHistory()
      await loadOrganizationAgents()
    }
  } catch (error) {
    console.error('Failed to fetch installed MCPs:', error)
  }
})

// Check if an MCP is installed by checking if it exists as a key in the installedMcps object
function isInstalledMcp(mcpName) {
  return Object.keys(installedMcps.value).includes(mcpName);
}

function openInstallMcpModal(mcpName) {
  currentMcpToInstall.value = mcpName;
  installMcpModalOpen.value = true;
}

async function handleInstallMcp(serverName, installData) {
  try {
    await mcpStore.installMcpServer(serverName, installData);
    installedMcps.value[serverName] = installData;
    toast({
      title: t('mcp-installed'),
      description: t('successfully-installed') + `${serverName}`,
    });
  } catch (error) {
    console.error('Failed to install MCP:', error);
    toast({
      title: t('installation-failed'),
      description: t('could-not-install') + `${serverName}`,
      variant: 'destructive',
    });
  }
}

// Toggle agent expanded state
function toggleAgentExpanded(agent) {
  agent.expanded = !agent.expanded;
}

// Load organization agents with their zents
async function loadOrganizationAgents() {
  try {

    if (props.isMarketplaceMode) {


      // Map agents with their zents
      organizationAgents.value = props.organization?.data?.agents.map(agent => {
        return {
          ...agent,
          expanded: true
        };
      });
    } else {
        // Get all agents for this organization
      const agents = agentStore.agents.value.filter(agent => agent.organization === props.organization.slug);

      // Get all zents
      const allZents = zentStore.zents.value;

      // Map agents with their zents
      organizationAgents.value = agents.map(agent => {
        const agentZents = allZents.filter(zent => zent.agent === agent.slug);

        return {
          ...agent,
          expanded: true, // Default to expanded
          zents: agentZents
        };
      });
    }

  } catch (error) {
    console.error('Error loading organization agents:', error);
  }
}

// Process MCPs from all agents' zents' tool_calls
const processedMcps = computed(() => {
  const mcps = [];
  console.log("organizationAgents");
  console.log(organizationAgents);
  organizationAgents.value.forEach(agent => {
    agent.zents.forEach(zent => {
      if (zent.tool_calls) {
        let toolCalls;

        if (typeof zent.tool_calls === 'string') {
          try {
            toolCalls = JSON.parse(zent.tool_calls);
          } catch (e) {
            console.error('Error parsing tool_calls:', e);
            return;
          }
        } else {
          toolCalls = zent.tool_calls;
        }

        // Extract server information from tool_calls
        if (toolCalls) {
          toolCalls.forEach(mcp => {
            if (mcp.server_name) {
              mcps.push(mcp);
            }
          });
        }
      }
    });
  });

  return mcps;
});

// Get unique MCPs based on server_name
const uniqueMcps = computed(() => {
  const uniqueMap = new Map();

  processedMcps.value.forEach(mcp => {
    if (!uniqueMap.has(mcp.server_name)) {
      uniqueMap.set(mcp.server_name, mcp);
    }
  });

  return Array.from(uniqueMap.values());
});

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  } catch (e) {
    return dateString;
  }
};

// Get status variant for badges
const getStatusVariant = (status) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'error':
      return 'destructive';
    case 'running':
      return 'secondary';
    default:
      return 'outline';
  }
};

// Get team member count
const getTeamMemberCount = (team) => {
  // This would be replaced with actual logic to count team members
  return 0;
};

// Get team agent count
const getTeamAgentCount = (team) => {
  return agentStore.agents.value.filter(agent => agent.team === team.slug).length;
};

// Save organization settings
const saveOrganizationSettings = async () => {
  try {
    // Don't allow changing from Team Mode to Service/Agency Mode if already set to Team Mode
    if (props.organization.mode === 'team' &&
        (organizationMode.value === 'service' || organizationMode.value === 'agency')) {
      toast({
        title: t('mode-change-warning'),
        description: t('dialog.organization.add.modeWarning'),
        variant: 'warning'
      });
      // Reset to the original mode
      organizationMode.value = props.organization.mode;
      return;
    }

    // Don't allow changing from Service/Agency Mode to any other mode
    if ((props.organization.mode === 'service' || props.organization.mode === 'agency') &&
        organizationMode.value !== props.organization.mode) {
      toast({
        title: t('mode-change-error'),
        description: t('you-cannot-change-the-organization-mode-once-it-has-been-set-to-service-mode-or-agency-mode'),
        variant: 'destructive'
      });
      // Reset to the original mode
      organizationMode.value = props.organization.mode;
      return;
    }

    // Create a deep copy of the data before making the API request
    const modeData = structuredClone(JSON.parse(JSON.stringify({
      slug: props.organization.slug,
      mode: organizationMode.value,
      seatPrice: seatPrice.value
    })));
    await apiRequest(`/zentrun-organization/`, 'PUT', modeData);

    toast({
      title: t('settings-saved'),
      description: t('organization-settings-have-been-updated'),
    });
  } catch (error) {
    toast({
      title: t('error-saving-settings'),
      description: error.message || t('an-error-occurred-while-saving-settings'),
      variant: 'destructive'
    });
  }
};

// Invite a new member
const inviteMember = async () => {
  // Check if there are seats left
  if (!isEnterpriseMode.value && (seatLimit.value - memberCount.value) <= 0) {
    toast({
      title: t('no-seats-left'),
      description: t('please-add-more-seats-before-inviting-new-members'),
      variant: 'destructive'
    });
    return;
  }

  if (!inviteEmail.value) {
    toast({
      title: t('email-required'),
      description: t('please-enter-an-email-address'),
      variant: 'destructive'
    });
    return;
  }

  // Check for required tokens in agency mode
  if (props.organization.mode === 'agency') {
    if (!inviteTokens.value.vapi || !inviteTokens.value.n8n || !inviteTokens.value.make || !inviteTokens.value.openai) {
      toast({
        title: t('tokens-required'),
        description: t('please-provide-all-required-tokens-for-agency-mode'),
        variant: 'destructive'
      });
      return;
    }
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  try {
    // Prepare request data
    let requestData = {
      organization: props.organization.slug,
      email: inviteEmail.value,
      role: inviteRole.value,
      user: user?.id,
      by: user?.username,
    };

    // Add tokens data for agency mode
    if (props.organization.mode === 'agency') {
      requestData.data = {
        vapi_token: inviteTokens.value.vapi,
        n8n_cloud_token: inviteTokens.value.n8n,
        make_token: inviteTokens.value.make,
        openai_token: inviteTokens.value.openai
      };
    }

    // Convert userData to JSON string
    const userDataString = JSON.stringify(requestData);

    // Also add to local database
    let addedMember = await organizationStore.addOrganizationUser({
      user: parseInt(user?.id) || 0,
      organization: props.organization.slug,
      role: inviteRole.value,
      status: 'pending',
      data: userDataString
    });

    console.log("addedMember");
    console.log(addedMember);

    toast({
      title: t('invitation-sent'),
      description: t('an-invitation-has-been-sent-to') + inviteEmail.value,
    });

    await loadMembers();

    // Reset form fields
    inviteEmail.value = '';
    if (props.organization.mode === 'agency') {
      inviteTokens.value = {
        vapi: '',
        n8n: '',
        make: '',
        openai: ''
      };
    }

    // Send invitation to API
    // Create a deep copy of the data before making the API request
    const requestDataCopy = structuredClone(JSON.parse(JSON.stringify(requestData)));
    await apiRequest(`/zentrun-organization/members`, 'POST', requestDataCopy);

  } catch (error) {
    toast({
      title: t('error-sending-invitation'),
      description: error.message || t('an-error-occurred-while-sending-the-invitation'),
      variant: 'destructive'
    });
  }
};

// Update a member's role
const updateMemberRole = async (member) => {
  try {
    // Update role in API
    // Create a deep copy of the data before making the API request
    const updateRoleData = structuredClone(JSON.parse(JSON.stringify({
      organization: props.organization.slug,
      memberId: member.id,
      role: member.role
    })));
    await apiRequest(`/zentrun-organization/members`, 'PUT', updateRoleData);

    // Also update role in local database
    await organizationStore.updateOrganizationUserRole(member.id, member.role);

    toast({
      title: t('role-updated'),
      description: t('member-role-has-been-updated'),
    });
  } catch (error) {
    toast({
      title: t('error-updating-role'),
      description: error.message || t('an-error-occurred-while-updating-the-role'),
      variant: 'destructive'
    });
  }
};

// Remove a member
const removeMember = async (member) => {
  try {
    // Remove member from API
    // Create a deep copy of the data before making the API request
    const removeMemberData = structuredClone(JSON.parse(JSON.stringify({
      organization: props.organization.slug,
      memberId: member.id
    })));
    await apiRequest(`/zentrun-organization/members`, 'DELETE', removeMemberData);

    // Also remove member from local database
    // Option 1: Mark as removed but keep the record
    await organizationStore.markOrganizationUserAsRemoved(member.id);

    // Option 2: Completely delete the record
    // await organizationStore.deleteOrganizationUser(member.id);

    toast({
      title: t('member-removed'),
      description: t('member-has-been-removed-from-the-organization'),
    });

    await loadMembers();
  } catch (error) {
    toast({
      title: t('error-removing-member'),
      description: error.message || t('an-error-occurred-while-removing-the-member'),
      variant: 'destructive'
    });
  }
};

// Handle adding seats
const handleSeatAdded = async (addedSeats) => {
  try {
    // Update the local seat limit
    seatLimit.value += addedSeats;

    toast({
      title: t('seats-added'),
      description: addedSeats + t('seats-have-been-added-to-your-organization'),
    });

    // Close the pricing plan dialog
    showSeatPricingPlan.value = false;
  } catch (error) {
    toast({
      title: t('error-adding-seats'),
      description: error.message || t('an-error-occurred-while-adding-seats'),
      variant: 'destructive'
    });
  }
};

// Load members data
const loadMembers = async () => {
  try {
    // Load members from the local database
    const orgMembers = await organizationStore.loadOrganizationUsersByOrganization(props.organization.slug);

    // Transform the data to match the expected format
    members.value = orgMembers.map(member => {
      // Parse data field if it exists
      let memberData = {};
      if (member.data) {
        try {
          memberData = JSON.parse(member.data);
        } catch (e) {
          console.error('Failed to parse member data:', e);
        }
      }

      return {
        id: member.id,
        user_id: member.user, // Keep user_id in the UI for backward compatibility
        email: memberData.email || `user-${member.user}@example.com`, // Fallback if email not in data
        role: member.role,
        status: member.status,
        invited_at: member.invited_at,
        joined_at: member.joined_at,
        data: memberData
      };
    });

    // Update member count
    memberCount.value = members.value.length;
  } catch (error) {
    console.error('Error loading members:', error);
    toast({
      title: t('error-loading-members'),
      description: error.message || t('an-error-occurred-while-loading-members'),
      variant: 'destructive'
    });
  }
};

// Load activity logs
const loadActivityLogs = async () => {
  try {
    // Load activities from the activity store
    await activityStore.loadActivities();
    // Filter activities for this organization
    activityLogs.value = activityStore.getActivitiesByOrganization(props.organization.slug);
  } catch (error) {
    console.error('Error loading activity logs:', error);
  }
};

// Load run history
const loadRunHistory = async () => {
  try {
    await runHistoryStore.loadRunHistories();
    runHistories.value = await runHistoryStore.getRunHistoriesByOrganization(props.organization.slug);
  } catch (error) {
    console.error('Error loading run history:', error);
  }
};

// Get available agents for this organization
const availableAgents = computed(() => {

  if (props.isMarketplaceMode) {
    return props.organization?.data?.agents
  } else {
    return agentStore.agents.value.filter(agent =>
      agent.organization === props.organization.slug
    );
  }

});

// Handle click on the execute zpilot button
const handleExecuteZpilot = async () => {
  try {
    const agents = availableAgents.value;

    if (agents.length === 0) {
      toast({
        title: t('execution-error'),
        description: t('no-agents-available-in-this-organization'),
        variant: 'destructive'
      });
      return;
    }

    // Create a new thread with the organization name
    const threadId = await chatStore.createThread(`Zpilot: ${props.organization.name}`, chatStore.chatConfig);

    // Set the active thread
    await chatStore.setActiveThread(threadId);

    // Set the zpilot with the available agents
    chatStore.setZpilot({
      id: props.organization.id,
      name: props.organization.name,
      agents: agents,
      threadId: threadId
    });

    toast({
      title: t('zpilot-execution-started'),
      description: t('enter-your-message-to-start-the-zpilot-execution'),
      variant: 'default'
    });

    // Close the dialog
    emit('update:open', false);

    // Navigate to the thread
    router.push({ name: 'chat' });
  } catch (error) {
    console.error('Failed to execute zpilot:', error);
    toast({
      title: t('execution-error'),
      description: error.message || t('an-unknown-error-occurred'),
      variant: 'destructive'
    });
  }
};

// Check if all required MCPs are installed
const checkRequiredMcpsInstalled = () => {
  const uninstalledMcps = uniqueMcps.value.filter(mcp => !isInstalledMcp(mcp.server_name));
  return {
    allInstalled: uninstalledMcps.length === 0,
    uninstalledMcps: uninstalledMcps
  };
}

// Open payment URL for marketplace mode
const openPaymentUrl = () => {
    if (!props.organization)
      return
  if (props.organization.data?.payment_url) {
    window.open(props.organization.data.payment_url + "?reference_id=" + props.organization.slug, '_blank');


  } else {
    toast({
      title: t('payment-url-not-available'),
      description: t('the-payment-url-for-this-organization-is-not-available'),
      variant: 'destructive'
    });
  }
};

// Deploy to marketplace function
const deployToMarketplace = async () => {
  try {
    if (!props.organization)
      return
    isLoading.deploy.value = true;

    // Validate required fields
    const missingFields = [];

    // Required fields for marketplace deployment
    if (!name.value) missingFields.push('name');
    // if (!bio.value) missingFields.push('bio');
    if (!description.value) missingFields.push('description');

    if (missingFields.length > 0) {
      toast({
        title: t('please-fill-in-all-required-fields'),
        description: t('the-following-fields-are-required')+ `${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      isLoading.deploy.value = false;
      return;
    }

    // Get all agents belonging to this organization
    const agents = agentStore.agents.value.filter(agent => agent.organization === props.organization.slug);

    // For each agent, get all zents
    const agentsWithZents = await Promise.all(agents.map(async (agent) => {
      const zents = zentStore.zents.value.filter(zent => zent.agent === agent.slug);
      return {
        ...agent,
        zents: zents
      };
    }));
    let organizationToDepoly = {...props.organization}
    if (!organizationToDepoly['data']) {
      organizationToDepoly['data'] = {}
    }
    organizationToDepoly['permission'] = "public";
    organizationToDepoly['data']['agents'] = agentsWithZents;

    // Send API request to deploy organization to marketplace with all agents and their zents
    // Create a deep copy of the data before making the API request
    const deployData = structuredClone(JSON.parse(JSON.stringify(organizationToDepoly)));
    await apiRequest(`/zentrun-organization/deploy/`, 'POST', deployData);

    // Update permission to public
    permission.value = 'public';
    await organizationStore.updateOrganization(props.organization.id, { is_public: 1 });

    toast({
      title: t('organization-deployed-to-marketplace'),
      description: t('your-organization-has-been-successfully-deployed-to-the-marketplace'),
    });
    isLoading.deploy.value = false;

    // Call handleOrganizationUpdate to ensure all changes are properly saved
    handleOrganizationUpdate({
      id: props.organization?.id,
      name: name.value,
      description: description.value,
      bio: bio.value,
      thumbnail: thumbnail.value,
      cover_image_url: cover_image_url.value,
      mode: organizationMode.value,
      permission: permission.value,
      seatPrice: seatPrice.value
    });
  } catch (error) {
    toast({
      title: t('error-deploying-to-marketplace'),
      description: error.message || t('an-error-occurred-while-deploying-to-marketplace'),
      variant: 'destructive'
    });
    isLoading.deploy.value = false;
  }
};

// Clone organization function for marketplace mode
const cloneOrganization = async () => {
  // Check if all required MCPs are installed
  const mcpCheck = checkRequiredMcpsInstalled();
  if (!mcpCheck.allInstalled) {
    const mcpNames = mcpCheck.uninstalledMcps.map(mcp => mcp.server_name).join(', ');
    toast({
      title: t('mcp-installation-required'),
      description: t('please-install-the-following-mcp-tools-first') + mcpNames,
      variant: 'destructive'
    });
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const newSlug = props.organization.slug + "-" + nanoid();

    // Create a new organization with the same data but a new name
    const newOrganization = {
      ...props.organization,
      slug: newSlug,
      is_public: 0,
      user: user?.id,
      data: {
        ...(props.organization.data || {}),
        cloned_from: props.organization.slug
      }
    }
    delete newOrganization['id'];
    if (newOrganization.children) {
      delete newOrganization['children'];
    }

    // Prepare agents and their zents for the new organization
    const newAgents = [];
    if (props.organization.data?.agents) {
      for (const agent of props.organization.data?.agents || []) {
        const newAgentSlug = agent.slug + "-" + nanoid();

        // Prepare zents for this agent
        const newZents = [];
        if (agent.zents) {
          for (const zent of agent.zents || []) {
          const newZent = {
            ...zent,
            id: nanoid(),
            slug: `${zent.slug}-copy-${nanoid()}`,
            name: `${zent.name}`,
            agent: newAgentSlug,
            organization: newSlug,
            user: user?.id,
            by: user?.username,
            data: {
              ...(zent.data || {}),
              cloned_from: zent.slug
            }
          };
          newZents.push(newZent);
        }
        }


        // Create new agent with its zents
        const newAgent = {
          ...agent,
          id: nanoid(),
          slug: newAgentSlug,
          organization: newSlug,
          user: user?.id,
          by: user?.username,
          is_public: 0,
          data: {
            ...(agent.data || {}),
            cloned_from: agent.slug,
            zents: newZents
          }
        };

        newAgents.push(newAgent);
      }
    }


    // Add agents to the organization data
    newOrganization.data.agents = newAgents;

    console.log("newOrganization.data");
    console.log(newOrganization.data);

    // Create the organization in the API with a single request
    try {

      // Add all agents and their zents to the local store
      for (const agent of newAgents) {
        await agentStore.addAgent(agent);

        for (const zent of agent.data?.zents) {
          await zentStore.addZent(zent);
        }
      }
      // Add the organization to the local store
      await organizationStore.addOrganization(newOrganization);

      toast({ title: t('organization-and-all-its-agents-and-zents-cloned-successfully') });
      emit('update:open', false);

      // Create a deep copy of the data before making the API request
      const newOrganizationCopy = structuredClone(JSON.parse(JSON.stringify(newOrganization)));
      const clonedOrganization = await apiRequest('/zentrun-organization/clone/', 'POST', newOrganizationCopy);

    } catch (error) {
      toast({
        title: t('error-cloning-organization'),
        description: error.message || t('api-error'),
        variant: 'destructive'
      });
    }
  } catch (error) {
    toast({
      title: error.message || t('failed-to-clone-organization'),
      variant: 'destructive'
    });
  }
}

// Watch for changes in the organization prop to update the form data
watch(() => props.organization, (newOrg) => {
  console.log("newOrg");
  console.log(newOrg);
  if (newOrg) {
    name.value = newOrg.name || '';
    bio.value = newOrg.bio || '';
    description.value = newOrg.description || '';
    thumbnail.value = newOrg.thumbnail || '';
    cover_image_url.value = newOrg.cover_image_url || '';
    permission.value = newOrg.is_public ? 'public' : 'private';
    organizationMode.value = newOrg.mode || 'team';
    seatPrice.value = newOrg.seatPrice || 0;
    seatLimit.value = newOrg.seat_pool_limit || 0;

    // Load organization agents
    loadOrganizationAgents();

    // Load organization members
    loadMembers();
  }
}, { immediate: true });
</script>
