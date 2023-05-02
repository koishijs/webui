<script lang="ts">

import { h } from 'vue'
import segment from '@satorijs/element'
import renderChildren from './render'

export default {
  name: 'message-content',
  props: {
    content: {
      type: String,
      required: true,
    },
  },
  setup(props, ctx) {
    return () => h('div', { class: 'message-content' }, renderChildren(segment.parse(props.content), ctx))
  },
}

</script>

<style lang="scss" scoped>

.message-content {
  white-space: break-spaces;
  line-height: 1.5;
  position: relative;

  :deep(img), :deep(audio), :deep(video) {
    display: block;
    max-height: 320px;
    max-width: 100%;
  }

  :deep(p) {
    margin: 0;
  }
}

</style>
