<template>
  <k-card class="welcome">
    <h1>欢迎使用 Koishi！</h1>
    <p>你的机器人已经准备就绪。点击下面的任一选项，开启你的 Koishi 之旅吧。</p>
    <div class="choice">
      <h2>阅读文档</h2>
      <p>开始阅读官方文档。官方文档里包含了你想要了解的全部内容。</p>
    </div>
    <div class="choice">
      <h2>浏览插件</h2>
      <p>浏览插件市场中的插件，并根据自己的需要安装和配置。</p>
    </div>
  </k-card>
</template>

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

  .choice {
    display: inline-block;
    width: 240px;
    padding: 0.5rem 1.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;

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
