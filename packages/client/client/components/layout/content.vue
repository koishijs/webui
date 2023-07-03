<template>
  <el-scrollbar>
    <div class="k-content">
      <slot></slot>
    </div>
  </el-scrollbar>
</template>

<style lang="scss">

.k-content {
  --content-padding: 3rem;

  margin: auto;
  max-width: 55rem;
  box-sizing: border-box;
  padding: 3rem var(--content-padding);

  > :first-child {
    margin-top: 0;
  }

  @media screen and (max-width: 768px) {
    --content-padding: 2rem;
  }

  @media screen and (max-width: 480px) {
    --content-padding: 1.5rem;
  }
}

</style>
