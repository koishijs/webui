<template>
  <div class="layout-container" :class="[container, { 'has-left-aside': $slots.left, 'has-right-aside': $slots.right }]">
    <aside class="layout-left" :class="left" v-if="$slots.left">
      <slot name="left"></slot>
    </aside>

    <div class="main-container">
      <div class="aside-mask" @click="isLeftAsideOpen = !isLeftAsideOpen"></div>
      <layout-header>
        <template #left>
          <slot name="header">{{ route.meta.activity?.name }}</slot>
        </template>
        <template #right>
          <slot name="menu">
            <el-tooltip v-for="{ icon, label, type, disabled, action } in menu || []" :disabled="!!disabled" :content="label" placement="bottom">
              <span class="menu-item" :class="[type, { disabled }]" @click="action()">
                <k-icon class="menu-icon" :name="icon"></k-icon>
              </span>
            </el-tooltip>
          </slot>
        </template>
      </layout-header>
      <main class="layout-main" :class="main">
        <slot></slot>
      </main>
    </div>

    <aside class="layout-right" :class="right" v-if="$slots.right">
      <slot name="right"></slot>
    </aside>
  </div>
</template>

<script lang="ts" setup>

import { useRoute } from 'vue-router'
import { isLeftAsideOpen } from './utils'
import LayoutHeader from './layout-header.vue'

export interface MenuItem {
  icon: string
  label: string
  type?: string
  disabled?: boolean
  action?: Function
}

defineProps<{
  main?: string
  left?: string
  right?: string
  container?: string
  menu?: MenuItem[]
}>()

const route = useRoute()

</script>

<style lang="scss">

.layout-container {
  position: fixed;
  box-sizing: border-box;
  z-index: 100;
  top: 0;
  left: var(--activity-width);
  bottom: var(--footer-height);
  right: 0;
  background-color: var(--card-bg);
  transition: var(--color-transition);
  display: flex;
  flex-direction: row;

  .layout-left {
    top: 0;
    bottom: 0;
    flex: 0 0 auto;
    position: relative;
    width: var(--aside-width);
    border-right: var(--k-color-divider-dark) 1px solid;
    transition: var(--color-transition);
    background-color: var(--k-side-bg);
    box-sizing: border-box;
  }

  .main-container {
    position: relative;
    flex: 1;
    transition: left 0.3s ease;
    background-color: var(--k-main-bg);
    min-height: 100%;
    display: flex;
    flex-flow: column;

    &.darker {
      background-color: var(--k-side-bg);
    }

    .layout-main {
      flex: 1 1 auto;
      overflow: hidden;
      position: relative;
    }

    .aside-mask {
      pointer-events: none;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #000;
      opacity: 0;
      z-index: 300;
      transition: opacity 0.3s ease;

      .is-left-aside-open & {
        opacity: 0.25;
        pointer-events: auto;
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .layout-container {
    .layout-left {
      position: fixed;
      top: 0;
      left: var(--activity-width);
      bottom: 0;
    }

    .main-container {
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      bottom: 0;
    }
  }

  .is-left-aside-open .layout-container.has-left-aside {
    .main-container {
      left: calc(var(--aside-width) + var(--activity-width));
    }
  }

  .is-left-aside-open .layout-container:not(.has-left-aside) {
    .main-container {
      left: var(--activity-width);
    }
  }
}

</style>
