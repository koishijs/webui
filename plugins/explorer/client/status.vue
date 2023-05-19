<template>
  <k-status v-if="route.path.startsWith('/files')">
    {{ language.aliases[0] ?? language.id }}
  </k-status>
</template>

<script lang="ts" setup>

import { useRoute } from 'vue-router'
import useMonacoEditor from './editor';

const { language } = await useMonacoEditor()
const route = useRoute()

</script>
