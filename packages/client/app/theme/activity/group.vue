<template>
  <el-tooltip placement="right" popper-class="activity-group-tooltip">
    <template #content>
      <slot></slot>
    </template>
    <div class="navbar-item">
      <k-icon class="menu-icon" name="activity:ellipsis"></k-icon>
    </div>
  </el-tooltip>
</template>

<script lang="ts" setup>

</script>

<style lang="scss">

.activity-group-tooltip {
  padding: 0;

  .navbar-item {
    display: inline-flex;
  }
}

</style>
