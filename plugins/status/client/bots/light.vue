<template>
  <span class="status-light"></span>
</template>

<style lang="scss" scoped>

$size: 0.625rem;

.status-light {
  border-radius: $size;
  transition: var(--color-transition);
  width: $size;
  height: $size;

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
