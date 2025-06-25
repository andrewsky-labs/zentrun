import { defineComponent, h, provide, inject, ref, computed, watch } from 'vue'

const COLLAPSIBLE_SYMBOL = Symbol('collapsible')

export const Collapsible = defineComponent({
  name: 'Collapsible',
  props: {
    open: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:open'],
  setup(props, { slots, emit }) {
    const isOpen = ref(props.open)

    // Watch for prop changes
    watch(
      () => props.open,
      (newValue) => {
        isOpen.value = newValue
      }
    )

    // Update parent when internal state changes
    watch(isOpen, (newValue) => {
      if (newValue !== props.open) {
        emit('update:open', newValue)
      }
    })

    // Provide context to children
    provide(COLLAPSIBLE_SYMBOL, {
      isOpen,
      disabled: computed(() => props.disabled),
      toggle: () => {
        if (!props.disabled) {
          isOpen.value = !isOpen.value
          emit('update:open', isOpen.value)
        }
      }
    })

    return () =>
      h(
        'div',
        {
          'data-state': isOpen.value ? 'open' : 'closed',
          class: 'collapsible'
        },
        slots.default?.()
      )
  }
})

export const CollapsibleTrigger = defineComponent({
  name: 'CollapsibleTrigger',
  setup(_, { slots, attrs }) {
    const collapsible = inject(COLLAPSIBLE_SYMBOL, null) as {
      isOpen: { value: boolean }
      disabled: { value: boolean }
      toggle: () => void
    } | null

    if (!collapsible) {
      console.error('CollapsibleTrigger must be used within a Collapsible')
      return () => null
    }

    return () =>
      h(
        'button',
        {
          type: 'button',
          'data-state': collapsible.isOpen.value ? 'open' : 'closed',
          disabled: collapsible.disabled.value,
          'aria-expanded': collapsible.isOpen.value,
          onClick: collapsible.toggle,
          ...attrs
        },
        slots.default?.()
      )
  }
})

export const CollapsibleContent = defineComponent({
  name: 'CollapsibleContent',
  setup(_, { slots, attrs }) {
    const collapsible = inject(COLLAPSIBLE_SYMBOL, null) as {
      isOpen: { value: boolean }
      disabled: { value: boolean }
      toggle: () => void
    } | null

    if (!collapsible) {
      console.error('CollapsibleContent must be used within a Collapsible')
      return () => null
    }

    return () => {
      if (!collapsible.isOpen.value) {
        return null
      }

      return h(
        'div',
        {
          'data-state': collapsible.isOpen.value ? 'open' : 'closed',
          ...attrs
        },
        slots.default?.()
      )
    }
  }
})
