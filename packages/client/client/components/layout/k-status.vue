<template>
  <el-tooltip placement="top" effect="light" popper-class="k-status-tooltip">
    <template #content>
      <slot name="tooltip"></slot>
    </template>
    <div class="k-status">
      <slot></slot>
    </div>
  </el-tooltip>
</template>

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
}

</style>
