<template>
  <span class="k-horizontal-tab">
    <span class="k-horizontal-tab-item"
      v-for="(label, key) in data" :key="key"
      :class="{ active: modelValue === key }"
      @click="$emit('update:modelValue', key)">{{ label }}</span>
  </span>
</template>

<script lang="ts" setup>

defineProps<{
  data: Record<string | number, string>
  modelValue: string | number
}>()

defineEmits(['update:modelValue'])

</script>

<style lang="scss">

.k-horizontal-tab-item {
  cursor: pointer;
  position: relative;
  color: var(--k-color-disabled);
  transition: color 0.3s ease;

  & + & {
    margin-left: 2rem;

    &::before {
      content: '|';
      color: var(--k-color-disabled);
      left: -1rem;
      position: absolute;
      transition: color 0.3s ease;
      transform: translateX(-50%);
    }
  }

  &.active {
    color: var(--fg1);
  }
}

</style>
