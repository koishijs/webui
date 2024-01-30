<template>
  <k-comment v-for="item in notifiers" :type="item.type">
    <render :children="segment.parse(item.content)"></render>
  </k-comment>
</template>

<script setup lang="ts">

import segment from '@satorijs/element'
import { useRpc, send } from '@koishijs/client'
import type NotifierService from '@koishijs/plugin-notifier/src'
import { h, inject, computed, resolveComponent, FunctionalComponent } from 'vue'

const current: any = inject('manager.settings.current')

const data = useRpc<NotifierService.Data>()

const notifiers = computed(() => {
  return data.value.notifiers.filter((item) => {
    return item.paths?.includes(current.value.path) && item.content
  })
})

const forward = ['div', 'ul', 'ol', 'li', 'br', 'span', 'p', 'img', 'audio', 'video', 'b', 'strong', 'i', 'em', 'u', 'ins', 's', 'del', 'code']

const render: FunctionalComponent<{ children: segment[] }> = ({ children }, ctx) => {
  return children.map(({ type, attrs, children }) => {
    if (type === 'text') {
      return attrs.content
    } else if (forward.includes(type)) {
      return h(type, attrs, {
        default: () => render({ children }, ctx),
      })
    } else if (type === 'spl') {
      return h('span', { class: 'spoiler', ...attrs }, {
        default: () => render({ children }, ctx),
      })
    } else if (type === 'button') {
      return h(resolveComponent('el-button'), {
        ...attrs,
        onClick: () => send('notifier/button', attrs.onClick),
      }, {
        default: () => render({ children }, ctx),
      })
    } else if (type === 'progress') {
      return h(resolveComponent('el-progress'), attrs, {
        default: () => render({ children }, ctx),
      })
    } else if (type === 'template') {
      return render({ children }, ctx)
    }
  })
}

</script>

<style scoped lang="scss">

</style>
