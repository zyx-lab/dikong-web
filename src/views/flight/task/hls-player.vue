<template>
  <div class="hls-player-page">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="errorMsg" class="error">{{ errorMsg }}</div>
    <video v-else ref="videoRef" class="video" controls muted autoplay playsinline />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import Hls from "hls.js";

const route = useRoute();
const videoRef = ref<HTMLVideoElement | null>(null);
const loading = ref(true);
const errorMsg = ref("");
let hlsInstance: Hls | null = null;

onMounted(() => {
  // 优先从 URL 参数取，否则从 sessionStorage 读
  let url = route.query.url as string | undefined;
  const taskId = route.query.taskId as string | undefined;
  if (!url && taskId) {
    url = sessionStorage.getItem(`live_${taskId}`) ?? undefined;
  }

  if (!url) {
    errorMsg.value = "缺少直播地址，请重新推进任务";
    loading.value = false;
    return;
  }

  const video = videoRef.value!;

  // Safari 原生支持 HLS
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    video.addEventListener("canplay", () => {
      loading.value = false;
    });
    video.addEventListener("error", () => {
      errorMsg.value = "播放失败，请检查直播地址是否有效";
      loading.value = false;
    });
    return;
  }

  // 其他浏览器使用 hls.js
  if (Hls.isSupported()) {
    hlsInstance = new Hls();
    hlsInstance.loadSource(url);
    hlsInstance.attachMedia(video);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      loading.value = false;
      video.play().catch(() => {
        // autoplay 被阻止，静默失败
      });
    });
    hlsInstance.on(Hls.Events.ERROR, (_: any, data: any) => {
      if (data.fatal) {
        errorMsg.value = "播放出错: " + (data.details || "未知错误");
        loading.value = false;
      }
    });
  } else {
    errorMsg.value = "当前浏览器不支持 HLS 播放";
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  hlsInstance?.destroy();
  hlsInstance = null;
});
</script>

<style scoped>
.hls-player-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background: #000;
}
.video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.loading,
.error {
  font-size: 18px;
  color: #fff;
}
.error {
  color: #f56c6c;
}
</style>
