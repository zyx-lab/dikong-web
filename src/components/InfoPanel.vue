<template>
  <Card class="info-panel" :class="{ 'info-panel--flat': shadow === 'never' }">
    <CardHeader class="info-panel__card-header">
      <div class="info-panel__header">
        <span class="info-panel__title">{{ title }}</span>
        <div v-if="$slots['header-extra']" class="info-panel__extra">
          <slot name="header-extra" />
        </div>
      </div>
    </CardHeader>

    <CardContent class="info-panel__card-body">
      <div class="info-panel__body" :class="bodyClass">
        <slot />
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  &--flat {
    box-shadow: none;
  }

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

  &__card-header {
    padding-bottom: 0.875rem;
  }

  &__card-body {
    padding-top: 0;
  }
}
</style>
