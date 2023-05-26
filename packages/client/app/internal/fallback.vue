<template>
  <k-content>
    <k-form :schema="settings?.schema" v-model="config" :initial="config"></k-form>
  </k-content>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { config, useCordis } from '@koishijs/client'

const route = useRoute()
const ctx = useCordis()

const settings = computed(() => {
  const name = route.params.name?.toString()
  return ctx.settings[name]
})

</script>
