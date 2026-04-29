<template>
  <div class="video-player-page">
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    <video v-if="!errorMsg" ref="videoRef" class="video" controls autoplay playsinline />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import FlightRecordAPI from "@/api/flight/record";

const route = useRoute();
const videoRef = ref<HTMLVideoElement | null>(null);
const errorMsg = ref("");

function setError(msg: string) {
  errorMsg.value = msg;
}

onMounted(async () => {
  const mediaId = Number(route.params.mediaId);
  if (!mediaId) {
    setError("缺少视频 ID");
    return;
  }

  let playbackUrl: string;
  try {
    const res = (await FlightRecordAPI.getPlaybackUrl(mediaId)) as any;
    playbackUrl = res?.playback_url ?? res?.data?.playback_url ?? res?.data ?? "";
  } catch {
    setError("获取视频地址失败");
    return;
  }

  if (!playbackUrl) {
    setError("暂无视频地址");
    return;
  }

  const video = videoRef.value;
  if (!video) return;

  video.addEventListener("error", () => {
    setError(`视频播放失败 (code: ${video.error?.code})`);
  });

  video.src = playbackUrl;
});
</script>

<style scoped>
.video-player-page {
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
.error {
  font-size: 18px;
  color: #f56c6c;
  text-align: center;
}
</style>
