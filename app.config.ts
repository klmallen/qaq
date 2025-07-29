export default defineAppConfig({
  ui: {
    primary: 'green',
    gray: 'neutral',

    // 覆盖组件样式
    button: {
      rounded: 'rounded-none',
      default: {
        variant: 'ghost'
      }
    },
    input: {
      rounded: 'rounded-none'
    },
    card: {
      rounded: 'rounded-none'
    },
    modal: {
      rounded: 'rounded-none'
    },
    dropdown: {
      rounded: 'rounded-none'
    },
    select: {
      rounded: 'rounded-none'
    },
    toggle: {
      rounded: 'rounded-none'
    }
  }
})
