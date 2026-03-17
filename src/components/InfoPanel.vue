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
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__extra {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__body {
    padding: 0;
  }
}
</style>
