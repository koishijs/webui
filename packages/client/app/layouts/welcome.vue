<template>
  <div class="k-card welcome">
    <h1>欢迎使用 Koishi！</h1>
    <p>你的机器人已经准备就绪。点击下面的任一选项，开启你的 Koishi 之旅吧。</p>
    <k-slot name="welcome-choice" class="choices">
      <div class="choice" @click="openDocs">
        <h2>阅读文档</h2>
        <p>开始阅读官方文档。官方文档里包含了你想要了解的全部内容。</p>
      </div>
    </k-slot>
  </div>
</template>

<script lang="ts" setup>

function openDocs() {
  window.open('https://koishi.js.org', '_blank')
}

</script>

<style lang="scss">

.page-home .welcome {
  --welcome-title: 2.5rem;
  --welcome-padding: 3rem 3rem;
  --welcome-choice-padding: 0.5rem 1.5rem;
  --welcome-gap: 2rem;

  padding: var(--welcome-padding);

  h1 {
    font-size: var(--welcome-title);
    margin-top: 0;
  }

  h1 + p {
    margin: var(--welcome-gap) 0;
  }

  .choices {
    display: flex;
    flex-flow: row wrap;
    gap: var(--welcome-gap);
  }

  .choice {
    flex: 1 0 auto;
    display: inline-block;
    width: 280px;
    box-sizing: border-box;
    padding: var(--welcome-choice-padding);
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

    p {
      font-size: 0.9375rem;
    }
  }

  @media screen and (max-width: 768px) {
    --welcome-title: 2rem;
    --welcome-padding: 2rem 2rem;
    --welcome-gap: 1.5rem;
    --welcome-choice-padding: 0.5rem 1.5rem;
  }
}

</style>
