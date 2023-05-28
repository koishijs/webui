<template>
  <el-tooltip :disabled="disabled" :content="toValue(label)" placement="bottom">
    <span class="menu-item" :class="[type, { disabled }]" @click="action()">
      <k-icon class="menu-icon" :name="toValue(icon)"></k-icon>
    </span>
  </el-tooltip>
</template>

<script lang="ts" setup>

import { LayoutMenuItem } from '@koishijs/client'
import { computed, toValue } from 'vue'

const props = defineProps<LayoutMenuItem>()

const disabled = computed(() => toValue(props.disabled))

</script>
