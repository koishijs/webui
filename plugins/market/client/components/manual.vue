<template>
  <el-dialog v-if="store.market?.registry" v-model="showManual" class="manual-panel" destroy-on-close>
    <template #header>高级：手动添加依赖</template>
    <k-comment type="warning">
      <p>提示：如果你想要安装插件，请前往<router-link to="/market">插件市场</router-link>页面。</p>
    </k-comment>
    <el-input :class="{ invalid }" v-model="name" @keydown.enter.stop.prevent="onEnter" placeholder="请输入名称"></el-input>
    <template v-if="remote">
      <p>最新版本：{{ remote['dist-tags']?.latest }}</p>
      <p>介绍：{{ remote.description }}</p>
    </template>
    <template #footer>
      <el-button @click="showManual = false">取消</el-button>
      <el-button type="primary" :disabled="invalid" @click="onEnter">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { computed, ref, watch } from 'vue'
import type { Registry } from '@koishijs/registry'
import { store } from '@koishijs/client'
import { useDebounceFn } from '@vueuse/core'
import { showManual, manualDeps } from './utils'
import { config } from '../utils'

const invalid = computed(() => false)

const name = ref('')

const remote = ref<Registry>()

const fetchRemote = useDebounceFn(async (name2: string) => {
  try {
    const response = await fetch(`${store.market.registry}/${name2}`)
    const data = await response.json()
    manualDeps[name2] = data
    if (name2 === name.value) remote.value = data
  } catch {}
}, 500)

watch(name, (name2) => {
  if (name2 !== remote.value?.name) remote.value = null
  if (!name2) return remote.value = null
  fetchRemote(name2)
})

function onEnter() {
  if (!remote.value) return
  const { name } = remote.value
  config.value.override[name] = remote.value['dist-tags'].latest
  showManual.value = false
}

</script>

<style lang="scss">

.manual-panel {
  .k-comment {
    margin-top: 0;
  }
}

</style>
