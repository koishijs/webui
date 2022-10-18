<template>
  <el-dialog center v-model="showDialog" class="bind-dialog">
    <login-form merge></login-form>
  </el-dialog>
</template>

<script lang="ts" setup>

import { computed, ref, watch } from 'vue'
import { showDialog } from './utils'
import LoginForm from './login-form.vue'

</script>

<style lang="scss">


</style>
