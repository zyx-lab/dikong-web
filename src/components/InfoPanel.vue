<template>
  <el-card :shadow="shadow" class="info-panel">
    <template #header>
      <div class="info-panel__header">
        <span class="info-panel__title">{{ title }}</span>
        <div v-if="$slots['header-extra']" class="info-panel__extra">
          <slot name="header-extra" />
        </div>
      </div>
    </template>

    <div class="info-panel__body" :class="bodyClass">
      <slot />
    </div>
  </el-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    shadow?: "always" | "hover" | "never";
    bodyClass?: string;
  }>(),
  {
    shadow: "hover",
    bodyClass: "",
  }
);
</script>

<style scoped lang="scss">
.info-panel {
  &__header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: 1rem;
    font-weight: 650;
    line-height: 1.35;
    color: var(--el-text-color-primary);
    letter-spacing: 0.02em;
  }

  &__extra {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 0.8125rem;
    line-height: 1.4;
  }

  &__body {
    padding: 0;
  }
}
</style>
