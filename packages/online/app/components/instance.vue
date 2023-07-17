<template>
  <k-card class="instance">
    <template #header>
      <input v-model="model"/>
    </template>
    <template #footer>
      <template v-if="data.current === id">
        <el-button disabled>
          运行中
        </el-button>
      </template>
      <template v-else>
        <el-button @click="activate(id, $event)">
          <k-icon name="start"></k-icon>
          切换
        </el-button>
        <el-button @click="remove(id)">
          <k-icon name="delete"></k-icon>
          删除
        </el-button>
      </template>
      <el-button>
        <k-icon name="share"></k-icon>
        分享
      </el-button>
    </template>
  </k-card>
</template>

<script lang="ts" setup>

import { activate, data, instances, remove, Instance, flush } from '../utils'
import { computed } from 'vue'

const props = defineProps<{ id: string } & Instance>()

const model = computed({
  get: () => props.name,
  set: (value) => {
    instances.value[props.id].name = value
    flush()
  },
})

</script>

<style lang="scss" scoped>

.k-card.instance {
  input {
    outline: none;
    background-color: transparent;
    font-size: 1.25rem;
    font-weight: 500;
    border: none;
    color: inherit;
  }

  :deep(.k-card-body) {
    flex: 1 1 auto;
  }

  :deep(footer) {
    margin: 0;
    padding: 0;
    height: 3rem;
    display: flex;

    .el-button {
      flex: 1 1 auto;
      margin: 0;
      height: 100%;
      border-radius: 0;

      &:first-child {
        border-bottom-left-radius: 8px;
      }
      &:last-child {
        border-bottom-right-radius: 8px;
      }
    }

    .k-icon {
      margin-right: 0.5rem;
    }
  }
}

</style>
