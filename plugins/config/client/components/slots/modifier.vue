<template>
  <k-modifier v-if="data.local.runtime.filter !== false" v-model="config"></k-modifier>
</template>

<script lang="ts" setup>

import { SettingsData } from '../utils'
import KModifier from '../modifier.vue'
import { inject } from 'vue'

const config: any = inject('manager.settings.config')

defineProps<{
  data: SettingsData
}>()

</script>
