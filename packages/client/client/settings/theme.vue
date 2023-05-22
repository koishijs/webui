<template>
  <k-content>
    <div class="theme-list">
      <template v-for="(_, key) in themes" :key="key">
        <div class="theme-item">
          <div class="theme-container">
            <div class="theme-root" :theme="key">
              <div class="theme-block-1"></div>
              <div class="theme-block-2"></div>
              <div class="theme-block-3"></div>
              <div class="theme-content">Koishi</div>
            </div>
          </div>
          <el-radio v-model="config.theme" :label="key"></el-radio>
        </div>
      </template>
    </div>
  </k-content>
</template>

<script lang="ts" setup>

import { config, themes } from '..'

</script>

<style lang="scss" scoped>

.theme-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
}

.theme-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;

  .el-radio {
    justify-content: center;
  }
}

.theme-container {
  border: 1px solid var(--k-color-border);
}

.theme-root {
  width: 320px;
  height: 240px;
  position: relative;

  .theme-block-1 {
    position: absolute;
    width: 33%;
    height: 100%;
    background-color: var(--bg1);
  }

  .theme-block-2 {
    position: absolute;
    left: 33%;
    width: 34%;
    height: 100%;
    background-color: var(--bg2);
  }

  .theme-block-3 {
    position: absolute;
    left: 67%;
    width: 33%;
    height: 100%;
    background-color: var(--bg3);
  }

  .theme-content {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: var(--fg1);
    z-index: 100;
  }
}

</style>
