<template>
  <div>
    <Label class="block mb-1">{{ label }} </Label>
    <div class="flex flex-col gap-2">
      <!-- Preview of current image if available -->
      <div v-if="modelValue" class="relative w-full h-32 border rounded overflow-hidden">
        <img :src="modelValue" class="w-full h-full object-cover" alt="Cover Image" />
        <button
          @click.prevent="removeImage"
          class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          title="Remove image"
        >
          <Icon icon="lucide:x" class="h-4 w-4" />
        </button>
      </div>

      <!-- Upload button and input -->
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          @click="triggerFileInput"
          class="flex items-center gap-2"
        >
          <Icon icon="lucide:upload" class="h-4 w-4" />
          {{ modelValue ? t('common.changeImage', 'Change Image') : t('common.uploadImage', 'Upload Image') }}
        </Button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />

        <span v-if="modelValue" class="text-sm text-muted-foreground">
          {{ t('common.or', 'or') }}
        </span>

        <Input
          v-if="modelValue"
          v-model="imageUrl"
          :placeholder="t('common.enterImageUrl', 'Enter image URL')"
          class="flex-1"
        />

        <Button
          v-if="imageUrl"
          variant="default"
          size="sm"
          @click="applyImageUrl"
        >
          {{ t('common.apply', 'Apply') }}
        </Button>
      </div>

      <!-- Upload progress and status -->
      <div v-if="isUploading" class="w-full">
        <Progress :value="uploadProgress" class="w-full" />
        <p class="text-xs text-muted-foreground mt-1">{{ t('common.uploading', 'Uploading...') }} {{ uploadProgress }}%</p>
      </div>

      <p v-if="errorMessage" class="text-xs text-destructive mt-1">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@iconify/vue';
import { usePresenter } from '@/composables/usePresenter';

const { t } = useI18n();
const filePresenter = usePresenter('filePresenter');

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Cover Image'
  }
});

const emit = defineEmits(['update:modelValue']);

const fileInput = ref<HTMLInputElement | null>(null);
const imageUrl = ref('');
const isUploading = ref(false);
const uploadProgress = ref(0);
const errorMessage = ref('');

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue !== imageUrl.value) {
    imageUrl.value = '';
  }
});

// Trigger the file input click
function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

// Handle file selection
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Reset error message
  errorMessage.value = '';

  // Check file type
  if (!file.type.startsWith('image/')) {
    errorMessage.value = t('common.invalidFileType', 'Please select an image file');
    return;
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errorMessage.value = t('common.fileTooLarge', 'File size should be less than 5MB');
    return;
  }

  try {
    isUploading.value = true;

    // Convert file to data URL
    const dataUrl = await readFileAsDataURL(file);

    // Simulate upload progress
    simulateUploadProgress();

    // Upload the file (or just use the data URL in this case)
    const imageUrl = await uploadImage(file);

    // Update the model value with the image URL
    emit('update:modelValue', imageUrl);

    // Reset the file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    errorMessage.value = t('common.uploadError', 'Error uploading image');
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
}

// Apply manually entered image URL
function applyImageUrl() {
  if (imageUrl.value) {
    emit('update:modelValue', imageUrl.value);
    imageUrl.value = '';
  }
}

// Remove the current image
function removeImage() {
  emit('update:modelValue', '');
}

// Read file as data URL
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Simulate upload progress
function simulateUploadProgress() {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress > 100) {
      progress = 100;
      clearInterval(interval);
    }
    uploadProgress.value = Math.floor(progress);
  }, 200);
}

// Upload image function
async function uploadImage(file: File): Promise<string> {
  // This is where you would normally upload the file to a server
  // For now, we'll just convert it to a data URL and return that

  // Read file as data URL
  const dataUrl = await readFileAsDataURL(file);

  // In a real implementation, you might want to upload the file to a server
  // and return the URL of the uploaded file

  return dataUrl;
}
</script>
