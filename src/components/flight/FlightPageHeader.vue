<template>
  <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div class="flex flex-col gap-2">
      <p v-if="eyebrow" class="text-sm font-medium text-muted-foreground">
        {{ eyebrow }}
      </p>
      <div class="space-y-1">
        <h1 class="text-3xl font-semibold tracking-tight">
          {{ title }}
        </h1>
        <p v-if="description" class="max-w-3xl text-sm text-muted-foreground">
          {{ description }}
        </p>
      </div>
    </div>

    <Button v-if="actionLabel" @click="emit('action')">
      {{ actionLabel }}
    </Button>
  </section>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";

defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>
