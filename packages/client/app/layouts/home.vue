<template>
  <k-layout main="darker" container="page-welcome">
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

@import '@koishijs/client/palette.scss';

.page-welcome {
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

  @media screen and (max-width: $bp-medium) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.chart-grid {
  .echarts {
    max-width: 100%;
    margin: 0 auto;
  }

  @media (min-width: $bp-medium) {
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

  @media (max-width: $bp-medium) {
    grid-template-columns: 1fr;

    @media (min-width: $bp-small) {
      .echarts {
        width: 800px;
        height: 400px;
      }
    }

    @media (max-width: $bp-small) {
      .echarts {
        width: 600px;
        height: 400px;
      }
    }
  }
}

</style>
