export type RecordMediaFile = {
  id?: number | string;
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

export type RecordImageItem = {
  id: number | string;
  name: string;
  url: string;
};

function isImageFilePath(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.split("?")[0].split("#")[0].toLowerCase();
  return /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/.test(normalized);
}

export function getMediaName(media: RecordMediaFile, index: number): string {
  return media.file_name ?? media.fileName ?? media.name ?? `图片 ${index + 1}`;
}

export function getMediaUrl(media: RecordMediaFile): string {
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
    candidates.find((url): url is string => typeof url === "string" && url.trim() !== "")?.trim() ??
    ""
  );
}

export function isImageMedia(media: RecordMediaFile): boolean {
  const mediaType = media.media_type ?? media.mediaType ?? media.type;
  const typeValues = [
    mediaType,
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

export function getRecordImageItems(mediaFiles: RecordMediaFile[]): RecordImageItem[] {
  return mediaFiles
    .filter(isImageMedia)
    .map((media, index): RecordImageItem | null => {
      const url = getMediaUrl(media);
      return url ? { id: media.id ?? index, name: getMediaName(media, index), url } : null;
    })
    .filter((image): image is RecordImageItem => image !== null);
}

export function countRecordImages(mediaFiles: RecordMediaFile[]): number {
  return getRecordImageItems(mediaFiles).length;
}
