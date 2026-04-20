<template>
  <Card data-testid="flight-empty-state" class="border-dashed shadow-none">
    <CardHeader class="text-center">
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription>{{ description }}</CardDescription>
    </CardHeader>
    <CardContent v-if="actionLabel" class="flex justify-center">
      <Button variant="outline" @click="emit('action')">
        {{ actionLabel }}
      </Button>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

defineProps<{
  title: string;
  description: string;
  actionLabel?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>
