<template>
  <k-layout>
    <template #header>
      本地化
    </template>

    <template #left>
      <h3>语言</h3>
      <el-checkbox-group v-model="displayLocales">
        <template v-for="(_, locale) in store.locales" :key="locale">
          <el-checkbox v-if="locale && !locale.startsWith('$')" :label="locale">
            {{ locale }}
          </el-checkbox>
        </template>
      </el-checkbox-group>
    </template>

    <el-scrollbar>
      <div v-for="path in paths" :key="path">{{ path }}</div>
    </el-scrollbar>
  </k-layout>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'
import { computed, ref } from 'vue'

const displayLocales = ref([])

const paths = computed(() => {
  const result = {}
  for (const locale in store.locales) {
    if (!locale) continue
    Object.assign(result, store.locales[locale])
  }
  return Object.keys(result).filter(path => !path.includes('._'))
})

</script>
