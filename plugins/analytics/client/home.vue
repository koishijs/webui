<template>
  <div class="card-grid profile-grid"><k-slot name="numeric"></k-slot></div>
  <div class="card-grid chart-grid"><k-slot name="chart"></k-slot></div>
</template>

<script lang="ts" setup>
</script>

<style lang="scss">

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
