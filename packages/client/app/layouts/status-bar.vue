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
  font-size: 0.875rem;
  line-height: var(--footer-height);

  > * {
    display: inline-flex;
  }
}

@media screen and (max-width: 768px) {
  .layout-status {
    display: none;
  }
}

</style>
