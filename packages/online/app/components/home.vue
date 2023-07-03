<template>
  <k-layout :main="`darker page-home${socket ? '' : ' loading'}`">
    <k-card v-if="global.unsupported">
      <p v-for="(line, index) in global.unsupported" :key="index">{{ line }}</p>
    </k-card>
    <el-scrollbar v-else-if="socket">
      <k-content>
        <h1>k-on!</h1>
        <p>k-on! 是一个在线的 Koishi 运行时，你可以在这里体验 Koishi 的各种功能。</p>
        <h2>什么是 Koishi？</h2>
        <p>Koishi 是一个跨平台、可扩展、高性能的聊天机器人框架。</p>
        <ul>
          <li>Koishi 提供了开箱即用的控制台，即便是零基础的用户也能在几分钟之内搭建自己的聊天机器人。</li>
          <li>Koishi 支持 10 余个聊天平台并拥有了近 1000 个插件的丰富生态。无论你的目标是构建大型交互应用还是轻量级的辅助机器人，Koishi 都为你提供了最佳实践。</li>
          <li>Koishi 更为开发者准备了众多专业功能，使插件开发者得以在各种复杂需求中构建规模化的解决方案。</li>
        </ul>
        <div class="links">
          <a href="https://koishi.chat" rel="noopener noreferer" target="_blank">
            <k-card>
              <k-icon name="activity:docs"></k-icon>
              阅读文档
            </k-card>
          </a>
          <a href="https://k.ilharp.cc" rel="noopener noreferer" target="_blank">
            <k-card>
              <k-icon name="activity:forum"></k-icon>
              前往论坛
            </k-card>
          </a>
        </div>
        <h2>我可以在这里做什么？</h2>
        <p>在左侧的活动栏中前往「沙盒」，并在窗口底部的聊天框中输入「help」，即可开始你与 Koishi 的对话。</p>
        <p>了解基础操作后，你可以体验更多插件的功能。由于 k-on! 还处于测试阶段，因此只有少数的插件进行了适配。你可以在「插件市场」中查看并配置这些插件。如果你是一名开发者，也可以参考<a href="https://koishi.chat/cookbook/online.html" rel="noopener noreferer" target="_blank">这篇文档</a>将你的插件是否部署到 k-on!。</p>
        <div class="links">
          <router-link to="/sandbox">
            <k-card>
              <k-icon name="activity:flask"></k-icon>
              沙盒聊天
            </k-card>
          </router-link>
          <router-link to="/market">
            <k-card>
              <k-icon name="activity:market"></k-icon>
              插件市场
            </k-card>
          </router-link>
        </div>
      </k-content>
    </el-scrollbar>
    <div v-else>
      <k-card class="connect">{{ global.messages?.connecting || '正在连接到 Koishi 服务器……' }}</k-card>
    </div>
  </k-layout>
</template>

<script lang="ts" setup>

import { global, socket } from '@koishijs/client'

</script>

<style lang="scss" scoped>

.k-content {
  max-width: 55rem;
}

h1 {
  line-height: 40px;
  font-size: 32px;
}

h2 {
  margin: 48px 0 16px;
  border-top: 1px solid var(--k-color-divider);
  padding-top: 24px;
  line-height: 32px;
  font-size: 24px;
}

h3 {
  margin: 32px 0 0;
  line-height: 28px;
  font-size: 20px;
}

ol, ul {
  line-height: 1.75;
  padding-left: 1.5rem;
}

p a {
  font-weight: 500;
  color: var(--k-color-active);
  text-decoration-style: dotted;
  transition: color .25s;

  &:hover {
    text-decoration: underline;
  }
}

.k-card {
  width: 200px;
  display: inline-block;

  :deep(.k-card-body) {
    margin: 1rem 0;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    gap: 0 1rem;
  }

  .k-icon {
    height: 1.25rem;
  }
}

.links {
  display: flex;
  margin: 1.5rem 0;
  gap: 1.5rem;
}

</style>
