<template>
  <k-card class="instances">
    <template #header>
      <span>实例管理</span>
      <k-button class="right" @click="create">添加</k-button>
    </template>
    <table>
      <tr class="instance" v-for="key in data.instances" :key="key">
        <td class="name">
          {{ key }}
          <template v-if="data.current === key">(运行中)</template>
        </td>
        <td class="actions">
          <span>
            <k-icon v-if="data.current !== key" name="start" @click="activate(key)"></k-icon>
            <k-icon v-if="data.current !== key" name="delete" @click="remove(key)"></k-icon>
          </span>
        </td>
      </tr>
    </table>
  </k-card>
</template>

<script lang="ts" setup>

import { activate, data, create } from './utils'

function remove(key: string) {
  delete data.value.instances[key]
}

</script>

<style lang="scss">

.k-card.instances {
  margin: var(--card-margin);

  .right {
    float: right;
  }

  .instance {
    transition: var(--color-transition);

    &:hover {
      background-color: var(--hover-bg);
    }

    .name {
      text-align: left;
    }

    .actions {
      text-align: right;

      span {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: flex-end;
      }

      .k-icon {
        cursor: pointer;
      }
    }
  }
}

</style>
