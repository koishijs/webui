<template>
  <el-dialog v-if="store.packages" v-model="showSelect" class="plugin-select">
    <template #header>
      <span class="title">{{ extended[active] }} ({{ packages.length }})</span>
      <el-input ref="input" v-model="keyword" #suffix>
        <k-icon name="search"></k-icon>
      </el-input>
    </template>
    <div class="tabs">
      <el-scrollbar>
        <span class="tab-item" v-for="(text, key) in extended" :key="key" @click.stop="active = key" :class="{ active: active === key }">
          <market-icon :name="'solid:' + key"></market-icon>
          <span class="title">{{ text }}</span>
        </span>
      </el-scrollbar>
    </div>
    <div class="content">
      <el-scrollbar>
        <div class="package" v-for="({ name, shortname, manifest }) in packages" :key="name" @click.stop="configure(shortname)">
          <h3>{{ shortname }}</h3>
          <k-markdown inline class="desc" :source="manifest.description.zh || manifest.description.en"></k-markdown>
        </div>
      </el-scrollbar>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>

import { router, send, store } from '@koishijs/client'
import { computed, nextTick, ref, watch } from 'vue'
import { showSelect } from '../utils'
import { categories, resolveCategory, MarketIcon } from '@koishijs/ui-market'
import { useRoute } from 'vue-router'

const extended = {
  all: '所有插件',
  other: '未分类',
  ...categories,
}

const active = ref('all')
const keyword = ref('')
const input = ref()

const route = useRoute()

const packages = computed(() => Object.values(store.packages).filter(({ name, shortname, manifest }) => {
  const category = store.market?.data[name]?.category || manifest?.category
  return name
    && shortname.includes(keyword.value)
    && (active.value === 'all' || resolveCategory(category) === active.value)
}))

function configure(shortname: string) {
  showSelect.value = false
  let path = route.path.slice(9)
  if (path) path += '/'
  path += shortname + ':' + Math.random().toString(36).slice(2, 8)
  send('manager/unload', path, {})
  router.push('/plugins/' + path)
}

watch(showSelect, async (value, oldValue) => {
  if (!value) return
  await nextTick()
  await input.value.focus()
}, { flush: 'post' })

</script>

<style lang="scss">

.plugin-select {
  .el-dialog__header {
    margin-right: 0;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;

    button {
      top: 2px;
    }

    .title {
      flex: 0 0 auto;
    }

    .el-input {
      display: inline-block;
      width: 220px;
      height: 2rem;
    }
  }

  .el-dialog__body {
    display: flex;
    padding: 0;
    height: 50vh;

    .tabs {
      width: 7.5rem;
      border-right: 1px solid var(--border);
      font-size: 15px;
      flex: 0 0 auto;

      @media screen and (max-width: 768px) {
        width: 3rem;
      }

      .el-scrollbar__view {
        padding: 0.5rem 0;
      }

      .tab-item {
        display: flex;
        align-items: center;
        height: 2rem;
        padding: 0 1rem;
        cursor: pointer;
        font-size: 0.875rem;
        justify-content: center;
        transition: var(--color-transition);

        &:hover {
          background-color: var(--bg2);
        }

        @media screen and (max-width: 768px) {
          padding: 0 0;
        }

        .market-icon {
          width: 1.25rem;
          height: 1rem;
        }

        &.active {
          color: var(--primary);
        }

        .title {
          width: 3.5rem;
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
