<template>
  <k-slot name="plugin-select-base">
    <template #title="{ packages }">
      <span class="title">{{ t(`category.${active}`) }} ({{ packages.length }})</span>
    </template>
    <template #tabs>
      <div class="tabs">
        <el-scrollbar>
          <span class="tab-item" v-for="key in extended" :key="key" @click.stop="active = key" :class="{ active: active === key }">
            <market-icon :name="'solid:' + key"></market-icon>
            <span class="title">{{ t(`category.${key}`) }}</span>
          </span>
        </el-scrollbar>
      </div>
    </template>
  </k-slot>
</template>

<script setup lang="ts">

import { store } from '@koishijs/client'
import { categories, MarketIcon, useMarketI18n, resolveCategory } from '@koishijs/market'
import { PackageProvider } from '@koishijs/plugin-config'
import { provide, ref } from 'vue'

const extended = ['all', 'other', ...categories]

const { t } = useMarketI18n()

const active = ref('all')

provide('plugin-select-filter', ({ name, manifest }: PackageProvider.Data) => {
  const category = store.market.data[name]?.category || manifest?.category
  return active.value === 'all' || resolveCategory(category) === active.value
})

</script>
