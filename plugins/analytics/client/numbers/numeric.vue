<template>
  <k-card class="k-card-numeric">
    <k-icon :name="icon"/>
    <div class="content">
      <p class="title">{{ title }}</p>
      <p class="value"><slot>-</slot></p>
    </div>
  </k-card>
</template>

<script lang="ts" setup>

defineProps<{
  title: string
  icon: string
}>()

</script>

<style lang="scss">

.k-card-numeric .k-card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .k-icon {
    height: 2.5rem;
    width: 3rem;
    color: var(--k-text-normal);
    transition: color 0.3s ease;

    @media screen and (max-width: 768px) {
      height: 2.25rem;
    }
  }

  .content {
    float: right;
    text-align: right;
    height: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }

  p {
    margin: 0;
    font-size: 0.9375rem;
  }

  .value {
    font-size: 1rem;
  }
}

</style>
