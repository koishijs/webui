<template>
  <k-layout main="darker page-login">
    <k-card>
      <login-form></login-form>
    </k-card>
  </k-layout>
</template>

<script lang="ts" setup>

import LoginForm from './login-form.vue'

</script>

<style lang="scss">

.page-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.page-login .k-card {
  width: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;

  .k-card-body {
    padding: 3rem 0 !important;
  }
}

</style>
