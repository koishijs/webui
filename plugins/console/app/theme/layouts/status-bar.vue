<template>
  <footer class="layout-status">
    <div><k-slot name="status-left"></k-slot></div>
    <div><k-slot name="status-right"></k-slot></div>
  </footer>
</template>

<style lang="scss">

.layout-status {
  position: fixed;
  box-sizing: border-box;
  z-index: 50;
  bottom: 0;
  height: var(--footer-height);
  left: var(--activity-width);
  right: 0;
  background-color: var(--k-status-bg, var(--k-side-bg));
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  border-top: var(--k-status-divider, var(--k-color-divider-dark)) 1px solid;
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
