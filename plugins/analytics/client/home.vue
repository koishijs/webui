<template>
  <number-grid></number-grid>
  <div class="card-grid chart-grid"><k-slot name="analytic-chart"></k-slot></div>
</template>

<script lang="ts" setup>

import NumberGrid from './numbers/index.vue'

</script>

<style lang="scss">

.card-grid {
  display: grid;
  margin: var(--card-margin);
  grid-gap: var(--card-margin);
}

.chart-grid {
  .echarts {
    max-width: 100%;
    margin: 0 auto;
  }

  @media (min-width: 1280px) {
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

  @media (max-width: 1280px) {
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
