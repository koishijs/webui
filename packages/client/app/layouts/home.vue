<template>
  <k-layout main="darker" class="page-home">
    <el-scrollbar>
      <welcome></welcome>
      <k-slot name="numeric" class="card-grid profile-grid"></k-slot>
      <k-slot name="chart" class="card-grid chart-grid"></k-slot>
    </el-scrollbar>
  </k-layout>
</template>

<script lang="ts" setup>

import Welcome from './welcome.vue'

</script>

<style lang="scss">

.page-home {
  .k-card.welcome {
    margin: var(--card-margin);
  }

  .k-card-body {
    margin: var(--card-padding-vertical) 0;
    padding: 0 var(--card-padding-horizontal);
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
