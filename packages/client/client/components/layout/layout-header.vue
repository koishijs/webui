<template>
  <div class="layout-header">
    <div class="toggle-sidebar-button" role="button" tabindex="0" @click="isLeftAsideOpen = !isLeftAsideOpen">
      <div class="icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    <div class="left">
      <slot name="left">{{ $route.name }}</slot>
    </div>
    <div class="right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { isLeftAsideOpen } from './utils'

</script>

<style lang="scss">

@import '../style.scss';

.toggle-sidebar-button {
  position: absolute;
  top: 0;
  height: 100%;
  left: 1rem;
  display: none;
  cursor: pointer;
}

.toggle-sidebar-button .icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 1.25rem;
  height: 100%;
  cursor: inherit;

  span {
    display: inline-block;
    width: 100%;
    height: 2px;
    border-radius: 2px;
    background-color: var(--fg1);
    transition: transform 0.3s ease;

    &:nth-child(2) {
      margin: 6px 0;
    }
  }
}

@media screen and (max-width: 768px) {
  .toggle-sidebar-button {
    display: block;
  }
}

.layout-header {
  position: relative;
  box-sizing: border-box;
  height: var(--header-height);
  flex: 0 0 auto;
  background-color: inherit;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom: var(--border) 1px solid;
  transition: var(--color-transition);
  font-weight: bolder;

  .left {
    margin-left: var(--header-height);
    padding-left: 0.5rem;
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

    &.spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    &.disabled {
      opacity: 0.3;
      pointer-events: none;

      @media screen and (max-width: 768px) {
        display: none;
      }
    }

    .menu-icon {
      height: 1.125rem;
    }

    @media screen and (max-width: 768px) {
      width: 3rem;
    }
  }
}

</style>
