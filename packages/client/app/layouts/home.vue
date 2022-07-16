<template>
  <k-layout main="darker">
    <el-scrollbar>
      <welcome></welcome>
      <k-view name="numeric" class="card-grid profile-grid"></k-view>
      <k-view name="chart" class="card-grid chart-grid"></k-view>
    </el-scrollbar>
  </k-layout>
</template>

<script lang="ts" setup>

import Welcome from './welcome.vue'

</script>

<style lang="scss">

.card-grid {
  display: grid;
  margin: 2rem;
}

.card-grid .k-card {
  margin: 0;
}

.profile-grid {
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 2rem;
}

.chart-grid {
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 2rem;

  .echarts {
    max-width: 100%;
    margin: 0 auto;
  }

  @media (min-width: 1400px) {
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

  @media (max-width: 1440px) {
    grid-template-columns: 1fr;

    @media (min-width: 1200px) {
      .echarts {
        width: 800px;
        height: 400px;
      }
    }

    @media (max-width: 1200px) {
      .echarts {
        width: 720px;
        height: 400px;
      }
    }
  }
}

</style>
