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
  max-width: 50rem;
  padding: 3rem var(--content-padding) 1rem;

  > :first-child {
    margin-top: 0;
  }

  @media screen and (max-width: 768px) {
    --content-padding: 2rem;
  }

  @media screen and (max-width: 480px) {
    --content-padding: 1.5rem;
  }

  @media screen and (max-width: 480px) {
    .k-form {
      margin: 0 -1.5rem;

      h2 {
        padding: 0 1.5rem;
      }

      .schema-item {
        padding: 0.5rem 1.5rem;
      }
    }
  }
}

</style>
