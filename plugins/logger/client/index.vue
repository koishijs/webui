<template>
  <k-layout>
    <logs class="layout-logger" :logs="store.logs" show-link></logs>
  </k-layout>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'
import Logs from './logs.vue'

</script>
