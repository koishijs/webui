<template>
  <el-tooltip placement="top">
    <template #content>
      <slot name="tooltip"></slot>
    </template>
    <div class="status-item">
      <slot></slot>
    </div>
  </el-tooltip>
</template>

<style lang="scss">

.status-item {
  cursor: default;
  padding: 0 0.5rem;
  transition: var(--color-transition);

  &:hover {
    background-color: var(--hover-bg);
  }
}

</style>
