<template>
  <!-- navigation -->
  <div class="navigation" v-if="object">
    <a class="el-button" target="_blank"
      v-if="object.package.links.homepage"
      :href="object.package.links.homepage"
    >插件主页</a>
    <a class="el-button" target="_blank"
      v-if="object.package.links.npm && data.local.version"
      :href="object.package.links.npm + '/v/' + data.local.version"
    >当前版本：{{ data.local.version }}</a>
    <a class="el-button" target="_blank"
      v-if="object.package.links.repository"
      :href="object.package.links.repository"
    >存储库</a>
    <a class="el-button" target="_blank"
      v-if="object.package.links.bugs"
      :href="object.package.links.bugs"
    >问题反馈</a>
  </div>

  <!-- latest -->
  <k-comment v-if="hasUpdate && !global.static">
    <p>当前的插件版本不是最新，<router-link to="/dependencies">点击前往依赖管理</router-link>。</p>
  </k-comment>

  <!-- deprecated -->
  <k-comment v-if="versions?.[dep?.resolved]?.deprecated" type="danger">
    <p>此版本已废弃，请尽快迁移：{{ versions[dep.resolved].deprecated }}</p>
  </k-comment>

  <!-- external -->
  <k-comment type="warning" v-if="!data.local.workspace && store.dependencies && !store.dependencies[data.name]">
    <p>尚未将当前插件列入依赖，<span class="link" @click="send('market/install', { [data.name]: data.local.version })">点击添加</span>。</p>
  </k-comment>
</template>

<script lang="ts" setup>

import { global, send, store } from '@koishijs/client'
import { computed } from 'vue'
import { gt } from 'semver'
import { SettingsData } from '@koishijs/plugin-config/client'

const props = defineProps<{
  data: SettingsData
}>()

const object = computed(() => store.market.data?.[props.data.name])
const dep = computed(() => store.dependencies[props.data.name])
const versions = computed(() => store.registry[props.data.name])

const hasUpdate = computed(() => {
  if (!versions.value || props.data.local.workspace) return
  try {
    return gt(object.value.package.version, props.data.local.version)
  } catch {}
})

</script>

<style lang="scss" scoped>

.link {
  &:hover {
    cursor: pointer;
    text-decoration: underline;
  }
}

.navigation {
  margin-bottom: 2rem;
  display: flex;
  gap: 0.5rem 1rem;
  flex-wrap: wrap;
}

</style>
