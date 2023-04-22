<template>
  <k-layout class="page-sandbox">
    <template #left>
      <div class="card-header k-menu-item" @click="createUser">添加用户</div>
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
        <k-form instant v-model="model" :schema="schema" :show-header="false"></k-form>
      </k-content>
      <template v-else :key="channel">
        <virtual-list :data="config.messages[channel] || []" #="data" pinned>
          <chat-message :data="data" @message-contextmenu="handleContextMenu($event, data)"></chat-message>
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

  <teleport to="body">
    <div ref="menu" class="message-context-menu" v-if="menuTarget">
      <div class="item" @click.prevent="deleteMessage(menuTarget)">
        删除消息
      </div>
      <div class="item" @click.prevent="quote = menuTarget, menuTarget = null">
        引用回复
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>

import { clone, message, send, Schema, store, ChatInput, VirtualList, deepEqual } from '@koishijs/client'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'
import { api, channel, config, words, panelTypes } from './utils'
import ChatMessage from './message.vue'
import { Message } from '../src'

const menuTarget = ref<Message>()
const menu = ref()

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
      input.value = list[index - 1].content
    }
  } else if (event.key === 'ArrowDown') {
    const list = config.value.messages[channel.value].filter(item => item.user === config.value.user)
    let index = list.length - offset.value
    if (list[index + 1]) {
      offset.value--
      input.value = list[index + 1].content
    } else if (offset.value) {
      offset.value = 0
      input.value = ''
    }
  }
}

const model = ref()

watch(() => store.sandbox?.[config.value.user], (value) => {
  model.value = clone(value)
}, { immediate: true })

watch(model, (value) => {
  if (deepEqual(value, store.sandbox?.[config.value.user])) return
  send('sandbox/set-user', config.value.platform, config.value.user, value)
}, { deep: true })

function sendMessage(content: string) {
  offset.value = 0
  send('sandbox/send-message', config.value.platform, config.value.user, channel.value, content, quote.value)
  quote.value = null
}

async function handleContextMenu(event: MouseEvent, data: Message) {
  event.preventDefault()
  menuTarget.value = data
  await nextTick()
  const { clientX, clientY } = event
  menu.value.style.left = clientX + 'px'
  menu.value.style.top = clientY + 'px'
}

useEventListener('click', () => {
  menuTarget.value = null
})

useEventListener('contextmenu', () => {
  menuTarget.value = null
})

async function deleteMessage(data: Message) {
  await send('sandbox/delete-message', data.platform, data.user, data.channel, data.id)
  menuTarget.value = null
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
    border-bottom: 1px solid var(--border);
  }

  .card-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border);

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
    border-bottom: 1px solid var(--border);

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
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow);
  transition: var(--color-transition);
  font-size: 14px;

  .item {
    user-select: none;
    padding: 0.25rem 1.5rem;
    cursor: pointer;
    transition: var(--color-transition);

    &:hover {
      background-color: var(--hover-bg);
    }
  }
}

</style>
