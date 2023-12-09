<template>
  <span class="status-light"></span>
</template>

<style lang="scss" scoped>

.status-light {
  border-radius: 100%;
  transition: var(--color-transition);
  width: 0.625rem;
  height: 0.625rem;

  &.online {
    background-color: var(--k-color-success);
  }
  &.connect, &.reconnect {
    background-color: var(--k-color-warning);
  }
  &.error {
    background-color: var(--k-color-danger) !important;
  }
  &.offline {
    background-color: var(--k-color-disabled);
  }
  & + & {
    margin-left: 4px;
  }
}

</style>
