<template>
  <section class="k-card market-view">
    <div class="header">
      <div class="left">
        <k-icon :name="'category:' + resolveCategory(data.manifest.category)"></k-icon>
      </div>
      <div class="right">
        <h2>
          <a :href="data.links.homepage" target="_blank" rel="noopener noreferrer">{{ data.shortname }}</a>
          <el-tooltip v-if="data.verified" content="官方认证" placement="right">
            <span class="icon verified" @click="$emit('query', 'is:verified')">
              <k-icon name="verified"></k-icon>
            </span>
          </el-tooltip>
          <el-tooltip v-else-if="data.insecure" content="不安全" placement="right">
            <span class="icon insecure" @click="$emit('query', 'is:insecure')">
              <k-icon name="insecure"></k-icon>
            </span>
          </el-tooltip>
          <el-tooltip v-else-if="data.manifest.preview" content="开发中" placement="right">
            <span class="icon preview" @click="$emit('query', 'is:preview')">
              <k-icon name="preview"></k-icon>
            </span>
          </el-tooltip>
          <el-tooltip v-else-if="data.createdAt >= aWeekAgo" content="近期新增" placement="right">
            <span class="icon newborn" @click="$emit('query', 'after:' + aWeekAgo)">
              <k-icon name="newborn"></k-icon>
            </span>
          </el-tooltip>
        </h2>
        <el-tooltip :content="rating.toFixed(1)" placement="right">
          <div class="rating">
            <k-icon v-for="(_, index) in Array(5).fill(null)" :key="index" :name="index + 0.5 < rating ? 'star-full' : 'star-empty'"></k-icon>
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
      <a class="shrink" :href="data.links.npm" target="_blank" rel="noopener noreferrer">
        <k-icon name="tag"></k-icon>{{ data.version }}
      </a>
      <template v-if="data.installSize">
        <span class="spacer"></span>
        <a :href="data.links.size" target="_blank" rel="noopener noreferrer">
          <k-icon name="file-archive"></k-icon>{{ formatSize(data.installSize) }}
        </a>
      </template>
      <template v-if="data.downloads">
        <span class="spacer"></span>
        <span>
          <k-icon name="download"></k-icon>{{ data.downloads.lastMonth }}
        </span>
      </template>
      <template v-if="!data.installSize && !data.downloads">
        <span class="spacer"></span>
        <span>
          <k-icon name="balance"></k-icon>{{ data.license }}
        </span>
      </template>
      <span class="spacer grow"></span>
      <div class="avatars">
        <el-tooltip v-for="({ email, name }) in getUsers(data)" :key="name" :content="name">
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
import { getUsers, resolveCategory } from './utils'
import md5 from 'spark-md5'

const aWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

defineEmits(['query', 'click'])

const props = defineProps({
  data: {} as PropType<AnalyzedPackage>,
})

const meta = computed(() => getMixedMeta(props.data.name))

function handleClick() {
  active.value = props.data.name
}

const rating = computed(() => Math.min(Math.max((props.data.score.final - 0.25) * 10, 0), 5))

function getAvatar(email: string) {
  return (store.market.gravatar || 'https://s.gravatar.com')
    + '/avatar/'
    + (email ? md5.hash(email.toLowerCase()) : '')
    + '?d=mp'
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
  height: calc(12.5rem + 2px);
  margin: 0;
  padding: 1rem 1.25rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .header, .footer {
    flex: 0 0 auto;
  }

  .header {
    position: relative;
    display: flex;
    gap: 1rem;

    .left {
      flex: 0 0 auto;
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
      overflow: hidden;
    }

    h2 {
      font-size: 1.125rem;
      margin: 0;
      line-height: 1;
      padding-right: 4rem;
      display: flex;
      align-items: center;

      a {
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
        overflow: hidden;
        line-height: 1.5rem;
      }

      .icon {
        margin-left: 0.6rem;
        height: 1.125rem;
        width: 1.125rem;
        vertical-align: -2px;
        position: relative;
        display: inline-block;
        cursor: pointer;

        .k-icon {
          height: 100%;
          transition: color 0.3s ease;
          z-index: 10;
          position: relative;
        }
      }

      .verified, .newborn {
        color: var(--success);
      }

      .preview {
        color: var(--warning);
      }

      .insecure {
        color: var(--danger);
      }

      .verified, .insecure {
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
      height: 1.5rem;
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
      top: -1px;
      padding: 0.35em 0.85em;
    }
  }

  .desc {
    margin: 0;
    font-size: 15px;
    flex: 1 1 auto;
    line-height: 1.5;
  }

  .footer {
    display: flex;
    align-items: center;
    height: 1.5rem;
    margin-bottom: -0.25rem;
    cursor: default;
    font-size: 14px;
    color: var(--el-text-color-regular);
    transition: color 0.3s ease;
    display: flex;
    overflow: hidden;

    .spacer {
      flex: 0 5 1.5rem;
    }

    .grow {
      flex-grow: 1;
      flex-shrink: 1;
    }

    .k-icon {
      height: 12px;
      width: 16px;
      margin-right: 6px;
      vertical-align: -1px;
    }

    > * {
      flex: 0 0 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
