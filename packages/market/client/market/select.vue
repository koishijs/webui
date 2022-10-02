<template>
  <el-dialog v-model="showSelect" class="plugin-select" :title="width <= 768 ? categories[active] : '选择插件'">
    <div class="tabs">
      <span class="tab-item" v-for="(text, key) in categories" :key="key" @click.stop="active = key" :class="{ active: active === key }">
        <k-icon :name="'category:' + (key || 'other')"></k-icon>
        <span class="title">{{ text }}</span>
      </span>
    </div>
    <div class="content">
      <el-scrollbar>
        <template v-for="({ name, shortname, manifest }) in store.packages">
          <div class="package" v-if="name && (!active || manifest.category === active)" @click.stop="configure(shortname)">
            <h3>{{ shortname }}</h3>
            <k-markdown inline class="desc" :source="manifest.description.zh || manifest.description.en"></k-markdown>
          </div>
        </template>
      </el-scrollbar>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>

import { router, send, store } from '@koishijs/client'
import { ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { showSelect } from '../utils'
import { categories } from './utils'

const active = ref('')
const { width } = useWindowSize()

function configure(path: string) {
  showSelect.value = false
  path += ':' + Math.random().toString(36).slice(2, 8)
  send('manager/unload', path, {})
  router.push('/plugins/' + path)
}

</script>

<style lang="scss">

.plugin-select {
  .el-dialog__header {
    margin-right: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);

    button {
      top: 2px;
    }
  }

  .el-dialog__body {
    display: flex;
    padding: 0;
    height: 50vh;

    .tabs {
      // padding 2rem
      // icon 1.5rem
      // text 4rem
      // gap 0.5rem
      width: 8rem;
      border-right: 1px solid var(--border);
      font-size: 15px;
      flex: 0 0 auto;

      @media screen and (max-width: 768px) {
        // padding 2rem
        // icon 1.5rem
        width: 3.5rem;
      }

      .tab-item {
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 1rem;
        cursor: pointer;

        .k-icon {
          width: 1.5rem;
          height: 1.125rem;
        }

        &.active {
          color: var(--primary);
        }

        .title {
          margin-left: 0.5rem;
          @media screen and (max-width: 768px) {
            display: none;
          }
        }
      }
    }

    .content {
      flex: 1 1 auto;

      .package {
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: var(--color-transition);

        h3 {
          font-size: 16px;
          margin: 0;
          margin-bottom: 0.25rem;
        }

        p {
          margin: 0;
          font-size: 14px;
        }

        &:hover {
          background-color: var(--bg2);
        }
      }
    }
  }
}

</style>
