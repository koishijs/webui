<template>
  <footer class="layout-status">
    <k-slot name="status-left"></k-slot>
    <k-slot name="status-right"></k-slot>
  </footer>
</template>

<style lang="scss">

.layout-status {
  position: fixed;
  box-sizing: border-box;
  z-index: 200;
  bottom: 0;
  height: var(--footer-height);
  left: var(--activity-width);
  right: 0;
  background-color: var(--bg3);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  border-top: var(--border) 1px solid;
  transition: var(--color-transition);
  font-size: 0.875rem;
  line-height: var(--footer-height);

  @media screen and (max-width: 768px) {
    display: none;
  }

  > * {
    display: inline-flex;
  }

  .el-progress-bar {
    width: 120px;
    margin-right: 2px;
  }
}

</style>
