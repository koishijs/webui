<template>
  <el-tooltip :disabled="disabled" :content="toValue(label)" placement="bottom">
    <span class="menu-item" :class="[type, { disabled }]" @click="action()">
      <k-icon class="menu-icon" :name="toValue(icon)"></k-icon>
    </span>
  </el-tooltip>
</template>

<script lang="ts" setup>

import { LegacyMenuItem } from '@koishijs/client'
import { computed, toValue } from 'vue'

const props = defineProps<LegacyMenuItem>()

const disabled = computed(() => toValue(props.disabled))

</script>
