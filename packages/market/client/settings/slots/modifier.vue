<template>
  <k-modifier v-if="data.local.filter !== false" v-model="data.config"></k-modifier>
</template>

<script lang="ts" setup>

import { SettingsData } from '../utils'
import KModifier from '../modifier.vue'

defineProps<{
  data: SettingsData
}>()

</script>
