<template>
  <k-content>
    <div class="theme-gallery">
      <template v-for="(_, key) in themes" :key="key">
        <div class="theme-item" @click="config.theme = key">
          <div class="theme-container">
            <div class="theme-root" :class="key.endsWith('-dark') ? 'dark' : 'light'" :theme="key">
              <div class="theme-block-1"></div>
              <div class="theme-block-2"></div>
              <div class="theme-block-3"></div>
              <div class="theme-content">
                <span class="active">Koi</span>
                <span class="normal">shi</span>
              </div>
            </div>
          </div>
          <el-radio :model-value="config.theme" :label="key">
            {{ tt(themes[key].name) }}
          </el-radio>
        </div>
      </template>
    </div>
  </k-content>
</template>

<script lang="ts" setup>

import { config, themes, useI18nText } from '..'

const tt = useI18nText()

</script>

<style lang="scss" scoped>

.theme-gallery {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
}

.theme-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  gap: 0.5rem;

  .el-radio {
    justify-content: center;
  }
}

.theme-container {
  border: 1px solid var(--k-color-border);
}

.theme-root {
  width: 240px;
  height: 180px;
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
    flex-direction: row;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    z-index: 100;
    font-weight: 500;
    letter-spacing: 1px;
    font-family: var(--font-family);

    span.normal {
      color: var(--k-text-dark);
    }

    span.active {
      color: var(--k-color-active);
    }
  }
}

</style>
