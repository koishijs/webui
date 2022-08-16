<template>
  <k-card class="market-view">
    <template #header>
      {{ data.shortname }}
      <a v-if="data.links.homepage" :href="data.links.homepage" target="_blank" rel="noopener noreferrer">
        <k-icon name="link"></k-icon>
      </a>
      <k-button v-if="!store.packages[data.name]" solid class="right" @click="$emit('click')">添加</k-button>
      <k-button v-else type="success" solid class="right" @click="$emit('click')">修改</k-button>
    </template>
    <k-markdown inline class="desc" :source="meta.manifest.description.zh || meta.manifest.description.en"></k-markdown>
    <div class="badges">
      <k-badge type="success"
        v-if="data.official"
        @click="$emit('query', 'is:official')"
      >官方</k-badge>
      <k-badge type="primary"
        v-if="meta.manifest.service.implements.includes('database')"
        @click="$emit('query', 'impl:database')"
      >数据库</k-badge>
      <k-badge type="primary"
        v-if="meta.manifest.service.implements.includes('adapter')"
        @click="$emit('query', 'impl:adapter')"
      >适配器</k-badge>
      <k-badge type="primary"
        v-if="meta.manifest.service.implements.includes('manifestassets')"
        @click="$emit('query', 'impl:assets')"
      >资源存储</k-badge>
      <k-badge type="primary"
        v-if="meta.manifest.service.required.includes('console') || meta.manifest.service.optional.includes('console')"
        @click="$emit('query', 'using:console')"
      >控制台</k-badge>
    </div>
    <template #footer>
      <div class="info">
        <span><k-icon name="tag"></k-icon>{{ data.version }}</span>
        <span v-if="data.installSize"><k-icon name="file-archive"></k-icon>{{ formatSize(data.installSize) }}</span>
        <span><k-icon name="balance"></k-icon>{{ data.license }}</span>
      </div>
      <div class="avatars">
        <el-tooltip v-for="({ email, avatar, username }) in data.maintainers" :key="email" :content="username">
          <a @click="$emit('query', 'email:' + email)">
            <img :src="avatar">
          </a>
        </el-tooltip>
      </div>
    </template>
  </k-card>
</template>

<script lang="ts" setup>

import { computed, PropType } from 'vue'
import { MarketProvider } from '@koishijs/plugin-market'
import { store } from '@koishijs/client'
import { getMixedMeta } from '../utils'

defineEmits(['query', 'click'])

const props = defineProps({
  data: {} as PropType<MarketProvider.Data>,
})

const meta = computed(() => getMixedMeta(props.data.name))

function formatValue(value: number) {
  return value >= 100 ? +value.toFixed() : +value.toFixed(1)
}

function formatSize(value: number) {
  if (value >= (1 << 20) * 1000) {
    return formatValue(value / (1 << 30)) + ' GB'
  } else if (value >= (1 << 10) * 1000) {
    return formatValue(value / (1 << 20)) + ' MB'
  } else {
    return formatValue(value / (1 << 10)) + ' KB'
  }
}

</script>

<style lang="scss">

.market-view {
  width: 100%;
  max-width: 540px;
  height: 192px;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  header, footer {
    margin: 1rem 0;
    flex-shrink: 0;
  }

  .k-card-body {
    margin: -1rem 0;
    flex-grow: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
  }

  .desc {
    margin: 0;
    font-size: 15px;
  }

  header {
    font-size: 1.125rem;
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 1.5rem;

    .avatars a {
      cursor: pointer;
      margin-left: 4px;
    }

    .avatars img {
      height: 1.5rem;
      width: 1.5rem;
      border-radius: 100%;
      vertical-align: middle;
    }
  }

  header .k-icon {
    color: var(--fg1);
    margin-left: 0.6rem;
    height: 1rem;
    vertical-align: -1px;
    transition: color 0.3s ease;
  }

  button.right {
    position: absolute;
    right: 1rem;
    top: -3px;
    padding: 0.35em 0.85em;
  }

  .info {
    cursor: default;
    font-size: 14px;
    color: var(--el-text-color-regular);
    transition: color 0.3s ease;

    .pointer {
      cursor: pointer;
    }

    .k-icon {
      height: 12px;
      margin-right: 8px;
      vertical-align: -1px;
    }

    span + span {
      margin-left: 1.5rem;
    }
  }
}

</style>
