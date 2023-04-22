<template>
  <span class="status-light"></span>
</template>

<style lang="scss" scoped>

.status-light {
  border-radius: 100%;
  transition: var(--color-transition);

  &.online {
    background-color: var(--success);
  }
  &.connect, &.reconnect {
    background-color: var(--warning);
  }
  &.error {
    background-color: var(--error) !important;
  }
  &.offline {
    background-color: var(--disabled);
  }
}

</style>
