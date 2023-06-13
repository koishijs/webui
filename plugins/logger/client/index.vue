<template>
  <k-layout>
    <el-scrollbar class="container">
      <div ref="root" class="logs">
        <div
          v-for="(record, index) in store.logs"
          :key="record.id"
          class="line" :class="{ start: index && store.logs[index - 1].id > record.id && record.name === 'app' }">
          <code v-html="renderLine(record)"></code>
        </div>
      </div>
    </el-scrollbar>
  </k-layout>
</template>

<script lang="ts" setup>

import { watch, ref, nextTick, onActivated } from 'vue'
import type { Logger } from 'koishi'
import { store, Time } from '@koishijs/client'
import ansi from 'ansi_up'

const root = ref<HTMLElement>()

// this package does not have consistent exports in different environments
const converter = new (ansi['default'] || ansi)()

function renderColor(code: number, value: any, decoration = '') {
  return `\u001b[3${code < 8 ? code : '8;5;' + code}${decoration}m${value}\u001b[0m`
}

function colorCode(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 3) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return c256[Math.abs(hash) % c256.length]
}

const showTime = 'yyyy-MM-dd hh:mm:ss'

const c256 = [
  20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62,
  63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113,
  129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168,
  169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200,
  201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221,
]

function renderLine(record: Logger.Record) {
  const prefix = `[${record.type[0].toUpperCase()}]`
  const space = ' '
  let indent = 3 + space.length, output = ''
  indent += showTime.length + space.length
  output += renderColor(8, Time.template(showTime)) + space
  const code = colorCode(record.name)
  const label = renderColor(code, record.name, ';1')
  const padLength = label.length - record.name.length
  output += prefix + space + label.padEnd(padLength) + space
  output += record.content.replace(/\n/g, '\n' + ' '.repeat(indent))
  return converter.ansi_to_html(output)
}

onActivated(() => {
  const wrapper = root.value.parentElement.parentElement
  wrapper.scrollTop = wrapper.scrollHeight
})

watch(() => store.logs.length, async () => {
  const wrapper = root.value.parentElement.parentElement
  const { scrollTop, clientHeight, scrollHeight } = wrapper
  if (Math.abs(scrollTop + clientHeight - scrollHeight) < 1) {
    await nextTick()
    wrapper.scrollTop = scrollHeight
  }
})

</script>

<style lang="scss" scoped>

.container {
  color: var(--terminal-fg);
  background-color: var(--terminal-bg);

  .logs {
    padding: 1rem 1rem;
  }

  .logs .line.start {
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

  .logs:first-child .line:first-child {
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
