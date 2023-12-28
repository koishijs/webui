<template>
  <virtual-list class="log-list k-text-selectable" :data="logs" :count="300" :max-height="maxHeight">
    <template #="record">
      <div :class="{ line: true, start: isStart(record) }">
        <code v-html="renderLine(record)"></code>
        <router-link
          class="log-link inline-flex items-center justify-center absolute w-20px h-20px bottom-0 right-0"
          v-if="showLink && store.config && store.packages && record.meta?.paths?.length"
          :to="'/plugins/' + record.meta.paths[0].replace(/\./, '/')"
        >
          <k-icon name="arrow-right"/>
        </router-link>
      </div>
    </template>
  </virtual-list>
</template>

<script lang="ts" setup>

import { Time, store, VirtualList } from '@koishijs/client'
import {} from '@koishijs/plugin-config'
import Logger from 'reggol'
import ansi from 'ansi_up'

const props = defineProps<{
  logs: Logger.Record[],
  showLink?: boolean,
  maxHeight?: string,
}>()

// this package does not have consistent exports in different environments
const converter = new (ansi['default'] || ansi)()

function renderColor(code: number, value: any, decoration = '') {
  return `\u001b[3${code < 8 ? code : '8;5;' + code}${decoration}m${value}\u001b[0m`
}

const showTime = 'yyyy-MM-dd hh:mm:ss'

function isStart(record: Logger.Record & { index: number }) {
  return record.index && props.logs[record.index - 1].id > record.id && record.name === 'app'
}

function renderLine(record: Logger.Record) {
  const prefix = `[${record.type[0].toUpperCase()}]`
  const space = ' '
  let indent = 3 + space.length, output = ''
  indent += showTime.length + space.length
  output += renderColor(8, Time.template(showTime, new Date(record.timestamp))) + space
  const code = Logger.code(record.name, { colors: 3 })
  const label = renderColor(code, record.name, ';1')
  const padLength = label.length - record.name.length
  output += prefix + space + label.padEnd(padLength) + space
  output += record.content.replace(/\n/g, '\n' + ' '.repeat(indent))
  return converter.ansi_to_html(output)
}

</script>

<style lang="scss" scoped>

.log-list {
  color: var(--terminal-fg);
  background-color: var(--terminal-bg);

  :deep(.el-scrollbar__view) {
    padding: 1rem 1rem;
  }

  .line.start {
    margin-top: 1rem;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: -0.5rem;
      border-top: 1px solid var(--terminal-separator);
    }
  }

  .line:first-child {
    margin-top: 0;

    &::before {
      display: none;
    }
  }

  .line {
    padding: 0 0.5rem;
    border-radius: 2px;
    font-size: 14px;
    line-height: 20px;
    white-space: pre-wrap;
    word-break: break-all;
    position: relative;

    &:hover {
      color: var(--terminal-fg-hover);
      background-color: var(--terminal-bg-hover);
    }

    ::selection {
      background-color: var(--terminal-bg-selection);
    }
  }
}

</style>
