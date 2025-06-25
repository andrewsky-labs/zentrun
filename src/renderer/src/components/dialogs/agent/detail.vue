<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-full h-[90vh]">
      <DialogHeader>
        <div class="flex items-center">
          <button class="text-gray-600 hover:text-gray-800 flex items-center" @click="$emit('update:open', false)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {{ t('back') }}
          </button>
          <h2 class="text-xl font-medium ml-4">{{ t('dialog.agent.edit.title') }}</h2>
        </div>
      </DialogHeader>

      <!-- Modal content -->
      <div class="overflow-y-auto">

        <!-- Cover Image Section -->
        <div v-if="!props.isViewMode || (props.isViewMode && cover_image_url)" class="relative w-full h-48 bg-gray-100 mb-6">
          <img v-if="cover_image_url" :src="cover_image_url" :alt="t('cover-image')" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
            <span>{{ t('no-cover-image') }}</span>
          </div>
          <button
            v-if="!props.isViewMode"
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
              <h3 class="text-lg font-medium">{{ t('edit-cover-image-0') }}</h3>
              <button @click="showCoverImageUploader = false" class="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CoverImageUploader v-model="cover_image_url" :label="t('dialog.agent.edit.coverImage', 'Cover Image')" />
            <div class="flex justify-end mt-4">
              <Button @click="showCoverImageUploader = false" variant="default">{{ t('done') }}</Button>
            </div>
          </div>
        </div>
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 ">

          <!-- Left column -->
          <div class="space-y-6">
            <!-- Agent Profile -->
            <div class="pb-4 border-b">
              <div v-if="props.isViewMode" class="flex items-start">
                <div class="relative w-16 h-16 mr-4">
                  <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    <img v-if="thumbnail" :src="getImageUrl(thumbnail)" :alt="t('agent-thumbnail')" class="w-full h-full object-cover" />
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                    </svg>
                  </div>
<!--                  <button-->
<!--                    v-if="!props.isViewMode"-->
<!--                    @click="editingProfile = true"-->
<!--                    class="absolute bottom-0 right-0 bg-white rounded-full p-0.5 border border-gray-200 hover:bg-gray-100"-->
<!--                  >-->
<!--                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">-->
<!--                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />-->
<!--                    </svg>-->
<!--                  </button>-->
                </div>
                <div>
                  <div class="flex items-center">
                    <h3 class="text-lg font-medium">{{ name || 'Agent Name' }}</h3>
<!--                    <button-->
<!--                      v-if="!props.isViewMode"-->
<!--                      @click="editingProfile = true"-->
<!--                      class="ml-2 text-gray-400 hover:text-gray-600"-->
<!--                    >-->
<!--                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">-->
<!--                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />-->
<!--                      </svg>-->
<!--                    </button>-->
                  </div>
                  <p class="text-sm text-gray-600 mt-1">
                    {{ bio }}
                  </p>
                </div>
              </div>

              <!-- Profile Edit Form -->
              <div v-else class="space-y-4">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-medium">{{ t('edit-profile') }}</h3>
<!--                  <button-->
<!--                    @click="editingProfile = false"-->
<!--                    class="text-gray-500 hover:text-gray-700"-->
<!--                  >-->
<!--                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">-->
<!--                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />-->
<!--                    </svg>-->
<!--                  </button>-->
                </div>

                <div class="flex items-center space-x-4">
                  <ThumbnailSelector v-model="thumbnail" label="" isAgent="true" />
                  <div class="flex-1 space-y-2">
                    <Label class="flex flex-col gap-1">
                      <span class="text-xs font-medium">{{ t('name') }} <span class="text-red-500">*</span></span>
                      <Input v-model="name" type="text" class="input input-bordered" :placeholder="t('agent-name')" />
                    </Label>
                    <Label class="flex flex-col gap-1">
                      <span class="text-xs font-medium">{{ t('bio') }} <span v-if="!isPublic" class="text-black">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
                      <Textarea v-model="bio" rows="2" class="w-full border rounded p-2 text-sm" :placeholder="t('agent-description')" />
                    </Label>
                  </div>
                </div>

<!--                <div class="flex justify-end">-->
<!--                  <Button-->
<!--                    @click="editingProfile = false"-->
<!--                    variant="default"-->
<!--                    size="sm"-->
<!--                  >-->
<!--                    {{ t('done-0') }}-->
<!--                  </Button>-->
<!--                </div>-->
              </div>
            </div>


            <!-- Edit Form Section -->
            <div class="mt-6 pt-4">
              <div class="space-y-4">

                <div>
                  <span class="font-semibold">{{ t('dialog.agent.edit.zentList') }}</span>
                  <p class="text-xs text-gray-600 mt-2 mb-5">
                    {{ t('dialog.agent.edit.zentDefinition') }}
                  </p>
                  <div v-if="!props.isViewMode" class="flex gap-2 items-center mt-2 relative">
                    <Input v-model="searchZent" :placeholder="t('dialog.agent.edit.searchZent')" class="input input-bordered text-xs flex-1"
                      @focus="showZentDropdown = true"
                      @input="showZentDropdown = true"
                      @blur="onZentInputBlur"
                    />
                    <ul v-if="showZentDropdown && filteredZents.length > 0" class="absolute z-10 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-y-auto">
                      <li v-for="zent in filteredZents" :key="zent.id" class="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        @mousedown.prevent="addZent(zent)">
                        <span class="font-semibold text-xs">{{ zent.name }}</span>
                        <span class="text-xs text-gray-400 ml-2">{{ zent.categories ? (Array.isArray(zent.categories) ? zent.categories.join(', ') : JSON.parse(zent.categories).join(', ')) : '' }}</span>
                        <span class="text-xs text-gray-400 ml-2">{{ zent.tags ? (Array.isArray(zent.tags) ? zent.tags.join(', ') : JSON.parse(zent.tags).join(', ')) : '' }}</span>
                      </li>
                    </ul>
                    <ul v-if="showZentDropdown && filteredZents.length === 0 && searchZent" class="absolute z-10 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-y-auto">
                      <li class="text-xs text-gray-400 px-2 py-1">{{ t('dialog.agent.edit.noSearchResults') }}</li>
                    </ul>
                  </div>
                  <div class="flex flex-wrap gap-2 mt-2">
                    <div v-for="zent in selectedZents" :key="zent.id" class="flex items-center
                    border-gray-300 border-[1px]  rounded px-3 py-5 w-full mb-1 justify-between">
                      <div class="flex ml-2 flex-col w-full">
                        <div class="flex justify-between">
                          <span class="text-sm">{{ zent.name }}</span>
                          <button v-if="!props.isViewMode" class="ml-1 text-red-400 hover:text-red-600" @click="removeZent(zent)">✕</button>
                        </div>
                        <div class="flex mt-2 space-x-1">
                          <template v-if="zent.tool_calls">
                            <template v-if="typeof zent.tool_calls === 'string'">
                              <div v-for="tool_call in JSON.parse(zent.tool_calls)" :key="tool_call.server_name"
                                class="text-gray-600 text-4xl p-1 border-[1px] border-gray-300" style="border-radius:5px">
                                {{ tool_call.server_icons }}
                              </div>
                            </template>
                            <template v-else>
                              <div v-for="tool_call in zent.tool_calls" :key="tool_call.server_name"
                                class="text-gray-600 text-4xl p-1 border-[1px] border-gray-300" style="border-radius:5px">
                                {{ tool_call.server_icons }}
                              </div>
                            </template>
                          </template>
                        </div>
                      </div>
                    </div>
                    <div v-if="selectedZents.length === 0" class="text-gray-400 text-xs p-2 border rounded w-full bg-gray-50">
                      {{ t('dialog.agent.edit.noZents') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <!-- Connected Triggers -->
            <div>
              <h3 class="text-sm font-medium mb-4">{{ t('connected-mcps') }}</h3>
              <p class="text-xs text-gray-600 mb-4">
                {{ t('allow-mcps-to-trigger-zents-for-your-agent-for-example-connect-gmail-to-trigger-your-agent-via-mcp') }}
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
                  {{ t('no-mcps-found-in-selected-zents') }}
                </div>
              </div>
            </div>

            <!-- Creator Info -->
            <div v-if="agent?.data?.userInfo" class="pb-6 border-b">
              <h3 class="text-sm font-medium mb-4">{{ t('creator-info') }}</h3>
              <div class="border rounded-md p-4 ">
                <div class="flex items-center mb-2">
                  <div class="w-10 h-10 rounded-full overflow-hidden mr-3">
                    <img
                      v-if="agent?.data?.userInfo?.imageUrl"
                      :src="agent.data.userInfo.imageUrl"
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
                    <p class="font-medium text-sm">{{ agent.data.userInfo.username || 'Unknown creator' }}</p>
                  </div>
                </div>

                <!-- Bio -->
                <p v-if="agent?.data?.userInfo?.bio" class="text-xs text-gray-600 mb-5 mt-5">
                  {{ agent.data.userInfo.bio }}
                </p>

                <!-- Social Links -->
                <div class="flex flex-wrap gap-2">
                  <!-- Website URL -->
                  <a
                    v-if="agent?.data?.userInfo?.url"
                    :href="agent.data.userInfo.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <span class="mr-1">🌐</span> {{ t('website') }}
                  </a>

                  <!-- Twitter URL -->
                  <a
                    v-if="agent?.data?.userInfo?.urlTwitter"
                    :href="agent.data.userInfo.urlTwitter"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <span class="mr-1">🐦</span> {{ t('twitter') }}
                  </a>

                  <!-- LinkedIn URL -->
                  <a
                    v-if="agent?.data?.userInfo?.urlLinkedin"
                    :href="agent.data.userInfo.urlLinkedin"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <span class="mr-1">💼</span> LinkedIn
                  </a>

                  <!-- YouTube URL -->
                  <a
                    v-if="agent?.data?.userInfo?.urlYoutube"
                    :href="agent.data.userInfo.urlYoutube"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    <span class="mr-1">📺</span> YouTube
                  </a>

                  <!-- Instagram URL -->
                  <a
                    v-if="agent?.data?.userInfo?.urlInstagram"
                    :href="agent.data.userInfo.urlInstagram"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100"
                  >
                    <span class="mr-1">📷</span> {{ t('instagram') }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Categories, Tags, Permission -->
            <div class="pb-6 border-b">
              <div class="grid grid-cols-1 gap-4">
                <Label class="flex flex-col gap-1">
                  <span class="font-semibold">{{ t('dialog.agent.edit.categories') }} <span v-if="!isPublic" class="text-black">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
                  <div v-if="!props.isViewMode" class="relative category-dropdown-container">
                    <div
                      class="flex flex-wrap gap-2 p-2 border rounded min-h-[38px] cursor-text"
                      @click="showCategoryDropdown = true"
                    >
                      <div v-for="cat in selectedCategories" :key="cat" class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
                        <span>{{ cat }}</span>
                        <button class="ml-1 text-red-400 hover:text-red-600" @click.stop="removeCategory(cat)">✕</button>
                      </div>
                      <span v-if="selectedCategories.length === 0" class="text-gray-400 text-xs">{{ t('dialog.agent.edit.selectCategories') }}</span>
                    </div>
                    <div v-if="showCategoryDropdown" class="absolute z-10 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-y-auto">
                      <div
                        v-for="cat in predefinedCategories"
                        :key="cat"
                        class="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        @click.stop="toggleCategory(cat)"
                      >
                        <input
                          type="checkbox"
                          :id="cat"
                          :value="cat"
                          :checked="selectedCategories.includes(cat)"
                          @change.stop="toggleCategory(cat)"
                          class="mr-2"
                        />
                        <label class="flex-1 cursor-pointer" @click.stop="toggleCategory(cat)">{{ cat }}</label>
                      </div>
                    </div>
                  </div>
                  <div v-else class="flex flex-wrap gap-2 p-2 border rounded min-h-[38px] bg-gray-50">
                    <div v-for="cat in selectedCategories" :key="cat" class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
                      <span>{{ cat }}</span>
                    </div>
                    <span v-if="selectedCategories.length === 0" class="text-gray-400 text-xs">{{ t('dialog.agent.edit.noCategories') }}</span>
                  </div>
                </Label>

                <Label class="flex flex-col gap-1">
                  <span class="font-semibold">{{ t('dialog.agent.edit.tags') }} <span v-if="!isPublic" class="text-black">{{ t('Optional') }}</span><span v-else class="text-red-500">*</span></span>
                  <div v-if="!props.isViewMode" class="flex flex-wrap gap-2 p-2 border rounded">
                    <div v-for="tag in tagList" :key="tag" class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
                      <span>{{ tag }}</span>
                      <button class="ml-1 text-red-400 hover:text-red-600" @click="removeTag(tag)">✕</button>
                    </div>
                    <input
                      v-model="tagInput"
                      type="text"
                      class="flex-1 outline-none text-sm min-w-[100px]"
                      :placeholder="t('dialog.agent.edit.tagInputPlaceholder')"
                      @keydown="handleTagInputKeydown"
                    />
                  </div>
                  <div v-else class="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
                    <div v-for="tag in tagList" :key="tag" class="flex items-center bg-gray-100 rounded px-2 py-1 text-xs">
                      <span>{{ tag }}</span>
                    </div>
                    <span v-if="tagList.length === 0" class="text-gray-400 text-xs">{{ t('dialog.agent.edit.noTags') }}</span>
                  </div>
                </Label>

                <Label class="flex flex-col gap-1">
                  <span class="font-semibold">{{ t('dialog.organization.add.permission') }}</span>
                  <select v-if="!props.isViewMode && permission === 'public'" v-model="permission" class="w-full border rounded p-2 mt-1">
                    <option value="public">{{ t('dialog.organization.add.permissionPublic') }}</option>
                    <option value="private">{{ t('dialog.organization.add.permissionPrivate') }}</option>
                  </select>
                  <div v-else class="w-full border rounded p-2 mt-1 bg-gray-50">
                    {{ permission === 'public' ? t('dialog.organization.add.permissionPublic') : t('dialog.organization.add.permissionPrivate') }}
                  </div>
                  <p class="text-xs text-muted-foreground mt-1 mb-2">
                    {{ permission === 'public' ? t('dialog.organization.add.permissionPublicDesc') : t('dialog.organization.add.permissionPrivateDesc') }}
                  </p>
                </Label>
                  <Button
                    v-if="permission === 'private' && !props.isViewMode && !isEnterpriseMode && isBuildMode"
                    v-bind:disabled="isLoading.deploy.value"
                    variant="outline"
                    @click="deployToMarketplace"
                  >
                    <div v-if="isLoading.deploy.value" class="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2
                    border-black"></div>
                    <Icon v-else icon="lucide:upload-cloud" class="h-4 w-4 mr-2" />
                    {{ t('deploy-to-marketplace') }}
                  </Button>

<!--                  <p v-if="!props.isViewMode && permission === 'private'" class="text-xs text-muted-foreground mt-1">-->
<!--                    {{ !user.bio && t('common.introduceProfileSettings') }}-->
<!--                  </p>-->
              </div>
            </div>



            <!-- RAG 관리 섹션 -->
            <div class="mt-6 border-t pt-4">
                  <span class="font-semibold">{{ t('dialog.agent.edit.ragReferenceData') }}</span>
                  <div class="flex flex-col gap-2 overflow-y-auto max-h-[30vh]">
                    <!-- View Mode -->
                    <div v-if="props.isViewMode">
                      <div v-for="entry in ragEntries" :key="entry.id" class="border rounded p-2 mb-2">
                        <div class="font-semibold text-sm mb-1">{{ entry.title || t('dialog.agent.edit.untitledReference') }}</div>
                        <div class="text-xs text-gray-700">{{ entry.content }}</div>
                      </div>
                      <div v-if="ragEntries.length === 0" class="text-gray-400 text-xs p-2 border rounded w-full bg-gray-50">
                        {{ t('dialog.agent.edit.noReferences') }}
                      </div>
                    </div>

                    <!-- Edit Mode -->
                    <div v-else>
                      <div v-for="(entry, index) in ragEntries" :key="entry.id" class="border rounded p-2">
                        <div class="flex justify-between items-center mb-1">
                          <input
                            v-model="entry.title"
                            class="font-semibold text-sm outline-none flex-1"
                            :placeholder="t('dialog.agent.edit.enterTitle')"
                          />
                          <div class="flex gap-1">
                            <button
                              class="text-blue-500 hover:text-blue-700 text-xs px-2 py-1"
                              @click="editRagEntry(index)"
                            >
                              {{ t('dialog.agent.edit.edit') }}
                            </button>
                            <button
                              class="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                              @click="removeRagEntry(index)"
                            >
                              {{ t('dialog.agent.edit.remove') }}
                            </button>
                          </div>
                        </div>
                        <div v-if="editingRagIndex === index" class="mt-1">
                          <Textarea
                            v-model="entry.content"
                            rows="4"
                            class="w-full border rounded p-2 text-xs"
                            :placeholder="t('dialog.agent.edit.enterReferenceContent')"
                          />
                        </div>
                        <div v-else class="text-xs text-gray-700 line-clamp-2">
                          {{ entry.content }}
                        </div>
                      </div>

                      <div v-if="showRagForm" class="border rounded p-2">
                        <div class="flex justify-between items-center mb-1">
                          <input
                            v-model="newRagTitle"
                            class="font-semibold text-sm outline-none flex-1"
                            :placeholder="t('dialog.agent.edit.newReferenceTitle')"
                          />
                        </div>
                        <Textarea
                          v-model="newRagContent"
                          rows="4"
                          class="w-full border rounded p-2 text-xs mt-1"
                          :placeholder="t('dialog.agent.edit.newReferenceContent')"
                        />
                        <div class="flex justify-end gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            @click="cancelAddRag"
                          >
                            {{ t('dialog.cancel') }}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            @click="addRagEntry"
                            :disabled="!newRagContent.trim()"
                          >
                            {{ t('dialog.agent.edit.add') }}
                          </Button>
                        </div>
                      </div>

                      <Button
                        v-if="!showRagForm"
                        variant="outline"
                        class="mt-1"
                        @click="showRagForm = true"
                      >
                        {{ t('dialog.agent.edit.addReference') }}
                      </Button>
                    </div>
                  </div>
                </div>

          </div>

          <!-- Right column -->
          <div class="space-y-6">
          <!-- Instructions -->
          <div class="pb-6">
            <h3 class="text-lg font-medium mb-2">{{ t('how-your-ai-worker-should-work') }}</h3>


            <div class="mb-4">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-medium">{{ t('description') }}</h4>
<!--                <button-->
<!--                  v-if="!props.isViewMode"-->
<!--                  @click="editingDescription = !editingDescription"-->
<!--                  class="text-gray-400 hover:text-gray-600"-->
<!--                >-->
<!--                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">-->
<!--                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />-->
<!--                  </svg>-->
<!--                </button>-->
              </div>
<!--              <p class="text-xs text-gray-600 mt-2 mb-5">-->
<!--                {{ t('provide-a-brief-description-of-this-agent') }}-->
<!--              </p>-->

              <div v-if="props.isViewMode" class="p-3 border rounded-md bg-gray-50">
                <p class="text-sm text-gray-700 whitespace-pre-wrap">
                  {{ description }}
                </p>
              </div>

              <div v-else class="border rounded-md p-3">
                <Textarea
                  v-model="description"
                  rows="4"
                  class="w-full border rounded p-2 text-sm"
                />
                <div class="flex justify-end mt-2">
<!--                  <Button-->
<!--                    @click="editingDescription = false"-->
<!--                    variant="default"-->
<!--                    size="sm"-->
<!--                  >-->
<!--                    {{ t('done') }}-->
<!--                  </Button>-->
                </div>
              </div>
            </div>

            <div class="mb-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium">{{ t('instructions') }} <span class="text-red-500">*</span></h4>
<!--                <button-->
<!--                  v-if="!props.isViewMode"-->
<!--                  @click="editingPrompt = !editingPrompt"-->
<!--                  class="text-gray-400 hover:text-gray-600"-->
<!--                >-->
<!--                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">-->
<!--                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />-->
<!--                  </svg>-->
<!--                </button>-->
              </div>
              <p class="text-xs text-gray-600 mt-2 mb-5">
                {{ t('describe-the-role-and-responsibilities-of-this-agent-you-can-include-examples-of-how-it-should-respond-to-different-types-of-tasks') }}
              </p>

              <div v-if="props.isViewMode" class="p-3 border rounded-md bg-gray-50">
                <p class="text-sm text-gray-700 whitespace-pre-wrap">
                  {{ prompt || '' }}
                </p>
              </div>

              <div v-else class="border rounded-md p-3">
                <Textarea
                  v-model="prompt"
                  rows="6"
                  class="w-full border rounded p-2 text-sm"
                  :placeholder="t('enter-agent-instructions')"
                />
                <div class="flex justify-end mt-2">
<!--                  <Button-->
<!--                    @click="editingPrompt = false"-->
<!--                    variant="default"-->
<!--                    size="sm"-->
<!--                  >-->
<!--                    {{ t('done') }}-->
<!--                  </Button>-->
                </div>
              </div>
            </div>


          </div>
        </div>

        </div>
      </div>

      <!-- Save Button or Run Agent Button at bottom right -->
      <div class="flex justify-end p-4 border-t">
        <Button
          variant="outline"
          class="mr-2"
          @click="$emit('update:open', false)"
        >
          {{ t('common.close') }}
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
          v-if="!props.isViewMode && !isMarketplaceMode"
          variant="default"
          v-bind:disabled="isLoading.save.value"
          class="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-md text-sm"
          @click="handleAgentUpdate({...props.agent,
            id: props.agent?.id,
            name,
            prompt,
            description,
            categories: selectedCategories,
            tags: tagList,
            selectedZents,
            ragEntries,
            permission,
            thumbnail,
            bio,
            cover_image_url
          });"
        >
          <div v-if="isLoading.save.value" class="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></div>
          {{ t('dialog.agent.edit.save') }}
        </Button>
        <Button
          v-else-if="isMarketplaceMode"
          v-bind:disabled="isLoading.clone.value"
          variant="default"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-md text-sm"
          @click="cloneAgent"
        >
          <div v-if="isLoading.clone.value" class="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></div>
          <Icon v-else icon="lucide:copy" class="h-4 w-4 mr-2" />

          {{ t('clone') }} </Button>
        <Button
          v-else
          variant="default"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-md text-sm"
          @click="handleExecuteAgent"
        >
          <Icon icon="lucide:play" class="h-4 w-4 mr-2" />
          {{ t('run-agent') }}
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

        <!-- MCP Installation Modal -->
        <McpInstallDialog
          v-if="installMcpModalOpen"
          :open="installMcpModalOpen"
          :server-name="currentMcpToInstall"
          @update:open="installMcpModalOpen = $event"
          @install="handleInstallMcp"
        />

        <!-- MCP Installation Modal -->
        <McpInstallDialog
          v-if="installMcpModalOpen"
          :open="installMcpModalOpen"
          :server-name="currentMcpToInstall"
          @update:open="installMcpModalOpen = $event"
          @install="handleInstallMcp"
        />
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted} from 'vue'
import { nanoid } from 'nanoid'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { zentStore } from "@/stores/zent"
import { useMcpStore } from "@/stores/mcp"
import { useChatStore } from '@/stores/chat'
import { runHistoryStore } from '@/stores/runHistory'
import { agentStore } from '@/stores/agent'
import ThumbnailSelector from '@/components/ThumbnailSelector.vue'
import CoverImageUploader from '@/components/CoverImageUploader.vue'
import McpInstallDialog from '@/components/dialogs/mcp/install.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { Icon } from '@iconify/vue'
import router from '@/router'
import { useI18n } from 'vue-i18n'
import { apiRequest } from '@/api'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  agent: {
    type: Object,
    default: null
  },
  zents: {
    type: Array,
    default: () => []
  },
  agentZents: {
    type: Array,
    default: () => []
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


// Check if enterprise mode is enabled
const isEnterpriseMode = computed(() => {
  return import.meta.env.VITE_ZENTRUN_ENTERPRISE_MODE === 'true'
})
const isBuildMode = computed(() => {
  return import.meta.env.VITE_IS_FOR_BUILD === 'true'
})

const agentSQLitePresenter = usePresenter('agentSQLitePresenter')
// Connected emails for the demo
const connectedEmails = [
  { email: 'brendek@relevancai.com', isConnected: true },
  { email: 'rosh@relevancai.com', isConnected: true }
];

const emit = defineEmits(['update:open', 'cancel', 'edit'])

const user = JSON.parse(localStorage.getItem('user') || '{}');


const isLoading = {
  save: ref(false),
  clone: ref(false),
  deploy: ref(false),
};

const { t } = useI18n()
const name = ref('')
const prompt = ref('')
const description = ref('')
const searchZent = ref('')
const selectedZents = ref([])
const showZentDropdown = ref(false)
const zentInputBlurTimeout = ref(null)
const permission = ref('private')
const isPublic = computed(() => permission.value === 'public')
const thumbnail = ref('')
const cover_image_url = ref('')
const bio = ref('')
const showCoverImageUploader = ref(false)
const editingProfile = ref(false)
const editingPrompt = ref(false)
const editingDescription = ref(false)

// RAG 관련 데이터
const ragEntries = ref<Array<{id: string, title: string, content: string}>>([])
const showRagForm = ref(false)
const newRagTitle = ref('')
const newRagContent = ref('')
const editingRagIndex = ref(-1)

// Tags implementation
const tagInput = ref('')
const tagList = ref([])

// Category implementation
const predefinedCategories = [
  'Business',
  'Research',
  'Organisation',
  'Fun',
  'Entertainment',
  'News',
  'Marketing',
  'Sales',
  'Education',
  'DevOps',
  'Health',
  'Politics',
  'Science',
  'Technology'
]
const selectedCategories = ref([])
const showCategoryDropdown = ref(false)
const installMcpModalOpen = ref(false)
const currentMcpToInstall = ref('')
const mcpStore = useMcpStore()
const chatStore = useChatStore()
const { toast } = useToast()

function getImageUrl(imageName) {
  return new URL(`../../../assets/images/characters/${imageName}`, import.meta.url).href;
}

import { usePresenter } from '@/composables/usePresenter'
import {organizationStore} from "@/stores/organization";
import {teamStore} from "@/stores/team";

// Get mcpPresenter
const mcpPresenter = usePresenter('mcpPresenter')

// Use reactive reference to store MCP servers data
const installedMcps = ref({})

// Initialize the MCP servers data and load zents on component mount
onMounted(async () => {
  try {
    // Fetch MCP servers from the presenter
    installedMcps.value = await mcpPresenter.getMcpServers()

    // Load zents to ensure they're available for the filteredZents computed property
    await zentStore.loadZents()
  } catch (error) {
    console.error('Failed to initialize component:', error)
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
    installedMcps.value.push(serverName);
    toast({
      title: t('mcp-installed'),
      description: `Successfully installed ` + `${serverName}`,
    });
  } catch (error) {
    console.error('Failed to install MCP:', error);
    toast({
      title: t('installation-failed'),
      description: `Could not install ` + `${serverName}`,
      variant: 'destructive',
    });
  }
}

const handleAgentUpdate = async (agentData) => {
  await addTag();
  console.log('handleAgentUpdate agentData:', agentData);
  console.log('Name:', agentData.name, 'Prompt:', agentData.prompt);

  // 필수 필드 체크
  const missingFields = [];

  // Private 모드일 때 필수 필드: name, prompt, thumbnail
  if (permission.value === 'private') {
    if (!agentData.name) missingFields.push('name');
    if (!agentData.prompt) missingFields.push('prompt');
    if (!agentData.thumbnail) missingFields.push('thumbnail');
  }
  // Public 모드일 때 필수 필드: 모든 입력 필드 (tool_calls, zents 제외)
  else {
    if (!agentData.name) missingFields.push('name');
    if (!agentData.prompt) missingFields.push('prompt');
    if (!agentData.thumbnail) missingFields.push('thumbnail');
    if (agentData.categories.length === 0) missingFields.push('categories');
    if (agentData.tags.length === 0) missingFields.push('tags');
    // if (!agentData.bio) missingFields.push('bio');
  }

  if (missingFields.length > 0) {
    console.log('필수 필드 누락:', missingFields);
    toast({
      title: t('require-field-input'),
      description: `다음 필드가 필요합니다: ` + `${missingFields.join(', ')}`,
      variant: 'destructive'
    });
    return;
  }

  isLoading.save.value = true;

  try {
    // 선택된 zent 목록 확인
    console.log('선택된 Zent:', agentData.selectedZents);

    // Prepare data for API requests
    const disconnectDataList = [];
    const existingZents = zentStore.zents.value.filter(zent => zent.agent === props.agent.slug);
    for (const zent of existingZents) {
      // Store 업데이트
      await zentStore.updateZent(zent.id, { agent: null });
      // Prepare data for API request
      disconnectDataList.push(structuredClone(JSON.parse(JSON.stringify({
        slug: zent?.slug, agent: null
      }))));
    }

    const connectDataList = [];
    if (selectedZents.value) {
      // 새로 선택된 Zent들에 agent 연결 추가
      for (const zent of selectedZents.value) {
        // Store 업데이트
        await zentStore.updateZent(zent.id, { agent: props.agent.slug });
        // Prepare data for API request
        connectDataList.push(structuredClone(JSON.parse(JSON.stringify({
          slug: zent?.slug, agent: props.agent.slug
        }))));
      }
    }

    if (!agentData.data) {
     agentData.data = {}
    }
    if (agentData.ragEntries && Array.isArray(agentData.ragEntries)) {
      agentData.data.rag_data = {
        entries: agentData.ragEntries.map(entry => ({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          createdAt: entry.createdAt || Date.now()
        })),
        lastUpdated: Date.now()
      }
    }

    // agent 업데이트
    const updatedAgent = {
      name: agentData.name,
      prompt: agentData.prompt,
      description: agentData.description,
      slug: props.agent.slug,
      categories: agentData.categories,
      tags: agentData.tags,
      bio: agentData.bio,
      thumbnail: agentData.thumbnail,
      data: agentData.data,
      is_public: agentData.permission === 'public' ? 1 : 0,
    };

    // Prepare data for agent API update
    const updateAgentData = structuredClone(JSON.parse(JSON.stringify({
      ...agentData,
      name: agentData.name,
      prompt: agentData.prompt,
      description: agentData.description,
      slug: props.agent.slug,
      categories: agentData.categories,
      bio: agentData.bio,
      data: agentData.data,
      thumbnail: agentData.thumbnail,
      tags: agentData.tags,
      is_public: agentData.permission === 'public',
    })));

    // agent 업데이트
    await agentStore.updateAgent(props.agent.id, updatedAgent);

    toast({ title: t('agent-updated-successfully') });
    isLoading.save.value = false;
    emit('cancel');

    // API 업데이트
    try {
      // Disconnect existing Zents
      for (const disconnectData of disconnectDataList) {
        await apiRequest(`/zentrun-zent/`, 'PUT', disconnectData);
      }

      // Connect new Zents
      for (const connectData of connectDataList) {
        await apiRequest(`/zentrun-zent/`, 'PUT', connectData);
      }

      // Update agent
      await apiRequest(`/zentrun-agent/`, 'PUT', updateAgentData);
    } catch (error) {
      // toast({ title: 'Failed to update agent via API', description: error.message, variant: 'destructive' });
    }
  } catch (error) {
    console.error('Error updating agent:', error);
    toast({ title: t('error-updating-agent'), description: error.message || t('api-error'), variant: 'destructive' });
  }
    isLoading.save.value = false;
}

const filteredZents = computed(() => {
  if (props.isMarketplaceMode) {
    return props.agent?.data?.zents
  } else {
    if (!searchZent.value) {
      // When no search term is entered, show zents that don't belong to any agent
      return props.zents.filter(z =>
        !selectedZents.value.some(sel => sel.slug === z.slug) &&
        !z.agent
      )
    }

    return props.zents.filter(z =>
      z.name?.toLowerCase().includes(searchZent.value.toLowerCase()) &&
      !selectedZents.value.some(sel => sel.slug === z.slug)
    )
  }
})

// Process MCPs from all selected zents' tool_calls
const processedMcps = computed(() => {
  const mcps = []
  console.log("selectedZents");
  console.log(selectedZents);
  selectedZents.value?.forEach(zent => {
    if (zent.tool_calls) {
      let toolCalls

      if (typeof zent.tool_calls === 'string') {
        try {
          toolCalls = JSON.parse(zent.tool_calls)
        } catch (e) {
          console.error('Error parsing tool_calls:', e)
          return
        }
      } else {
        toolCalls = zent.tool_calls
      }

      // Extract server information from tool_calls
      if (toolCalls) {
        toolCalls.forEach(mcp => {
          if (mcp.server_name) {
            mcps.push(mcp)
          }
        })
      }
    }
  })

  return mcps
})

// Get unique MCPs based on server_name
const uniqueMcps = computed(() => {
  const uniqueMap = new Map()

  processedMcps.value.forEach(mcp => {
    if (!uniqueMap.has(mcp.server_name)) {
      uniqueMap.set(mcp.server_name, mcp)
    }
  })

  return Array.from(uniqueMap.values())
})

function addZent(zent) {
  if (!selectedZents.value.some(z => z.slug === zent.slug)) {
    selectedZents.value.push(zent)

    // Automatically add zent's title and prompt to rag_data
    if (zent.name && zent.prompt) {
      ragEntries.value.push({
        id: `zent-${zent.id}-${Date.now()}`,
        title: zent.name,
        content: JSON.stringify(zent.data),
        createdAt: Date.now()
      })
    }
  }
  searchZent.value = ''
  setTimeout(() => {
    showZentDropdown.value = false
  })
}

function removeZent(zent) {
  selectedZents.value = selectedZents.value.filter(z => z.slug !== zent.slug)

  // Remove corresponding RAG entry if it exists
  // Find entries that might have been created from this zent
  const zentEntryPrefix = `zent-${zent.id}-`;
  ragEntries.value = ragEntries.value.filter(entry => {
    // Keep entries that don't start with the zent ID prefix
    return !entry.id.startsWith(zentEntryPrefix);
  });
}

function onZentInputBlur() {
  // 드롭다운 클릭 시 blur로 닫히지 않게 약간 지연
  zentInputBlurTimeout.value = setTimeout(() => {
    showZentDropdown.value = false
  }, 120)
}

// RAG 관련 메서드
function addRagEntry() {
  if (!newRagContent.value.trim()) return

  ragEntries.value.push({
    id: Date.now().toString(), // 임시 ID
    title: newRagTitle.value || `참조 ` + `${ragEntries.value.length + 1}`,
    content: newRagContent.value
  })

  // 폼 초기화
  newRagTitle.value = ''
  newRagContent.value = ''
  showRagForm.value = false
}

function editRagEntry(index) {
  if (editingRagIndex.value === index) {
    editingRagIndex.value = -1
  } else {
    editingRagIndex.value = index
  }
}

function removeRagEntry(index) {
  ragEntries.value.splice(index, 1)
}

function cancelAddRag() {
  newRagTitle.value = ''
  newRagContent.value = ''
  showRagForm.value = false
}

// Handle click on the execute agent button
const handleExecuteAgent = async () => {
  try {
    // Get model settings from the chat config (user-selected)
    const modelSettings = {
      systemPrompt: prompt.value || '',
      temperature: chatStore.chatConfig.temperature || 0.7,
      contextLength: chatStore.chatConfig.contextLength || 1000,
      maxTokens: chatStore.chatConfig.maxTokens || 2000,
      providerId: chatStore.chatConfig.providerId,
      modelId: chatStore.chatConfig.modelId
    }

    // Create a new thread with the agent name
    const threadId = await chatStore.createThread(props.agent.name, modelSettings)

    // Set the active thread
    await chatStore.setActiveThread(threadId)


    // Get the agent's database path
    const dbPath = await agentSQLitePresenter.getAgentDatabasePath(props.agent.slug)

    // Append database path to the prompt
    const promptWithDb = prompt.value + `\n\nLocal database path: ${dbPath}`

    // Set the agent in the chat store
    chatStore.setAgent({
      id: props.agent.id,
      name: props.agent.name,
      threadId: threadId,
      slug: props.agent.slug,
      prompt: promptWithDb
    })

    runHistoryStore.addRunHistory({
      type: 'agent',
      status: 'Success',
      run_slug: props.agent.slug,
      prompt: prompt,
      tool_calls: props.agent.tool_calls,
      user: props.agent.user,
      by: props.agent.by,
      agent: props.agent.slug,
      agent_name: props.agent.name,
      team: props.agent.team,
      organization: props.agent.organization,
    });

    // Navigate to the thread
    router.push({ name: 'chat' })

    // toast({
    //   title: t('agent.execute.success', t('agent-ready')),
    //   description: t('agent.execute.prompt', t('enter-your-message-to-interact-with-the-agent')),
    //   variant: 'default'
    // })

    // 모달 닫기 - 이 부분을 추가
    emit('update:open', false)



  } catch (error) {
    console.error('Failed to execute agent:', error)
    toast({
      title: t('agent.execute.error', t('execution-error')),
      description: error.message || t('agent.execute.unknownError', t('an-unknown-error-occurred')),
      variant: 'destructive'
    })
  }
}

// Tag functions
function handleTagInputKeydown(e) {
  // Add tag when comma or space is pressed
  if (e.key === ',' || e.key === ' ') {
    e.preventDefault()
    addTag()
  }
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !tagList.value.includes(tag)) {
    tagList.value.push(tag)
  }
  tagInput.value = ''
}

function removeTag(tag) {
  tagList.value = tagList.value.filter(t => t !== tag)
}

// Category functions
function toggleCategory(category) {
  if (selectedCategories.value.includes(category)) {
    selectedCategories.value = selectedCategories.value.filter(c => c !== category)
  } else {
    selectedCategories.value.push(category)
  }
}

function removeCategory(category) {
  selectedCategories.value = selectedCategories.value.filter(c => c !== category)
}

// Close category dropdown when clicking outside
window.addEventListener('click', (e) => {
  if (showCategoryDropdown.value) {
    // Check if the click is outside the category dropdown
    const categoryDropdown = document.querySelector('.category-dropdown-container')
    if (categoryDropdown && !categoryDropdown.contains(e.target)) {
      showCategoryDropdown.value = false
    }
  }
})

// Check if all required MCPs are installed
const checkRequiredMcpsInstalled = () => {
  const uninstalledMcps = uniqueMcps.value.filter(mcp => !isInstalledMcp(mcp.server_name));
  return {
    allInstalled: uninstalledMcps.length === 0,
    uninstalledMcps: uninstalledMcps
  };
}

// Deploy to marketplace function
const deployToMarketplace = async () => {
  try {
    isLoading.deploy.value = true;
    addTag();
    // 필수 필드 체크 (public 모드에 필요한 모든 필드)
    const missingFields = [];
    if (!name.value) missingFields.push('name');
    if (!prompt.value) missingFields.push('prompt');
    if (!thumbnail.value) missingFields.push('thumbnail');
    if (selectedCategories.value.length === 0) missingFields.push('categories');
    if (tagList.value.length === 0) missingFields.push('tags');
    if (!bio.value) missingFields.push('bio');
    // Description is optional, so we don't check it here

    if (missingFields.length > 0) {
      console.log('필수 필드 누락:', missingFields);
      toast({
        title: t('require-field-input'),
        description: t('require-field-input-deploy-marketplace') + `${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      isLoading.deploy.value = false;
      return;
    }

    // Get all zents belonging to this agent
    const zents = zentStore.zents.value.filter(zent => zent.agent === props.agent.slug);
    let agentToDepoly = {...props.agent,
            id: props.agent?.id,
            name: name.value,
            prompt: prompt.value,
            description: description.value,
            categories: selectedCategories.value,
            tags: tagList.value,
            selectedZents: selectedZents.value,
            ragEntries: ragEntries.value,
            permission: permission.value,
            thumbnail: thumbnail.value,
            bio: bio.value,
            is_public: true,
            cover_image_url: cover_image_url.value,
          }
    if (!agentToDepoly['data']) {
      agentToDepoly['data'] = {}
    }
    agentToDepoly['permission'] = "public";

    // Ensure we're storing the full zent objects, not just their slugs
    // Create a deep copy of each zent to ensure all properties are included
    const fullZents = zents.map(zent => ({
      ...zent,
      // Ensure these fields are included explicitly
      id: zent.id,
      name: zent.name,
      slug: zent.slug,
      description: zent.description,
      organization: zent.organization,
      agent: zent.agent,
      data: zent.data,
      categories: zent.categories,
      tags: zent.tags,
      tool_calls: zent.tool_calls,
      created_at: zent.created_at,
      user: zent.user,
      by: zent.by
    }));

    agentToDepoly['data']['zents'] = fullZents;
    agentToDepoly['zents'] = fullZents;
    // Send API request to deploy agent to marketplace with all its zents
    // Create a deep copy of the data before making the API request
    const deployData = structuredClone(JSON.parse(JSON.stringify(agentToDepoly)));

    // Update permission to public
    permission.value = 'public';
    await agentStore.updateAgent(props.agent.id, { is_public: 1 });

    toast({
      title: t('agent-deployed-to-marketplace'),
      description: t('your-agent-has-been-successfully-deployed-to-the-marketplace'),
    });
    isLoading.deploy.value = false;
    handleAgentUpdate({...props.agent,
            id: props.agent?.id,
            name: name.value,
            prompt: prompt.value,
            description: description.value,
            data: agentToDepoly['data'],
            zents: agentToDepoly['zents'],
            categories: selectedCategories.value,
            tags: tagList.value,
            selectedZents: selectedZents.value,
            ragEntries: ragEntries.value,
            permission: permission.value,
            thumbnail: thumbnail.value,
            bio: bio.value,
            cover_image_url: cover_image_url.value,
            is_public: true,
          })

    await apiRequest(`/zentrun-agent/deploy/`, 'POST', deployData);
  } catch (error) {
    toast({
      title: t('error-deploying-to-marketplace'),
      description: error.message || t('an-error-occurred-while-deploying-to-marketplace'),
      variant: 'destructive'
    });
    isLoading.deploy.value = false;
  }
};

// Clone agent function for marketplace mode
const cloneAgent = async () => {
  // Check if all required MCPs are installed
  const mcpCheck = checkRequiredMcpsInstalled();
  if (!mcpCheck?.allInstalled) {
    const mcpNames = mcpCheck.uninstalledMcps?.map(mcp => mcp.server_name).join(', ');
    toast({
      title: t('mcp-installation-required'),
      description: t('please-install-the-following-mcp-tools-first-mcpnames', [mcpNames]),
      variant: 'destructive'
    });
    return;
  }

  try {
    isLoading.clone.value = true;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const newSlug = props.agent.slug + "-" + nanoid();

    // Create a new agent with the same data but a new name
    const newAgent = {
      ...props.agent,
      is_public: 0,
      user: user?.id,
      slug: newSlug,
      data: {
        ...(props.agent.data || {}),
        cloned_from: props.agent.slug
      }
    }
    delete newAgent['id'];
    if (newAgent.children) {
      delete newAgent['children'];
    }

    // Prepare zents for the new agent
    const newZents = [];
    if (props.agent.data?.zents) {
        for (const zent of props.agent.data?.zents) {
        // Create a new zent with the same properties but linked to the new agent
        const newZent = {
          ...zent,
          id: nanoid(),
          slug: `${zent.slug}-copy-${nanoid()}`,
          name: `${zent.name}`,
          agent: newSlug,
          user: user?.id,
          by: zent?.by,
          data: {
            ...(zent.data || {}),
            cloned_from: zent.slug
          }
        }
        const newZentCopy = structuredClone(JSON.parse(JSON.stringify(newZent)));
        newZents.push(newZentCopy);
      }
    }
    // if (selectedZents.value) {
    //   for (const zent of selectedZents.value) {
    //   // Create a new zent with the same properties but linked to the new agent
    //   const newZent = {
    //     ...zent,
    //     id: nanoid(),
    //     slug: `${zent.slug}-copy-${nanoid()}`,
    //     name: `${zent.name}`,
    //     agent: newSlug,
    //     user: user?.id,
    //     by: zent?.by,
    //     data: {
    //       ...(zent.data || {}),
    //       cloned_from: zent.slug
    //     }
    //   }
    //   newZents.push(newZent);
    // }
    // }


    // Add zents to the agent data
    newAgent.data.zents = newZents;


    // Create a deep copy of the data before making the API request
    const newAgentCopy = structuredClone(JSON.parse(JSON.stringify(newAgent)));
    // Create the agent in the local store
    const result = await agentStore.addAgent(newAgentCopy);
    console.log('agentStore.addAgent', result);

    // Send a single API request to clone the agent with all its zents
    try {

      // Add all zents to the local store
      for (const zent of newZents) {
        await zentStore.addZent(zent);
      }

      toast({ title: t('agent-and-associated-zents-cloned-successfully') });
      emit('update:open', false);
      isLoading.clone.value = false;

      // Update the tree
      loadTreeData()

      try {
        const clonedAgent = await apiRequest('/zentrun-agent/clone/', 'POST', newAgentCopy);

        await newZents.map(async (newZent) => {
          await apiRequest('/zentrun-zent/clone/', 'POST', newZent);
        })
      } catch (error: any) {
        toast({title: 'Error copying agent', description: error.message || 'API error', variant: 'destructive'});
      }

      // Get model settings from the chat config (user-selected)
      const modelSettings = {
        systemPrompt: prompt.value || '',
        temperature: chatStore.chatConfig.temperature || 0.7,
        contextLength: chatStore.chatConfig.contextLength || 1000,
        maxTokens: chatStore.chatConfig.maxTokens || 2000,
        providerId: chatStore.chatConfig.providerId,
        modelId: chatStore.chatConfig.modelId
      }

      // Create a new thread with the agent name
      const threadId = await chatStore.createThread(newAgentCopy.name, modelSettings)

      // Set the active thread
      await chatStore.setActiveThread(threadId)


      // Get the agent's database path
      const dbPath = await agentSQLitePresenter.getAgentDatabasePath(newAgentCopy.slug)

      // Append database path to the prompt
      const promptWithDb = prompt.value + `\n\nLocal database path: ${dbPath}`

      // Set the agent in the chat store
      chatStore.setAgent({
        id: newAgentCopy.id,
        name: newAgentCopy.name,
        threadId: threadId,
        slug: newAgentCopy.slug,
        prompt: promptWithDb
      })

      runHistoryStore.addRunHistory({
        type: 'agent',
        status: 'Success',
        run_slug: newAgentCopy.slug,
        prompt: prompt,
        tool_calls: newAgentCopy.tool_calls,
        user: newAgentCopy.user,
        by: newAgentCopy.by,
        agent: newAgentCopy.slug,
        agent_name: newAgentCopy.name,
        team: newAgentCopy.team,
        organization: newAgentCopy.organization,
      });

      // Navigate to the thread
      router.push({ name: 'chat' })

      // toast({
      //   title: t('agent.execute.success', t('agent-ready')),
      //   description: t('agent.execute.prompt', t('enter-your-message-to-interact-with-the-agent')),
      //   variant: 'default'
      // })

      // 모달 닫기 - 이 부분을 추가
      emit('update:open', false)

    } catch (error) {
      // toast({
      //   title: 'Error cloning agent',
      //   description: error.message || 'API error',
      //   variant: 'destructive'
      // });
    }

  } catch (error) {
    toast({
      title: error.message || t('failed-to-clone-agent'),
      variant: 'destructive'
    });
  }
  isLoading.clone.value = false;
}

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
        name: 'Agents',
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

    // // Update treeData
    // treeData.splice(0, treeData.length, ...tree)
  } catch (error) {
    console.error('Error loading tree data:', error)
  }
}

watch(() => props.open, (open) => {
  if (open && props.agent) {
    // Set form data when dialog opens
    name.value = props.agent.name
    prompt.value = props.agent.prompt
    description.value = props.agent.description || ''
    bio.value = props.agent.bio
    thumbnail.value = props.agent.thumbnail
    permission.value = props.agent.is_public ? 'public' : 'private'

    // Initialize categories
    if (props.agent.categories) {
      if (Array.isArray(props.agent.categories)) {
        selectedCategories.value = [...props.agent.categories]
      } else if (typeof props.agent.categories === 'string') {
        // Try to parse JSON string if it's in that format
        try {
          const parsedCategories = JSON.parse(props.agent.categories)
          if (Array.isArray(parsedCategories)) {
            selectedCategories.value = parsedCategories
          } else {
            // If it's a single string, add it as a categories
            selectedCategories.value = [props.agent.categories]
          }
        } catch (e) {
          // If parsing fails, treat it as a single categories
          selectedCategories.value = [props.agent.categories]
        }
      }
    } else {
      selectedCategories.value = []
    }

    // Initialize tags
    if (props.agent.tags) {
      if (Array.isArray(props.agent.tags)) {
        tagList.value = [...props.agent.tags]
      } else if (typeof props.agent.tags === 'string') {
        // Try to parse JSON string if it's in that format
        try {
          const parsedTags = JSON.parse(props.agent.tags)
          if (Array.isArray(parsedTags)) {
            tagList.value = parsedTags
          } else {
            // If it's a comma-separated string, split it
            tagList.value = props.agent.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          }
        } catch (e) {
          // If parsing fails, treat it as a comma-separated string
          tagList.value = props.agent.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        }
      }
    } else {
      tagList.value = []
    }
    if (props.agent?.data?.zents) {
      // selectedZents.value = [...zentStore.zents.value.filter(zent => zent.agent === props.agent.slug)]
      selectedZents.value = props.agent?.data?.zents
    } else {
      zentStore.loadZents()
      selectedZents.value = [...zentStore.zents.value.filter(zent => zent.agent === props.agent.slug)]
    }

    // Initialize RAG entries
    if (props.agent?.data) {
      try {
        const data = props.agent.data
        if (data.rag_data && Array.isArray(data.rag_data.entries)) {
          // Map entries to the format expected by the UI
          ragEntries.value = data.rag_data.entries.map(entry => ({
            id: entry.id,
            title: entry.title || t('untitled-reference'),
            content: entry.content
          }))
        } else {
          ragEntries.value = []
        }
      } catch (e) {
        console.error('Failed to parse agent data:', e)
        ragEntries.value = []
      }
    } else {
      ragEntries.value = []
    }

    // Initialize thumbnail, cover_image_url, and bio
    thumbnail.value = props.agent?.thumbnail || ''
    cover_image_url.value = props.agent?.cover_image_url || ''
    bio.value = props.agent?.bio || ''

  } else if (!open) {
    // Reset form when dialog closes
    name.value = ''
    prompt.value = ''
    description.value = ''
    tagInput.value = ''
    tagList.value = []
    selectedCategories.value = []
    searchZent.value = ''
    selectedZents.value = []
    ragEntries.value = []
    showRagForm.value = false
    newRagTitle.value = ''
    newRagContent.value = ''
    editingRagIndex.value = -1
    thumbnail.value = ''
    cover_image_url.value = ''
    bio.value = ''
    showCoverImageUploader.value = false
    editingProfile.value = true
    editingPrompt.value = true
    editingDescription.value = true
  }
})
</script>
