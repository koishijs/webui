<template>
  <section class="k-card">
    <header v-if="title || $slots.header">
      <slot name="header">{{ title }}</slot>
    </header>
    <el-scrollbar v-if="scrollbar">
      <div class="k-card-body"><slot/></div>
    </el-scrollbar>
    <div v-else class="k-card-body"><slot/></div>
    <footer v-if="$slots.footer">
      <slot name="footer"></slot>
    </footer>
  </section>
</template>

<script lang="ts" setup>

defineProps<{
  title?: string
  scrollbar?: boolean
}>()

</script>

<style lang="scss">

$paddingX: 1.25rem;
$paddingY: 1.5rem;

.k-card {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  transition: var(--color-transition);

  header {
    position: relative;
    font-size: 1.25rem;
    font-weight: bolder;
    margin: $paddingX 0;
    padding: 0 $paddingY;
    transition: color 0.3s ease;
  }

  footer {
    position: relative;
    margin: $paddingX 0;
    padding: 0 $paddingY;
  }

  .k-card-body {
    position: relative;
    margin: $paddingX 0;
    padding: 0 $paddingY;
  }

  &.frameless .k-card-body {
    margin: 0;
    padding: 0;
  }
}

</style>
