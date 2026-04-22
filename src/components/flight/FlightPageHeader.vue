<template>
  <section class="command-page__hero command-page__hero--compact flight-page-header">
    <div class="command-page__hero-inner">
      <div class="command-page__hero-main">
        <div class="command-page__heading">
          <p v-if="displayEyebrow" class="command-page__eyebrow">{{ displayEyebrow }}</p>
          <h1 class="command-page__title">{{ title }}</h1>
          <p v-if="description" class="command-page__description">
            {{ description }}
          </p>
        </div>

        <div v-if="actionLabel" class="flight-page-header__action-wrap">
          <Button class="flight-page-header__action" @click="emit('action')">
            {{ actionLabel }}
          </Button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();

const displayEyebrow = computed(() => {
  if (!props.eyebrow) return "";
  return props.eyebrow.trim() === props.title.trim() ? "" : props.eyebrow;
});
</script>

<style scoped lang="scss">
.flight-page-header {
  min-height: 0;
  padding: 18px 22px;
}

.flight-page-header .command-page__hero-inner {
  gap: 10px;
}

.flight-page-header .command-page__hero-main {
  gap: 14px;
  align-items: center;
}

.flight-page-header .command-page__heading {
  max-width: 52ch;
}

.flight-page-header .command-page__title {
  font-size: clamp(1.75rem, 2.1vw, 2.15rem);
}

.flight-page-header .command-page__description {
  margin-top: 6px;
  line-height: 1.65;
}

.flight-page-header__action-wrap {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
}

.flight-page-header__action {
  min-width: 124px;
  min-height: 42px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .flight-page-header {
    padding: 16px 18px;
  }

  .flight-page-header .command-page__hero-main {
    align-items: flex-start;
  }

  .flight-page-header__action-wrap {
    width: 100%;
  }

  .flight-page-header__action {
    width: 100%;
  }
}
</style>
