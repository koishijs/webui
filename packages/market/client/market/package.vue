<template>
  <section class="k-card market-view">
    <div class="header">
      <div class="left">
        <k-icon :name="'category:' + resolveCategory(data.manifest.category)"></k-icon>
      </div>
      <div class="right">
        <h2>
          {{ data.shortname }}
          <a v-if="data.links.homepage" :href="data.links.homepage" target="_blank" rel="noopener noreferrer">
            <k-icon name="link"></k-icon>
          </a>
        </h2>
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
        <k-button v-if="!store.packages[data.name]" solid class="right" @click="$emit('click')">添加</k-button>
        <k-button v-else type="success" solid class="right" @click="$emit('click')">修改</k-button>
      </div>
    </div>
    <k-markdown inline class="desc" :source="meta.manifest.description.zh || meta.manifest.description.en"></k-markdown>
    <div class="footer">
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
    </div>
  </section>
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

const categories = ['game', 'business']

function resolveCategory(name: string) {
  if (categories.includes(name)) return name
  return 'other'
}

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
  height: 13rem;
  margin: 0;
  padding: 1.25rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .header, .footer {
    flex: 0 0 auto;
  }

  .header {
    position: relative;
    display: flex;
    gap: 1rem;

    .left {
      width: 4rem;
      height: 4rem;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        height: 1.75rem;
      }
    }

    .right {
      display: flex;
      flex-flow: column;
      justify-content: space-around;

      .badges {
        height: 1.5rem;
      }
    }

    h2 {
      font-size: 1.125rem;
      margin: 0;
      line-height: 1;
    }

    .right .k-icon {
      color: var(--fg1);
      margin-left: 0.6rem;
      height: 0.875rem;
      transition: color 0.3s ease;
    }

    button.right {
      position: absolute;
      right: 0;
      top: -3px;
      padding: 0.35em 0.85em;
    }
  }

  .desc {
    margin: 0;
    font-size: 15px;
    flex: 1 1 auto;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 1.5rem;
    margin-bottom: -0.25rem;

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
