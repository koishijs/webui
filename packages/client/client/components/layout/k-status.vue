<template>
  <el-tooltip placement="top" effect="light" popper-class="k-status-tooltip">
    <template #content v-if="$slots.tooltip">
      <slot name="tooltip"></slot>
    </template>
    <div class="k-status" v-bind="$attrs">
      <slot></slot>
    </div>
  </el-tooltip>
</template>

<script lang="ts">

export default {
  inheritAttrs: false,
}

</script>

<style lang="scss" scoped>

.k-status {
  cursor: default;
  padding: 0 0.5rem;
  display: inline-flex;
  align-items: center;
  transition: var(--color-transition);

  &:hover {
    background-color: var(--hover-bg);
  }
}

</style>

<style lang="scss">

.el-popper.k-status-tooltip {
  padding: 0 0;
  border-radius: 8px;
  color: var(--fg1);
  background-color: var(--card-bg);
  border: 1px solid var(--border);
  box-shadow: var(--card-shadow);
  transition: var(--color-transition);

  .el-popper__empty + .el-popper__arrow {
    display: none;
  }
}

</style>
