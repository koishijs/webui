<template>
  <div class="chat-message">
    <div class="avatar">{{ data.user[0] }}</div>
    <div class="nickname">{{ data.user }}</div>
    <div class="message-box" @contextmenu.stop="trigger($event, data)">
      <blockquote class="quote" v-if="data.quote">
        <span class="abstract">
          <message-content :content="data.quote.content"/>
        </span>
      </blockquote>
      <message-content :content="data.content"/>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { Message } from '@koishijs/plugin-sandbox'
import { useMenu } from '@koishijs/client'
import { MessageContent } from '@satorijs/components-vue'

defineProps<{
  data: Message
}>()

const trigger = useMenu('sandbox.message')

</script>

<style lang="scss" scoped>

.chat-message {
  --avatar-size: 2.8rem;

  margin: 1rem 1.5rem;
  position: relative;

  @media screen and (max-width: 768px) {
    margin: 1rem 1rem;
  }

  .nickname {
    position: relative;
    margin: 0 0 0.4rem 4.2rem;
    font-weight: 700;
    font-size: .9rem;
  }

  .avatar {
    position: absolute;
  }

  .message-box {
    position: relative;
    margin-left: 4.2rem;
    padding: 0.5rem 0.7rem;
    width: fit-content;
    border-radius: 0.5rem;
    background-color: var(--k-side-bg);
    word-break: break-all;
    transition: background-color ease .3s;

    &::before {
      content: "";
      position: absolute;
      right: 100%;
      top: 0;
      width: 12px;
      height: 12px;
      border: 0 solid transparent;
      border-bottom-width: 8px;
      border-bottom-color: currentColor;
      border-radius: 0 0 0 32px;
      color: var(--k-side-bg);
      transition: color ease .3s;
    }

    .quote {
      font-size: 0.9rem;
      margin: 0 0 0.2rem;
      background-color: #f3f6f9;
      border: none;
      border-radius: 0.5rem;
      padding: 0.2rem 0.6rem;
      background-color: var(--k-card-bg);
      opacity: 0.5;
    }
  }
}

</style>
