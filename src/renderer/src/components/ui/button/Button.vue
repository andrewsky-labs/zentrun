<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Primitive, type PrimitiveProps } from 'radix-vue'
import { type ButtonVariants, buttonVariants } from '.'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button'
})

const darkBg = computed(() => {
  let className = ''
  if (props.variant === 'outline') {
    className = 'dark:bg-muted'
  } else if (props.variant === 'default') {
    className = 'dark:hover:bg-primary'
  }
  return className
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(darkBg, buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
