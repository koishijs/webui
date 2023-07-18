<template>
  <k-layout class="page-instances">
    <el-scrollbar>
      <div class="container first">
        <instance v-bind="instances[data.current]" :id="data.current"/>
        <el-button class="k-card create" @click="activate(null, $event)">
          <k-icon name="plus"></k-icon>
        </el-button>
      </div>
      <div class="container second" v-if="inactive.length">
        <template v-for="([key, value]) in inactive" :key="key">
          <instance v-if="data.current !== key" v-bind="value" :id="key"/>
        </template>
      </div>
    </el-scrollbar>
  </k-layout>
</template>

<script lang="ts" setup>

import Instance from './instance.vue'
import { computed } from 'vue'
import { activate, data, instances } from '../utils'

const inactive = computed(() => {
  return Object.entries(instances.value)
    .filter(([id]) => id !== data.value.current)
    .sort(([, a], [, b]) => b.lastVisit - a.lastVisit)
})

</script>

<style lang="scss">

.page-instances .el-scrollbar__view {
  padding: 3rem 0;
  max-width: 64rem;
  min-height: 100%;
  margin: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .container {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    align-items: center;
  }

  .container.first {
    justify-content: center;
  }

  .container.second {
    margin-top: 2rem;
    border-top: 1px solid var(--k-color-border);
    padding-top: 2rem;
  }

  .k-card.create {
    border-radius: 8px;

    .k-icon {
      font-size: 4rem;
      color: var(--k-color-border);
      transition: 0.3s ease;
    }

    &:hover .k-icon {
      color: var(--k-color-primary);
    }
  }

  .k-card {
    width: 20rem;
    height: 200px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
}

</style>
