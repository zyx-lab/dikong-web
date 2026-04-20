<template>
  <Card data-testid="flight-metric-card" class="border-border/70 shadow-none">
    <CardHeader class="pb-3">
      <CardTitle class="text-sm font-medium text-muted-foreground">
        {{ label }}
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-2">
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
