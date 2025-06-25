<template>
  <div :class="isFullSize ? '' : 'w-1/2'">
    <Label class="block mb-1">{{ displayLabel }} <span v-if="required" class="text-red-500">*</span></Label>
    <Label class="block mt-2 mb-2 text-xs text-muted-foreground ">{{ $t('zpilot-is-a-meta-agent-that-orchestrates-all-agents-and-zents-within-an-organization-to-achieve-the-desired-outcome') }}</Label>
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
import { ref, computed } from 'vue';
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
  }
});

const displayLabel = computed(() => props.label || t('select-thumbnail'));

defineEmits(['update:modelValue']);

const thumbnailImages = ref([
  'p1.png', 'p2.png', 'p3.png', 'p4.png', 'p5.png',
  'p6.png', 'p7.png', 'p8.png', 'p9.png', 'p10.png',
  'p11.png', 'p12.png', 'p13.png', 'p14.png', 'p15.png', 'p16.png'
]);

function getImageUrl(imageName) {
  return new URL(`../assets/images/characters/${imageName}`, import.meta.url).href;
}
</script>
