import { defineStore } from 'pinia'
import { ref } from 'vue'

interface EditedCodeBlock {
  messageId: string
  language: string
  originalCode: string
  editedCode: string
}

export const useCodeBlockStore = defineStore('codeBlock', () => {
  // Store edited code blocks with messageId and language as the key
  const editedBlocks = ref<Record<string, EditedCodeBlock>>({})

  // Set edited code for a specific block
  const setEditedCode = (messageId: string, language: string, originalCode: string, editedCode: string) => {
    const key = `${messageId}-${language}`
    editedBlocks.value[key] = {
      messageId,
      language,
      originalCode,
      editedCode
    }
  }

  // Get edited code for a specific block
  const getEditedCode = (messageId: string, language: string, originalCode: string): string => {
    const key = `${messageId}-${language}`
    const block = editedBlocks.value[key]

    // If the block exists and the original code matches, return the edited code
    if (block && block.originalCode === originalCode) {
      return block.editedCode
    }

    // Otherwise, return the original code
    return originalCode
  }

  // Clear edited code for a specific block
  const clearEditedCode = (messageId: string, language: string) => {
    const key = `${messageId}-${language}`
    delete editedBlocks.value[key]
  }

  // Clear all edited code blocks
  const clearAllEditedCode = () => {
    editedBlocks.value = {}
  }

  return {
    editedBlocks,
    setEditedCode,
    getEditedCode,
    clearEditedCode,
    clearAllEditedCode
  }
})
