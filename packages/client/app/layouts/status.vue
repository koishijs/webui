<template>
  <footer class="layout-status">
    <k-view name="status-left"></k-view>
    <k-view name="status-right"></k-view>
  </footer>
</template>

<style lang="scss">

.layout-status {
  position: fixed;
  box-sizing: border-box;
  z-index: 100;
  bottom: 0;
  height: var(--footer-height);
  left: 0;
  right: 0;
  background-color: var(--card-bg);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  border-top: var(--border) 1px solid;
  transition: var(--color-transition);
}

</style>
