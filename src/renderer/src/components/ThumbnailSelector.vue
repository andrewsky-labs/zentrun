<template>
  <div :class="isFullSize ? '' : 'w-1/2'">
    <Label class="block mb-1">{{ displayLabel }} <span v-if="required" class="text-red-500">*</span></Label>
    <Label v-if="!isAgent" class="block mt-2 mb-2 text-xs text-muted-foreground ">{{ $t('zpilot-is-a-meta-agent-that-orchestrates-all-agents-and-zents-within-an-organization-to-achieve-the-desired-outcome') }}</Label>
    <div class="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
      <div
        v-for="image in thumbnailImages"
        :key="image"
        class="cursor-pointer rounded-md overflow-hidden border-2 transition-all"
        :class="{ 'border-primary': modelValue === image, 'border-transparent hover:border-gray-300': modelValue !== image }"
        @click="$emit('update:modelValue', image)"
      >
        <img :src="getImageUrl(image)" class="w-full h-auto object-cover" :alt="image" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import { Label } from '@/components/ui/label';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  isFullSize: {
    type: Boolean,
    default: false
  },
  isAgent: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:modelValue']);

const displayLabel = computed(() => props.label || t('select-thumbnail'));

const thumbnailImages = ref([
  'd1.png', 'd2.png', 'd3.png', 'd4.png', 'd5.png',
  'd6.png', 'd7.png', 'd8.png', 'd9.png', 'd10.png',
  'd11.png', 'd12.png', 'd13.png', 'd14.png', 'd15.png', 'd16.png'
]);

function getImageUrl(imageName) {
  return new URL(`../assets/images/characters/${imageName}`, import.meta.url).href;
}
</script>
