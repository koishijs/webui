<template>
  <!-- preventOverflow 默认 padding 为 0，弹层会被允许贴死视口右缘：
       经典滚动条环境下亚像素取整溢出会触发 body 滚动条与悬停循环闪烁，故留出安全边距 -->
  <el-tooltip
    placement="top"
    effect="light"
    popper-class="k-status-tooltip"
    :popper-options="{ modifiers: [{ name: 'preventOverflow', options: { padding: { top: 0, bottom: 0, left: 8, right: 8 } } }] }"
  >
    <template #content>
      <el-scrollbar max-height="calc(100vh - 4rem)">
        <slot name="tooltip">
          <span class="el-popper__empty"></span>
        </slot>
      </el-scrollbar>
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

  &:has(.el-popper__empty) {
    display: none;
  }
}

</style>
