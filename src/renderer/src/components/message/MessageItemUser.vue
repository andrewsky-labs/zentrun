<template>
  <div v-show="!message.content || !message.content.continue" :class="['flex flex-row-reverse group p-4 pl-11 gap-2']">
    <!-- 头像 -->
    <div class="w-5 h-5 bg-muted rounded-md overflow-hidden">
      <img v-if="message.avatar" :src="message.avatar" class="w-full h-full" :alt="message.role" />
      <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground">
        <Icon icon="lucide:user" class="w-4 h-4" />
      </div>
    </div>
    <div class="flex flex-col w-full space-y-1.5 items-end">
      <MessageInfo
        class="flex-row-reverse"
        :name="message.name ?? 'user'"
        :timestamp="message.timestamp"
      />
      <!-- 消息内容 -->
      <div class="text-sm bg-[#EFF6FF] dark:bg-muted rounded-lg p-2 border flex flex-col gap-1.5">
        <div v-show="message.content.files && message.content.files.length > 0" class="flex flex-wrap gap-1.5">
          <FileItem
            v-for="file in message.content.files"
            :key="file.name"
            :file-name="file.name"
            :deletable="false"
            :tokens="file.token"
            :mime-type="file.mimeType"
            :thumbnail="file.thumbnail"
            @click="previewFile(file.path)"
          />
        </div>
        <div v-if="isEditMode" class="text-sm w-full whitespace-pre-wrap break-all">
          <textarea
            v-model="editedText"
            class="text-sm bg-[#EFF6FF] dark:bg-muted rounded-lg p-2 border flex flex-col gap-1.5 resize"
            :style="{
              height: originalContentHeight + 18 + 'px',
              width: originalContentWidth + 20 + 'px'
            }"
          ></textarea>
        </div>
        <div
          v-else
          ref="originalContent"
          class="text-sm whitespace-pre-wrap break-all"
          v-html="displayText"
        ></div>
        <!-- <div
          v-else-if="message.content.continue"
          class="text-sm whitespace-pre-wrap break-all flex flex-row flex-wrap items-center gap-2"
        >
          <Icon icon="lucide:info" class="w-4 h-4" />
          <span>用户选择继续对话</span>
        </div>
         -->
        <!-- disable for now -->
        <!-- <div class="flex flex-row gap-1.5 text-xs text-muted-foreground">
          <span v-if="message.content.search">联网搜索</span>
          <span v-if="message.content.reasoning_content">深度思考</span>
        </div> -->
      </div>
      <MessageToolbar
        class="flex-row-reverse"
        :usage="message.usage"
        :loading="false"
        :is-assistant="false"
        :is-edit-mode="isEditMode"
        @delete="handleAction('delete')"
        @copy="handleAction('copy')"
        @edit="startEdit"
        @save="saveEdit"
        @cancel="cancelEdit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserMessage } from '@shared/chat'
import { Icon } from '@iconify/vue'
import MessageInfo from './MessageInfo.vue'
import FileItem from '../FileItem.vue'
import MessageToolbar from './MessageToolbar.vue'
import { useChatStore } from '@/stores/chat'
import { usePresenter } from '@/composables/usePresenter'
import { ref, watch, onMounted } from 'vue'

const chatStore = useChatStore()
const windowPresenter = usePresenter('windowPresenter')
const threadPresenter = usePresenter('threadPresenter')

const props = defineProps<{
  message: UserMessage
}>()

const isEditMode = ref(false)
const editedText = ref('')
const originalText = ref('')
const displayText = ref('')
const originalContent = ref(null)
const originalContentHeight = ref(0)
const originalContentWidth = ref(0)

// Initialize display text with message content

const formatDisplayText = () => {
  if (props.message.content && Array.isArray(props.message.content.content)) {
    displayText.value = props.message.content.content
      .map((block) => {
        if (block.type === 'mention') {
          return `<span class=" cursor-pointer px-1.5 py-0.5 text-xs rounded-md bg-blue-200/80 dark:bg-secondary text-foreground inline-block max-w-64 align-sub !truncate">${block.content}</span>`
        } else {
          return block.content
        }
      })
      .join('')
  } else if (props.message.content && props.message.content.text) {
    displayText.value = props.message.content.text
  } else if (typeof props.message.content === 'string') {
    displayText.value = props.message.content
  } else if (props.message.content && typeof props.message.content === 'object') {
    // Handle case where content is an object but doesn't have text or content properties
    displayText.value = JSON.stringify(props.message.content)
  } else {
    // Fallback for any other case
    displayText.value = ''
  }
}
formatDisplayText()

// Update displayText whenever message content changes
watch(
  () => props.message.content,
  () => {
    formatDisplayText()
  },
  { deep: true }
)

onMounted(() => {
  if (originalContent.value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalContentHeight.value = (originalContent.value as any).offsetHeight
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalContentWidth.value = (originalContent.value as any).offsetWidth
  }
})

watch(isEditMode, (newValue) => {
  if (newValue && originalContent.value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalContentHeight.value = (originalContent.value as any).offsetHeight
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalContentWidth.value = (originalContent.value as any).offsetWidth
  }
})

const emit = defineEmits<{
  fileClick: [fileName: string]
  retry: []
}>()

const previewFile = (filePath: string) => {
  windowPresenter.previewFile(filePath)
}

const startEdit = () => {
  isEditMode.value = true
  // Use message.content.text if available, otherwise use the current displayText
  const textToEdit = props.message.content && props.message.content.text ? props.message.content.text : displayText.value
  editedText.value = textToEdit
  originalText.value = textToEdit
}

const saveEdit = async () => {
  if (editedText.value.trim() === '') return

  try {
    let newContent;

    // Handle different message content structures
    if (typeof props.message.content === 'string') {
      // If content was a string, replace it directly
      newContent = editedText.value;
    } else if (props.message.content && typeof props.message.content === 'object') {
      if (Array.isArray(props.message.content.content)) {
        // If content had a content array, update it with a single text block
        newContent = {
          ...props.message.content,
          text: editedText.value,
          content: [{ type: 'text', content: editedText.value }]
        };
      } else {
        // Otherwise just update the text property
        newContent = {
          ...props.message.content,
          text: editedText.value
        };
      }
    } else {
      // Fallback: create a new content object
      newContent = {
        text: editedText.value,
        files: [],
        links: [],
        type: 'content'
      };
    }

    // Update the message in the database using editMessage method
    await threadPresenter.editMessage(props.message.id, JSON.stringify(newContent))

    // Update local display text instead of mutating props
    displayText.value = editedText.value

    // Emit retry event for MessageItemAssistant to handle
    emit('retry')

    // Exit edit mode
    isEditMode.value = false
  } catch (error) {
    console.error('Failed to save edit:', error)
  }
}

const cancelEdit = () => {
  editedText.value = originalText.value
  isEditMode.value = false
}

const handleAction = (action: 'delete' | 'copy') => {
  if (action === 'delete') {
    chatStore.deleteMessage(props.message.id)
  } else if (action === 'copy') {
    // Use message.content.text if available, otherwise use the current displayText
    const textToCopy = props.message.content && props.message.content.text ? props.message.content.text : displayText.value
    window.api.copyText(textToCopy)
  }
}
</script>
