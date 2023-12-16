<template>
  <k-layout :main="`darker page-home${socket ? '' : ' loading'}`">
    <el-scrollbar v-if="socket">
      <k-slot name="home">
        <k-slot-item :order="1000">
          <welcome></welcome>
        </k-slot-item>
      </k-slot>
    </el-scrollbar>
    <div v-else>
      <k-card class="connect">{{ global.messages?.connecting || '正在连接到 Koishi 服务器……' }}</k-card>
    </div>
  </k-layout>
</template>

<script lang="ts" setup>

import { global, socket } from '@koishijs/client'
import Welcome from './welcome.vue'

</script>

<style lang="scss">

.page-home {
  &.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .k-card.welcome {
    margin: var(--card-margin);
  }

  .k-card-body {
    margin: var(--card-padding-vertical) 0;
    padding: 0 var(--card-padding-horizontal);
  }

  .k-card.connect {
    width: 400px;
    max-width: 400px;
    text-align: center;
    line-height: 2;

    p {
      margin: 0;
    }
  }
}

</style>
