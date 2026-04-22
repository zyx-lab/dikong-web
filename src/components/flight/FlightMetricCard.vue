<template>
  <Card data-testid="flight-metric-card" class="flight-metric-card border-border/70 shadow-none">
    <CardHeader class="flight-metric-card__header pb-3">
      <CardTitle class="text-sm font-medium text-muted-foreground">
        {{ label }}
      </CardTitle>
    </CardHeader>
    <CardContent class="flight-metric-card__content space-y-2">
      <div class="text-3xl font-semibold tracking-tight">
        {{ value }}
      </div>
      <p v-if="note" class="text-sm text-muted-foreground">
        {{ note }}
      </p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

defineProps<{
  label: string;
  value: string | number;
  note?: string;
}>();
</script>

<style scoped lang="scss">
.flight-metric-card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      circle at top right,
      color-mix(in srgb, var(--muted) 70%, transparent),
      transparent 28%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--card) 98%, transparent),
      color-mix(in srgb, var(--muted) 30%, transparent)
    );
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);

  &::after {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 10px;
    height: 10px;
    content: "";
    background: color-mix(in srgb, var(--muted-foreground) 22%, transparent);
    border-radius: 999px;
    box-shadow: 0 0 0 7px color-mix(in srgb, var(--muted) 68%, transparent);
  }
}

.flight-metric-card__header,
.flight-metric-card__content {
  position: relative;
  z-index: 1;
}
</style>
