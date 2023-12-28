<template>
  <div class="k-tab-item k-tab-menu-item truncate"
    :title="label"
    :class="{ active: label === modelValue }"
    @click="$emit('update:modelValue', label)">
    <slot>{{ label }}</slot>
  </div>
</template>

<script lang="ts" setup>

defineEmits(['update:modelValue'])

defineProps<{
  label: string
  modelValue: string
}>()

</script>

<style lang="scss">

.k-tab-item {
  line-height: 2.25rem;
  padding: 0 2rem 0 4rem;

  &.active {
    background-color: var(--k-hover-bg);
  }
}

</style>
