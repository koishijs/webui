<template>
  <k-card class="k-card-numeric">
    <k-icon :name="icon"/>
    <div class="content">
      <p class="title">{{ title }}</p>
      <p class="value"><slot></slot></p>
    </div>
  </k-card>
</template>

<script lang="ts" setup>

defineProps<{
  title: string
  icon: string
}>()

</script>

<style lang="scss" scoped>

.k-card-numeric {
  .k-icon {
    height: 2.4rem;
    padding: 0.3rem 0;
    width: 3rem;
    text-align: center;
    color: var(--fg2);
    transition: color 0.3s ease;
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
  }

  .value {
    font-size: 1.2rem;
  }
}

</style>
