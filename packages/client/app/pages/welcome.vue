<template>
  <div class="k-card welcome">
    <h1>{{ t('title') }}</h1>
    <p>{{ t('description') }}</p>
    <div class="choices">
      <k-slot name="welcome-choice">
      <a class="choice" href="https://koishi.chat" rel="noopener noreferer" target="_blank">
        <h2>{{ t('action.docs.title') }}</h2>
        <p>{{ t('action.docs.description') }}</p>
      </a>
      <a class="choice" href="https://k.ilharp.cc" rel="noopener noreferer" target="_blank">
        <h2>{{ t('action.forum.title') }}</h2>
        <p>{{ t('action.forum.description') }}</p>
      </a>
    </k-slot>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { useI18n } from 'vue-i18n'
import zhCN from './welcome.zh-CN.yml'
import enUS from './welcome.en-US.yml'

const { t, setLocaleMessage } = useI18n({
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

if (import.meta.hot) {
  import.meta.hot.accept('./welcome.zh-CN.yml', (module) => {
    setLocaleMessage('zh-CN', module.default)
  })
  import.meta.hot.accept('./welcome.en-US.yml', (module) => {
    setLocaleMessage('en-US', module.default)
  })
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
    --welcome-padding: 1.5rem 1.5rem;
    --welcome-gap: 1.5rem;
    --welcome-choice-padding: 0.5rem 1.5rem;
  }
}

</style>
