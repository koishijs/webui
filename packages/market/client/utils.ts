import { computed, ref, watch } from "vue";
import { createStorage, Dict, send, store } from "@koishijs/client";

interface ManagerConfig {
  prefix: string;
  override: Dict<string>;
  showInstalled?: boolean;
  hideWorkspace?: boolean;
}

export const config = createStorage<ManagerConfig>("manager", 2, () => ({
  prefix: "^",
  override: {},
  showInstalled: false,
  hideWorkspace: true,
}));

export const overrideCount = computed(() => {
  return Object.values(config.override).filter((value) => value !== undefined)
    .length;
});

watch(
  () => store.dependencies,
  (value) => {
    if (!value) return;
    for (const key in config.override) {
      if (!config.override[key]) {
        if (!value[key]) delete config.override[key];
      } else if (value[key]?.request === config.override[key]) {
        delete config.override[key];
      }
    }
  },
  { immediate: true }
);

export const active = ref("");
export const showSelect = ref(false);

watch(showSelect, (count, prevCount) => {
  console.log(count, prevCount);
  let waitForLoad = setInterval(() => {
    try {
      document.getElementById("addPlugins_searchInput");
    } catch {
      return;
    }
    clearTimeout(waitForLoad);
    if (count == true) {
      document.getElementById("addPlugins_searchInput").focus();
    }
  }, 400);
});

export const getMixedMeta = (name: string) => ({
  keywords: [],
  peerDependencies: {},
  ...store.market.data[name],
  ...store.packages?.[name],
});

export const refresh = computed(() => ({
  icon: "refresh",
  label: "刷新",
  type:
    !store.market || store.market.progress < store.market.total
      ? "spin disabled"
      : "",
  action: () => send("market/refresh"),
}));
