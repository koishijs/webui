<template>
  <k-comment type="danger">
    <p>
      <span>此插件尚未安装，</span>
      <span v-if="fullname" class="k-link" @click="active = fullname">点击快速安装</span>
      <span v-else class="k-link" @click="gotoMarket">点击前往插件市场</span>
      <span>。</span>
    </p>
  </k-comment>
</template>

<script setup lang="ts">

import { computed, inject, WritableComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '@koishijs/client'
import { active } from '../utils'

const router = useRouter()

const current = inject<WritableComputedRef<any>>('manager.settings.current')

const fullname = computed(() => {
  const { name } = current.value
  const candidates = name.startsWith('@')
    ? [name.replace(/\//, '/koishi-plugin-')]
    : [`@koishijs/plugin-${name}`, `koishi-plugin-${name}`]
  return candidates.find(name => name in store.market.data)
})

function gotoMarket() {
  router.push('/market?keyword=' + current.value.name)
}

</script>
