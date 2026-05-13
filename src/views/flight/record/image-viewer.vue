<template>
  <div class="record-image-page">
    <div class="record-image-page__toolbar">
      <Button variant="outline" size="sm" @click="handleBack">返回</Button>
      <div class="record-image-page__heading">
        <h1>图片查看</h1>
        <p>{{ headingText }}</p>
      </div>
      <Badge v-if="images.length > 0" variant="secondary">{{ images.length }} 张</Badge>
    </div>

    <div v-loading="loading" class="record-image-page__viewer">
      <div v-if="errorMessage" class="record-image-page__empty">{{ errorMessage }}</div>

      <template v-else-if="images.length > 0">
        <el-carousel
          ref="carouselRef"
          class="record-image-page__carousel"
          arrow="always"
          indicator-position="outside"
          trigger="click"
          :autoplay="false"
          :loop="images.length > 1"
          @change="handleCarouselChange"
        >
          <el-carousel-item v-for="(image, index) in images" :key="image.id" :label="index + 1">
            <figure class="record-image-page__slide">
              <img class="record-image-page__image" :src="image.url" :alt="image.name" />
              <figcaption class="record-image-page__caption">{{ image.name }}</figcaption>
            </figure>
          </el-carousel-item>
        </el-carousel>

        <div class="record-image-page__thumbs">
          <button
            v-for="(image, index) in images"
            :key="image.id"
            type="button"
            class="record-image-page__thumb"
            :class="{ 'record-image-page__thumb--active': index === activeIndex }"
            @click="setActiveImage(index)"
          >
            <img :src="image.url" :alt="image.name" />
            <span>{{ index + 1 }}</span>
          </button>
        </div>
      </template>

      <div v-else-if="!loading" class="record-image-page__empty">暂无图片</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import FlightRecordAPI from "@/api/flight/record";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getRecordImageItems,
  type RecordImageItem,
  type RecordMediaFile,
} from "@/views/flight/record/utils/media";

const route = useRoute();
const router = useRouter();
const carouselRef = ref<{ setActiveItem: (index: number | string) => void } | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const flightNo = ref("");
const images = ref<RecordImageItem[]>([]);
const activeIndex = ref(0);

const headingText = computed(() => flightNo.value || "飞行记录现场图片");

async function loadImages(): Promise<void> {
  const recordId = Number(route.params.recordId);
  if (!recordId) {
    errorMessage.value = "缺少飞行记录 ID";
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  images.value = [];
  activeIndex.value = 0;

  try {
    const detail = await FlightRecordAPI.getDetail(recordId);
    flightNo.value = detail.flightNo;
    const mediaFiles: RecordMediaFile[] = (detail as any).media_files ?? [];
    const resolvedImages = getRecordImageItems(mediaFiles);

    images.value = resolvedImages;
    if (images.value.length === 0) {
      errorMessage.value = "暂无可预览图片";
    }
  } catch (err) {
    console.error(err);
    errorMessage.value = "获取图片失败";
  } finally {
    loading.value = false;
  }
}

function handleCarouselChange(current: number): void {
  activeIndex.value = current;
}

function setActiveImage(index: number): void {
  activeIndex.value = index;
  carouselRef.value?.setActiveItem(index);
}

function handleBack(): void {
  router.push("/flight/record");
}

onMounted(() => {
  loadImages();
});
</script>

<style scoped lang="scss">
.record-image-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 120px);
  padding: 24px;
}

.record-image-page__toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
}

.record-image-page__heading {
  flex: 1;
  min-width: 0;

  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 650;
    line-height: 1.25;
    color: var(--foreground);
  }

  p {
    margin: 4px 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
    color: var(--muted-foreground);
    white-space: nowrap;
  }
}

.record-image-page__viewer {
  min-height: 460px;
}

.record-image-page__carousel {
  width: min(100%, 1040px);
  margin: 0 auto;
  overflow: visible;
}

.record-image-page__carousel :deep(.el-carousel__container) {
  height: auto !important;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #101214;
  border-radius: 8px;
}

.record-image-page__slide {
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  width: 100%;
  height: 100%;
  margin: 0;
}

.record-image-page__image {
  box-sizing: border-box;
  align-self: center;
  justify-self: center;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.record-image-page__caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  min-height: 36px;
  padding: 10px 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: #f4f4f5;
  text-align: center;
  white-space: nowrap;
  background: rgb(0 0 0 / 45%);
}

.record-image-page__thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.record-image-page__thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--muted);
  border: 2px solid transparent;
  border-radius: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    position: absolute;
    right: 6px;
    bottom: 6px;
    min-width: 22px;
    padding: 2px 6px;
    font-size: 12px;
    color: #fff;
    text-align: center;
    background: rgb(0 0 0 / 58%);
    border-radius: 999px;
  }
}

.record-image-page__thumb--active {
  border-color: var(--primary);
}

.record-image-page__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 460px;
  font-size: 15px;
  color: var(--muted-foreground);
  border: 1px dashed var(--border);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .record-image-page {
    padding: 16px;
  }

  .record-image-page__toolbar {
    flex-wrap: wrap;
  }

  .record-image-page__heading {
    flex-basis: calc(100% - 96px);
  }
}
</style>
