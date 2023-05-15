<template>
  <span class="link" @click.stop="active = name">
    {{ name }}
  </span>
</template>

<script lang="ts" setup>

import { active } from '../utils'

defineProps<{
  name: string
}>()

</script>

<style scoped lang="scss">

</style>
