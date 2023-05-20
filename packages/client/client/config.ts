import { useDark } from '@vueuse/core'
import { computed } from 'vue'
import { i18n } from '.'

const isDark = useDark()

export const config = computed({
  get() {
    return { isDark: isDark.value, locale: i18n.global.locale.value }
  },
  set(value) {
    isDark.value = value?.isDark
    i18n.global.locale.value = value?.locale
  },
})
