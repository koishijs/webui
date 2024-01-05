<template>
  <k-comment v-for="item in notifiers" :type="item.type">
    <p>{{ item.content }}</p>
  </k-comment>
</template>

<script setup lang="ts">

import { useRpc } from '@koishijs/client'
import type NotifierService from '@koishijs/plugin-notifier/src'
import { inject, computed } from 'vue'

const current: any = inject('manager.settings.current')

const data = useRpc<NotifierService.Data>()

const notifiers = computed(() => {
  return data.value.notifiers.filter((item) => {
    return item.paths?.includes(current.value.path) && item.content
  })
})

</script>

<style scoped lang="scss">

</style>
