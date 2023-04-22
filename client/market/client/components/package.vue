<template>
  <a class="market-package" target="_blank" :href="homepage">
    <div class="header">
      <div class="left">
        <market-icon :name="'outline:' + resolveCategory(data.category)"></market-icon>
      </div>
      <div class="main">
        <h2 class="top">
          <span class="title">{{ data.shortname }}</span>
          <el-tooltip v-if="badge" placement="right" :content="badge.text">
            <span :class="['icon', badge.type]" @click.stop.prevent="$emit('query', badge.query)">
              <market-icon :name="badge.type"></market-icon>
            </span>
          </el-tooltip>
        </h2>
        <div class="bottom">
          <el-tooltip :content="Math.max(Math.min(data.rating ?? 0, 5), 0).toFixed(1)" placement="right">
            <div class="rating">
              <market-icon v-for="(_, index) in Array(5).fill(null)" :key="index" :name="index + 0.5 < data.rating ? 'star-full' : 'star-empty'"></market-icon>
            </div>
          </el-tooltip>
        </div>
      </div>
      <div class="right">
        <slot name="action"></slot>
      </div>
    </div>
    <k-markdown inline class="desc" :source="data.manifest.description.zh || data.manifest.description.en"></k-markdown>
    <div class="footer">
      <el-tooltip :content="timeAgo(data.updatedAt)" placement="top">
        <a class="shrink" target="_blank" :href="data.links.npm">
          <market-icon name="tag"></market-icon>{{ data.version }}
        </a>
      </el-tooltip>
      <template v-if="data.installSize">
        <span class="spacer"></span>
        <a target="_blank" :href="data.links.size">
          <market-icon name="file-archive"></market-icon>{{ formatSize(data.installSize) }}
        </a>
      </template>
      <template v-if="data.downloads">
        <span class="spacer"></span>
        <span>
          <market-icon name="download"></market-icon>{{ data.downloads.lastMonth }}
        </span>
      </template>
      <template v-if="!data.installSize && !data.downloads">
        <span class="spacer"></span>
        <span>
          <market-icon name="balance"></market-icon>{{ data.license }}
        </span>
      </template>
      <span class="spacer grow"></span>
      <div class="avatars">
        <el-tooltip v-for="({ email, name }) in getUsers(data)" :key="name" :content="name" placement="top">
          <span class="avatar" @click.stop.prevent="$emit('query', 'email:' + email)">
            <img :src="getAvatar(email)">
          </span>
        </el-tooltip>
      </div>
    </div>
  </a>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { AnalyzedPackage } from '@koishijs/registry'
import { MarketConfig, badges, getUsers, resolveCategory, validate } from '@koishijs/ui-market'
import { timeAgo } from '../utils'
import MarketIcon from '../icons'
import * as md5 from 'spark-md5'

defineEmits(['query'])

const props = defineProps<{
  data: AnalyzedPackage
  config?: MarketConfig
  gravatar?: string
}>()

const homepage = computed(() => props.data.links.homepage || props.data.links.repository)

const badge = computed(() => {
  for (const type in badges) {
    if (badges[type].hidden?.(props.config ?? {}, 'card')) continue
    if (validate(props.data, badges[type].query)) return { type, ...badges[type] }
  }
})

function getAvatar(email: string) {
  return (props.gravatar || 'https://s.gravatar.com')
    + '/avatar/'
    + (email ? (md5 as unknown as typeof import('spark-md5')).hash(email.toLowerCase()) : '')
    + '.png?d=mp'
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

<style lang="scss" scoped>

.cursor-pointer {
  cursor: pointer;
}

.market-package {
  width: 100%;
  max-width: 540px;
  height: calc(12.5rem + 2px);
  margin: 0;
  padding: 1rem 1.25rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.3s ease;
  box-shadow: 0 0 0 2px inset transparent;

  &:hover {
    box-shadow: 0 0 0 2px inset var(--k-color-active);
  }

  .market-icon {
    height: 1em;
    display: inline;
  }

  .header, .footer {
    flex: 0 0 auto;
  }

  .header {
    position: relative;
    display: flex;

    .left {
      flex: 0 0 auto;
      width: 3.5rem;
      height: 3.5rem;
      margin-right: 1rem;
      border-radius: 8px;
      border: 1px solid var(--k-color-border);
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        height: 1.75rem;
      }
    }

    .main {
      display: flex;
      flex-flow: column;
      justify-content: space-around;
      overflow: hidden;
    }

    h2 {
      font-size: 1.125rem;
      margin: 0;
      line-height: 1;
      display: flex;
      align-items: center;

      .title {
        flex: 0 1 auto;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        line-height: 1.5rem;
        display: inline-block;
      }

      .icon {
        margin-left: 0.6rem;
        height: 1.125rem;
        width: 1.125rem;
        vertical-align: -2px;
        position: relative;
        display: inline-block;
        cursor: pointer;

        .market-icon {
          height: 100%;
          transition: color 0.3s ease;
          z-index: 10;
          position: relative;
        }

        &.verified, &.newborn {
          color: var(--k-color-success);
        }

        &.preview {
          color: var(--k-color-warning);
        }

        &.insecure {
          color: var(--k-color-danger);
        }

        &.verified, &.insecure {
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
    }

    .rating {
      height: 1.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0 0.25rem;
      width: fit-content;

      .market-icon {
        color: var(--k-color-warning);
        height: 0.875rem;
        transition: color 0.3s ease;
      }
    }

    .right {
      flex: 1 0 auto;
      text-align: right;
      position: relative;
    }
  }

  .desc {
    margin: 0;
    font-size: 15px;
    flex: 1 1 auto;
    line-height: 1.5;
    overflow: hidden;
    word-break: break-word;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .footer {
    display: flex;
    align-items: center;
    height: 1.5rem;
    margin-bottom: -0.25rem;
    cursor: default;
    font-size: 14px;
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

    .market-icon {
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

      .avatar {
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
