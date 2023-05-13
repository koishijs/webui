<template>
  <k-layout :main="`darker page-home${socket ? '' : ' loading'}`">
    <k-card v-if="global.unsupported">
      <p v-for="(line, index) in global.unsupported" :key="index">{{ line }}</p>
    </k-card>
    <el-scrollbar v-else-if="socket">
      <welcome></welcome>
      <k-slot name="home"></k-slot>
      <k-slot name="numeric" class="card-grid profile-grid"></k-slot>
      <k-slot name="chart" class="card-grid chart-grid"></k-slot>
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

.card-grid {
  display: grid;
  margin: var(--card-margin);
  grid-gap: var(--card-margin);
}

.profile-grid {
  grid-template-columns: repeat(3, 1fr);

  @media screen and (min-width: 1440px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media screen and (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.chart-grid {
  .echarts {
    max-width: 100%;
    margin: 0 auto;
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);

    @media (min-width: 1600px) {
      .echarts {
        width: 600px;
        height: 400px;
        max-width: 100%;
        margin: 0 auto;
      }
    }

    @media (max-width: 1600px) {
      .echarts {
        width: 480px;
        height: 360px;
      }
    }
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      .echarts {
        width: 800px;
        height: 400px;
      }
    }

    @media (max-width: 768px) {
      .echarts {
        width: 600px;
        height: 400px;
      }
    }
  }
}

</style>
