<template>
  <header class="layout-header">
    <div class="layout-header-start"></div>
    <div class="layout-header-main">
      <slot name="header"></slot>
    </div>
    <div class="layout-header-end"></div>
  </header>
  <div class="layout-container">
    <aside class="layout-left" :class="{ show: $slots.left }">
      <slot name="left"></slot>
    </aside>
    <main class="layout-main">
      <slot></slot>
    </main>
    <aside class="layout-right" :class="{ show: $slots.right }">
      <slot name="right"></slot>
    </aside>
  </div>
</template>

<style lang="ts" setup>

</style>

<style lang="scss">

.layout-header {
  position: absolute;
  box-sizing: border-box;
  z-index: 100;
  top: 0;
  height: var(--header-height);
  left: 0;
  right: 0;
  background-color: var(--card-bg);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom: var(--border) 1px solid;
  transition: var(--color-transition);
}

.layout-container {
  position: fixed;
  box-sizing: border-box;
  z-index: 100;
  top: var(--header-height);
  left: var(--navbar-width);
  bottom: var(--footer-height);
  right: 0;
  background-color: var(--card-bg);
  transition: var(--color-transition);
  display: flex;
  flex-direction: row;

  .layout-left {
    width: 20rem;
    border-right: var(--border) 1px solid;
    transition: var(--color-transition);
  }

  .layout-main {
    flex: 1;
  }
}

</style>
