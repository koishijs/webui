<template>
  <section class="k-card market-view">
    <div class="header">
      <div class="left">
        <k-icon :name="'category:' + resolveCategory(data.manifest.category)"></k-icon>
      </div>
      <div class="right">
        <h2>
          <a :href="data.links.homepage" target="_blank" rel="noopener noreferrer">{{ data.shortname }}</a>
          <span class="verified" v-if="data.verified">
            <k-icon name="verified"></k-icon>
          </span>
        </h2>
        <el-tooltip :content="data.score.final.toFixed(3)" placement="right">
          <div class="rating">
            <k-icon v-for="(name, index) in formatRating(data.score.final)" :key="index" :name="name"></k-icon>
          </div>
        </el-tooltip>
        <template v-if="store.packages">
          <k-button v-if="store.packages[data.name]" type="success" solid class="right" @click="handleClick">修改</k-button>
          <k-button v-else :disabled="config.static" solid class="right" @click="handleClick">添加</k-button>
        </template>
      </div>
    </div>
    <k-markdown inline class="desc" :source="meta.manifest.description.zh || meta.manifest.description.en"></k-markdown>
    <div class="footer">
      <div class="info">
        <a :href="data.links.npm" target="_blank" rel="noopener noreferrer">
          <k-icon name="tag"></k-icon>{{ data.version }}
        </a>
        <a v-if="data.installSize" :href="data.links.size" target="_blank" rel="noopener noreferrer">
          <k-icon name="file-archive"></k-icon>{{ formatSize(data.installSize) }}
        </a>
        <span v-if="data.downloads">
          <k-icon name="download"></k-icon>{{ data.downloads.lastMonth }}
        </span>
        <span v-if="!data.installSize && !data.downloads">
          <k-icon name="balance"></k-icon>{{ data.license }}
        </span>
      </div>
      <div class="avatars">
        <el-tooltip v-for="({ email, username }) in data.maintainers" :key="email" :content="username">
          <a @click="$emit('query', 'email:' + email)">
            <img :src="getAvatar(email)">
          </a>
        </el-tooltip>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>

import { computed, PropType } from 'vue'
import { AnalyzedPackage } from '@koishijs/registry'
import { store, config } from '@koishijs/client'
import { active, getMixedMeta } from '../utils'
import md5 from 'spark-md5'

defineEmits(['query', 'click'])

const props = defineProps({
  data: {} as PropType<AnalyzedPackage>,
})

const meta = computed(() => getMixedMeta(props.data.name))

function handleClick() {
  active.value = props.data.name
}

const categories = ['console', 'game', 'business', 'storage', 'tool']

function resolveCategory(name: string) {
  if (categories.includes(name)) return name
  return 'other'
}

function formatRating(value: number) {
  value = (value - 0.3) * 10
  return Array(5).fill(null).map((_, index) => {
    return index < value ? 'star-full' : 'star-empty'
  })
}

function getAvatar(email: string) {
  return (store.market.gravatar || 'https://s.gravatar.com') + '/avatar/' + md5.hash(email) + '?d=mp'
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
  height: 12.5rem;
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
      width: 3.5rem;
      height: 3.5rem;
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
    }

    h2 {
      font-size: 1.125rem;
      margin: 0;
      line-height: 1;

      .verified {
        margin-left: 0.6rem;
        height: 1.125rem;
        width: 1.125rem;
        vertical-align: -2px;
        position: relative;
        display: inline-block;

        .k-icon {
          color: var(--success);
          height: 100%;
          transition: color 0.3s ease;
          z-index: 10;
          position: relative;
        }

        &::before {
          position: absolute;
          top: 25%;
          left: 25%;
          right: 25%;
          bottom: 25%;
          content: '';
          z-index: 0;
          border-radius: 100%;
          background-color: white;
        }
      }
    }

    .rating {
      height: 1rem;
      display: flex;
      align-items: center;
      gap: 0 0.25rem;
      width: fit-content;

      .k-icon {
        color: var(--warning);
        height: 0.875rem;
        transition: color 0.3s ease;
      }
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
    gap: 0 1.5rem;
    margin-bottom: -0.25rem;
    cursor: default;

    .info {
      font-size: 14px;
      color: var(--el-text-color-regular);
      transition: color 0.3s ease;
      display: flex;
      gap: 1.5rem;

      .k-icon {
        height: 12px;
        width: 16px;
        margin-right: 6px;
        vertical-align: -1px;
      }
    }

    .avatars {
      display: flex;
      gap: 0.25rem;

      a {
        cursor: pointer;
      }

      img {
        height: 1.5rem;
        width: 1.5rem;
        border-radius: 100%;
        vertical-align: middle;
      }
    }
  }
}

</style>
