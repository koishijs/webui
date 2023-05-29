<template>
  <el-dialog
    v-if="store.packages"
    :modelValue="!!select"
    @update:modelValue="select = null"
    class="plugin-select"
  >
    <template #header>
      <slot name="title" :packages="packages">
        <span class="title">选择插件</span>
      </slot>
      <el-input ref="input" v-model="keyword" #suffix>
        <k-icon name="search"></k-icon>
      </el-input>
    </template>
    <slot name="tabs" :packages="packages"></slot>
    <div class="content">
      <el-scrollbar>
        <div class="package" v-for="({ name, shortname, manifest }) in packages" :key="name" @click.stop="configure(shortname)">
          <h3>{{ shortname }}</h3>
          <k-markdown inline class="desc" :source="tt(manifest.description)"></k-markdown>
        </div>
      </el-scrollbar>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>

import { router, send, store, useI18nText } from '@koishijs/client'
import { computed, inject, nextTick, ref, watch } from 'vue'
import { PackageProvider } from '@koishijs/plugin-config'
import { select } from './utils'

const tt = useI18nText()

const keyword = ref('')
const input = ref()

const filter = inject('plugin-select-filter', (data: PackageProvider.Data) => true)

const packages = computed(() => Object.values(store.packages).filter(({ name, shortname }) => {
  return name && shortname.includes(keyword.value.toLowerCase()) && filter(store.packages[name])
}))

function configure(shortname: string) {
  let path = select.value.path
  select.value = null
  if (path) path += '/'
  path += shortname + ':' + Math.random().toString(36).slice(2, 8)
  send('manager/unload', path, {})
  router.push('/plugins/' + path)
}

watch(select, async (value) => {
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
    border-bottom: 1px solid var(--k-color-divider);
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
      border-right: 1px solid var(--k-color-divider);
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
          background-color: var(--k-hover-bg);
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
          background-color: var(--k-hover-bg);
        }
      }
    }
  }
}

</style>
