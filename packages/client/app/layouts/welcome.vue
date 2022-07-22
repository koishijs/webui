<template>
  <k-card class="welcome">
    <h1>欢迎使用 Koishi！</h1>
    <p>你的机器人已经准备就绪。点击下面的任一选项，开启你的 Koishi 之旅吧。</p>
    <k-slot name="welcome:choice" class="choices">
      <div class="choice" @click="openDocs">
        <h2>阅读文档</h2>
        <p>开始阅读官方文档。官方文档里包含了你想要了解的全部内容。</p>
      </div>
    </k-slot>
  </k-card>
</template>

<script lang="ts" setup>

function openDocs() {
  window.open('https://koishi.js.org', '_blank')
}

</script>

<style lang="scss" scoped>

.welcome {
  padding: 2rem;

  h1 {
    font-size: 2.5rem;
    margin-top: 2rem;
  }

  h1 + p {
    margin: 2rem 0;
  }
}

</style>

<style lang="scss">

.welcome {
  .choice {
    display: inline-block;
    width: 240px;
    padding: 0.5rem 1.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    transition: var(--color-transition);

    &:hover {
      background-color: var(--bg1);
    }

    h2 {
      font-size: 1.25rem;
      margin-top: 1rem;
    }
  }

  .choice + .choice {
    margin-left: 2rem;
  }
}

</style>
