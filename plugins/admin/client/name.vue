<template>
  <template v-if="id.startsWith('command:')">
    指令：{{ id.slice(8) }}
  </template>
  <template v-else-if="id.startsWith('group:')">
    用户组：{{ store.locales?.[`permission.${id}`] || data.group[id.slice(6)].name || '未命名' }}
  </template>
  <template v-else>
    {{ store.locales?.[`permission.${id}`] || id }}
  </template>
</template>

<script setup lang="ts">

import { store, useRpc } from '@koishijs/client'
import type Admin from '@koishijs/plugin-admin/src'

defineProps({
  id: String,
})

const data = useRpc<Admin.Data>()

</script>
