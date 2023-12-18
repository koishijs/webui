<template>
  <div class="layout-container" :class="[container, styles]">
    <aside class="layout-aside layout-left" :class="left" v-if="$slots.left">
      <slot name="left"></slot>
    </aside>

    <div class="main-container">
      <div class="aside-mask" @click="isLeftAsideOpen = !isLeftAsideOpen"></div>
      <layout-header v-model:isLeftAsideOpen="isLeftAsideOpen" v-model:isRightAsideOpen="isRightAsideOpen">
        <template #left>
          <slot name="header">{{ route.meta.activity?.name }}</slot>
        </template>
        <template #right>
          <slot name="menu">
            <template v-if="typeof menu === 'string'">
              <template v-for="item in ctx.internal.menus[menu]" :key="menu">
                <layout-menu-item
                  v-if="item.id !== '@separator'"
                  :item="{ ...item, ...ctx.internal.actions[item.id.startsWith('.') ? menu + item.id : item.id] }"
                  :menu-key="menu" :menu-data="menuData"
                />
              </template>
            </template>
            <template v-else>
              <layout-menu-item v-for="item in menu" :item="item" />
            </template>
          </slot>
        </template>
      </layout-header>
      <main class="layout-main" :class="main">
        <slot></slot>
      </main>
    </div>

    <aside class="layout-aside layout-right" :class="right" v-if="$slots.right">
      <slot name="right"></slot>
    </aside>
  </div>
</template>

<script lang="ts" setup>

import { computed, ref, useSlots } from 'vue'
import { useRoute } from 'vue-router'
import { LegacyMenuItem, useContext } from '@koishijs/client'
import LayoutHeader from './header.vue'
import LayoutMenuItem from './menu-item.vue'

defineProps<{
  main?: string
  left?: string
  right?: string
  container?: string
  menu?: string | LegacyMenuItem[]
  menuData?: any
}>()

const slots = useSlots()
const route = useRoute()
const ctx = useContext()

const isLeftAsideOpen = ref(false)
const isRightAsideOpen = ref(false)

const styles = computed(() => ({
  'has-left-aside': slots.left,
  'has-right-aside': slots.right,
  'is-left-aside-open': isLeftAsideOpen.value,
  'is-right-aside-open': isRightAsideOpen.value,
}))

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
  background-color: var(--k-card-bg);
  transition: var(--color-transition);
  display: flex;
  flex-direction: row;

  .layout-aside {
    top: 0;
    bottom: 0;
    flex: 0 0 auto;
    position: relative;
    width: var(--aside-width);
    transition: var(--color-transition);
    background-color: var(--k-side-bg);
    box-sizing: border-box;
  }

  .layout-right {
    border-left: var(--k-color-divider-dark) 1px solid;
  }

  .layout-left {
    border-right: var(--k-color-divider-dark) 1px solid;
  }

  .main-container {
    position: relative;
    flex: 1;
    transition: left 0.3s ease;
    background-color: var(--k-main-bg);
    min-height: 100%;
    display: flex;
    flex-flow: column;
    overflow: hidden;

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

    &.is-left-aside-open {
      &.has-left-aside {
        .main-container {
          left: calc(var(--aside-width) + var(--activity-width));
        }
      }

      &:not(.has-left-aside) {
        .main-container {
          left: var(--activity-width);
        }
      }

      .aside-mask {
        opacity: 0.25;
        pointer-events: auto;
      }
    }
  }
}

</style>
