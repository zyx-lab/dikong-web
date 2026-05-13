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
          height="clamp(300px, 62vh, 680px)"
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

type RecordMediaFile = {
  id?: number;
  media_type?: number | string;
  mediaType?: number | string;
  type?: number | string | null;
  mime_type?: string | null;
  mimeType?: string | null;
  content_type?: string | null;
  contentType?: string | null;
  file_name?: string | null;
  fileName?: string | null;
  name?: string | null;
  preview_url?: string | null;
  previewUrl?: string | null;
  media_url?: string | null;
  mediaUrl?: string | null;
  playback_url?: string | null;
  playbackUrl?: string | null;
  signed_url?: string | null;
  signedUrl?: string | null;
  file_url?: string | null;
  fileUrl?: string | null;
  download_url?: string | null;
  downloadUrl?: string | null;
  original_url?: string | null;
  originalUrl?: string | null;
  url?: string | null;
};

type RecordImageItem = {
  id: number;
  name: string;
  url: string;
};

const route = useRoute();
const router = useRouter();
const carouselRef = ref<{ setActiveItem: (index: number | string) => void } | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const flightNo = ref("");
const images = ref<RecordImageItem[]>([]);
const activeIndex = ref(0);

const headingText = computed(() => flightNo.value || "飞行记录现场图片");

function isImageFilePath(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.split("?")[0].split("#")[0].toLowerCase();
  return /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/.test(normalized);
}

function isImageMedia(media: RecordMediaFile): boolean {
  const mediaType = media.media_type ?? media.mediaType;
  const typeValues = [
    mediaType,
    media.type,
    media.mime_type,
    media.mimeType,
    media.content_type,
    media.contentType,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).toLowerCase());

  return (
    Number(mediaType) === 1 ||
    typeValues.some((value) =>
      ["image", "photo", "picture", "jpg", "jpeg", "png"].includes(value)
    ) ||
    typeValues.some((value) => value.startsWith("image/")) ||
    isImageFilePath(getMediaUrl(media)) ||
    isImageFilePath(media.file_name ?? media.fileName ?? media.name)
  );
}

function getMediaName(media: RecordMediaFile, index: number): string {
  return media.file_name ?? media.fileName ?? media.name ?? `图片 ${index + 1}`;
}

function getMediaUrl(media: RecordMediaFile): string {
  const candidates = [
    media.preview_url,
    media.previewUrl,
    media.media_url,
    media.mediaUrl,
    media.playback_url,
    media.playbackUrl,
    media.signed_url,
    media.signedUrl,
    media.file_url,
    media.fileUrl,
    media.download_url,
    media.downloadUrl,
    media.original_url,
    media.originalUrl,
    media.url,
  ];

  return (
    candidates.find((url): url is string => typeof url === "string" && url.trim() !== "") ?? ""
  );
}

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
    const imageFiles = mediaFiles.filter(isImageMedia);

    if (imageFiles.length === 0) {
      errorMessage.value = "暂无图片";
      return;
    }

    const resolvedImages = imageFiles.map((media, index): RecordImageItem | null => {
      const url = getMediaUrl(media);
      return url ? { id: media.id ?? index, name: getMediaName(media, index), url } : null;
    });

    images.value = resolvedImages.filter((image): image is RecordImageItem => image !== null);
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
  overflow: hidden;
  background: #101214;
  border-radius: 8px;
}

.record-image-page__slide {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  width: 100%;
  height: 100%;
  margin: 0;
}

.record-image-page__image {
  align-self: center;
  justify-self: center;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.record-image-page__caption {
  min-height: 38px;
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
