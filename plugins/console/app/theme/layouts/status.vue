<template>
  <el-tooltip placement="top" effect="light" popper-class="k-status-tooltip">
    <template #content>
      <slot name="tooltip">
        <span class="el-popper__empty"></span>
      </slot>
    </template>
    <div class="k-status" v-bind="$attrs">
      <slot></slot>
    </div>
  </el-tooltip>
</template>

<script lang="ts" setup>

defineOptions({
  inheritAttrs: false,
})

</script>

<style lang="scss" scoped>

.k-status {
  cursor: default;
  padding: 0 0.5rem;
  display: inline-flex;
  align-items: center;
  transition: var(--color-transition);
  user-select: none;
  cursor: pointer;

  &:hover {
    background-color: var(--k-hover-bg);
  }
}

</style>

<style lang="scss">

.el-popper.k-status-tooltip {
  padding: 0 0;
  border-radius: 8px;

  .el-popper__empty + .el-popper__arrow {
    display: none;
  }
}

</style>
