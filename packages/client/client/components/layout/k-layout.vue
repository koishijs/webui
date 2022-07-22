<template>
  <header class="layout-header">
    <div class="left">
      <slot name="header">{{ $route.name }}</slot>
    </div>
    <div class="right">
      <el-tooltip v-for="{ icon, label, disabled, action } in menu || []" :disabled="!!disabled" :content="label" placement="bottom">
        <span class="menu-item" :class="{ disabled }" @click="action()">
          <k-icon class="menu-icon" :name="icon"></k-icon>
        </span>
      </el-tooltip>
    </div>
  </header>

  <div class="layout-container" :class="container">
    <aside class="layout-left" :class="left" v-if="$slots.left">
      <slot name="left"></slot>
    </aside>
    <main class="layout-main" :class="main">
      <slot></slot>
    </main>
    <aside class="layout-right" :class="right" v-if="$slots.right">
      <slot name="right"></slot>
    </aside>
  </div>
</template>

<script lang="ts" setup>

export interface MenuItem {
  icon: string
  label: string
  disabled?: boolean
  action?: Function
}

defineProps<{
  main?: string
  left?: string
  right?: string
  container?: string
  containerClass?: string
  menu?: MenuItem[]
}>()

</script>

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
  font-weight: bolder;

  .left {
    margin-left: var(--navbar-width);
    padding-left: 1rem;
  }

  .right {
    margin-right: 0.5rem;
  }

  .menu-item {
    position: relative;
    width: 4rem;
    height: var(--header-height);
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--color-transition);

    &.disabled {
      opacity: 0.3;
      pointer-events: none;
    }

    .menu-icon {
      height: 1.125rem;
    }
  }
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
    overflow: hidden;

    &.darker {
      background-color: var(--bg1);
    }
  }
}

</style>
