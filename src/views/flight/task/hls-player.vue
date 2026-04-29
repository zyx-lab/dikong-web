<template>
  <div class="hls-player-page">
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    <video v-if="!errorMsg" ref="videoRef" class="video" controls muted autoplay playsinline />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import Hls from "hls.js";

const route = useRoute();
const videoRef = ref<HTMLVideoElement | null>(null);
const errorMsg = ref("");
let hlsInstance: Hls | null = null;

function setError(msg: string) {
  errorMsg.value = msg;
}

function tryPlay() {
  const video = videoRef.value;
  if (!video) return;
  video.play().catch(() => {
    // autoplay may be blocked, ignore
  });
}

onMounted(() => {
  const taskId = route.query.taskId as string | undefined;
  const url =
    (route.query.url as string | undefined) ||
    (taskId ? sessionStorage.getItem(`live_${taskId}`) : undefined) ||
    undefined;
  if (!url) {
    setError("缺少直播地址，请重新推进任务");
    return;
  }

  const video = videoRef.value!;

  // Safari / iOS native HLS support
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    video.addEventListener("canplay", () => {
      tryPlay();
    });
    return;
  }

  // Other browsers: hls.js
  if (!Hls.isSupported()) {
    setError("当前浏览器不支持 HLS 播放");
    return;
  }

  hlsInstance = new Hls({ autoStartLoad: true });
  hlsInstance.loadSource(url);
  hlsInstance.attachMedia(video);

  hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
    tryPlay();
  });

  hlsInstance.on(Hls.Events.ERROR, (_: any, data: any) => {
    if (data.fatal) {
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          hlsInstance?.startLoad();
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          hlsInstance?.recoverMediaError();
          break;
        default:
          setError("播放出错: " + (data.details || "未知错误"));
          hlsInstance?.destroy();
          break;
      }
    }
  });

  // fallback: if MANIFEST_PARSED never fires within 10s, show error
  setTimeout(() => {
    if (!errorMsg.value) {
      setError("播放超时，请检查直播地址是否有效");
    }
  }, 10000);
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
  width: 100%;
  height: 100%;
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
  text-align: center;
}
.error {
  color: #f56c6c;
}
</style>
