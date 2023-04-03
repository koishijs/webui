<template>
  <k-status v-if="route.path.startsWith('/files')">
    {{ language.aliases[0] ?? language.id }}
  </k-status>
</template>

<script lang="ts" setup>

import { useRoute } from 'vue-router'
import { language } from './editor'

const route = useRoute()

</script>
