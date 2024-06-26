<template>
  <k-layout class="page-sandbox">
    <template #left>
      <div class="card-header k-tab-menu-item" @click="createUser">添加用户</div>
      <div class="user-container">
        <el-scrollbar>
          <k-tab-group :data="userMap" v-model="config.user" #="{ name }">
            <div class="avatar">{{ name[0] }}</div>
            <div class="nick">{{ name }}</div>
            <div class="close" @click="removeUser(name)">
              <k-icon name="times-full"></k-icon>
            </div>
          </k-tab-group>
        </el-scrollbar>
      </div>
    </template>

    <div class="card-header">
      <template v-for="(name, key) in panelTypes" :key="key">
        <span class="k-horizontal-tab-item"
          :class="{ active: config.panelType === key }"
          @click="config.panelType = key">{{ name }}</span>
      </template>
    </div>

    <keep-alive>
      <k-empty key="empty" v-if="!users.length">
        <div>点击「添加用户」开始体验</div>
      </k-empty>
      <k-content :key="'profile' + channel" v-else-if="config.panelType === 'profile'">
        <k-form v-if="user" :initial="user" v-model="model" :schema="schema" :show-header="false"></k-form>
      </k-content>
      <template v-else :key="channel">
        <virtual-list :data="config.messages[channel] || []" #="data" pinned>
          <chat-message :data="data"></chat-message>
        </virtual-list>
        <div class="card-footer">
          <div class="quote" v-if="quote">
            <span class="left">正在回复 @{{ quote.user }}</span>
            <k-icon name="times-full" @click="quote = null"></k-icon>
          </div>
          <chat-input v-model="input" @send="sendMessage" @keydown="onKeydown" placeholder="发送消息到沙盒"></chat-input>
        </div>
      </template>
    </keep-alive>
  </k-layout>
</template>

<script lang="ts" setup>

import { clone, message, send, Schema, VirtualList, deepEqual, useContext } from '@koishijs/client'
import { ChatInput } from '@satorijs/components-vue'
import segment from '@satorijs/element'
import { computed, ref, watch } from 'vue'
import { Message } from '@koishijs/plugin-sandbox'
import { api, channel, config, words, panelTypes } from './utils'
import ChatMessage from './message.vue'

const ctx = useContext()

ctx.action('sandbox.message.delete', {
  action: ({ sandbox }) => deleteMessage(sandbox.message),
})

ctx.action('sandbox.message.quote', {
  action: ({ sandbox }) => quote.value = sandbox.message,
})

const schema = Schema.object({
  authority: Schema.natural().description('权限等级'),
})

const users = computed(() => {
  return Object
    .keys(config.value.messages)
    .filter(key => key.startsWith('@'))
    .map((key) => key.slice(1))
})

const userMap = computed(() => {
  return Object.fromEntries(users.value.map((name) => [name, { name }]))
})

const length = 10

function createUser() {
  if (users.value.length >= length) {
    return message.error('可创建的用户数量已达上限。')
  }
  let name: string
  do {
    name = words[config.value.index++]
    config.value.index %= length
  } while (users.value.includes(name))
  config.value.user = name
  config.value.messages['@' + name] = []
  send('sandbox/set-user', config.value.platform, config.value.user, {})
}

function removeUser(name: string) {
  const index = users.value.indexOf(name)
  delete config.value.messages['@' + name]
  send('sandbox/set-user', config.value.platform, config.value.user, null)
  if (config.value.user === name) {
    config.value.user = users.value[index] || ''
  }
}

const input = ref('')
const offset = ref(0)
const quote = ref<Message>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp') {
    const list = config.value.messages[channel.value].filter(item => item.user === config.value.user)
    let index = list.length - offset.value
    if (list[index - 1]) {
      offset.value++
      input.value = segment.unescape(list[index - 1].content)
    }
  } else if (event.key === 'ArrowDown') {
    const list = config.value.messages[channel.value].filter(item => item.user === config.value.user)
    let index = list.length - offset.value
    if (list[index + 1]) {
      offset.value--
      input.value = segment.unescape(list[index + 1].content)
    } else if (offset.value) {
      offset.value = 0
      input.value = ''
    }
  }
}

const user = ref()
const model = ref()

watch(() => config.value.user, async (value) => {
  if (!value) return
  user.value = await send('sandbox/get-user', config.value.platform, config.value.user)
  model.value = clone(user.value)
}, { immediate: true })

watch(model, async (value) => {
  if (deepEqual(value, user.value)) return
  await send('sandbox/set-user', config.value.platform, config.value.user, value)
  user.value = clone(value)
}, { deep: true })

function sendMessage(content: string) {
  offset.value = 0
  send('sandbox/send-message', config.value.platform, config.value.user, channel.value, content, quote.value)
  quote.value = null
}

async function deleteMessage(data: Message) {
  await send('sandbox/delete-message', data.platform, data.user, data.channel, data.id)
  api.deleteMessage({ messageId: data.id, channelId: data.channel })
}

</script>

<style lang="scss">

.page-sandbox {
  --avatar-size: 2.5rem;

  aside, main {
    display: flex;
    flex-direction: column;
  }

  .avatar {
    border-radius: 100%;
    background-color: var(--primary);
    transition: 0.3s ease;
    width: var(--avatar-size);
    height: var(--avatar-size);
    line-height: var(--avatar-size);
    font-size: 1.25rem;
    text-align: center;
    font-weight: 400;
    color: #fff;
    font-family: Comic Sans MS;
    user-select: none;
  }

  .card-header {
    text-align: center;
    font-weight: bold;
    font-size: 1.15rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--k-color-divider);
  }

  .card-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--k-color-divider);

    .quote {
      opacity: 0.5;
      font-size: 14px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .k-icon {
        cursor: pointer;
      }
    }
  }

  .user-container {
    overflow-y: auto;
  }

  .k-tab-item {
    padding: 0.75rem 1.5rem;
    display: flex;
    border-bottom: 1px solid var(--k-color-divider);

    > .nick {
      line-height: 2.5rem;
      margin-left: 1.25rem;
      font-weight: 500;
      flex-grow: 1;
    }

    > .close {
      opacity: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      transition: opacity 0.3s ease;
      color: var(--fg1);
    }

    &:hover > .close {
      opacity: 0.5;
      &:hover {
        opacity: 1;
      }
    }
  }
}

.message-context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 12rem;
  padding: 0.5rem 0;
  border-radius: 4px;
  background-color: var(--k-card-bg);
  box-shadow: var(--k-card-shadow);
  transition: var(--color-transition);
  font-size: 14px;

  .item {
    user-select: none;
    padding: 0.25rem 1.5rem;
    cursor: pointer;
    transition: var(--color-transition);

    &:hover {
      background-color: var(--k-hover-bg);
    }
  }
}

</style>
