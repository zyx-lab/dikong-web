import type { RouteRead } from "@/api/flight/route";
import type { RouteDraftPayloadData } from "./route-payload";
import type { RouteRecordModel } from "./types";
import { ROUTE_PAYLOAD_DATA_NAME, decodeRouteDraftPayload } from "./route-payload";
import { createEmptyRoute, formatDateTime } from "./utils";
import { WAYLINE_DEVICE_PRESETS, buildWaylineKmzFile } from "./wayline-kmz";

const DEFAULT_ROUTE_KMZ_DEVICE = WAYLINE_DEVICE_PRESETS[0];
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_METHOD_STORE = 0;
const ZIP_METHOD_DEFLATE = 8;

export async function buildRouteDraftKmzFile(route: RouteRecordModel): Promise<File> {
  return buildWaylineKmzFile(route, {
    fileName: route.routeName,
    author: route.creatorName || "系统用户",
    device: DEFAULT_ROUTE_KMZ_DEVICE,
  });
}

export async function hydrateRouteRecord(
  route: RouteRead,
  kmzBlob?: Blob | null
): Promise<RouteRecordModel> {
  const payload = kmzBlob ? await extractRoutePayloadFromKmz(kmzBlob) : null;

  return createEmptyRoute({
    ...(payload ?? {}),
    id: String(route.id),
    persisted: true,
    isPublished: Boolean(route.is_published),
    routeName: payload?.routeName?.trim() || route.name || "",
    createdAt: formatApiDateTime(route.created_at),
    updatedAt: formatApiDateTime(route.updated_at),
  });
}

export async function extractRoutePayloadFromKmz(
  kmzBlob: Blob
): Promise<RouteDraftPayloadData | null> {
  try {
    const templateKml = await readKmzEntryText(kmzBlob, "wpmz/template.kml");
    if (templateKml) {
      return extractRoutePayloadFromKml(templateKml);
    }

    const firstKml = await readFirstKmzEntryText(kmzBlob, (name) =>
      normalizeKmzEntryName(name).toLowerCase().endsWith(".kml")
    );
    return firstKml ? extractRoutePayloadFromKml(firstKml) : null;
  } catch {
    return null;
  }
}

export function extractRoutePayloadFromKml(xmlContent: string) {
  try {
    const documentNode = new DOMParser().parseFromString(xmlContent, "application/xml");
    if (documentNode.getElementsByTagName("parsererror").length > 0) {
      return null;
    }

    const dataNodes = Array.from(documentNode.getElementsByTagNameNS("*", "Data"));
    const payloadNode = dataNodes.find(
      (node) => node.getAttribute("name") === ROUTE_PAYLOAD_DATA_NAME
    );
    const valueNode = payloadNode?.getElementsByTagNameNS("*", "value")?.[0];
    const encodedPayload = valueNode?.textContent?.trim();

    if (!encodedPayload) {
      return null;
    }

    return decodeRouteDraftPayload(encodedPayload);
  } catch {
    return null;
  }
}

export function formatApiDateTime(value?: string): string {
  if (!value) {
    return formatDateTime(new Date());
  }

  const normalizedValue = value.replace("Z", "");
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedValue.replace("T", " ").replace(/\.\d+$/, "");
  }

  return formatDateTime(parsedDate);
}

async function readKmzEntryText(kmzBlob: Blob, entryName: string): Promise<string | null> {
  const normalizedEntryName = normalizeKmzEntryName(entryName);
  const entries = await readKmzEntries(kmzBlob);
  const targetEntry = entries.find(
    (entry) => normalizeKmzEntryName(entry.name) === normalizedEntryName
  );

  if (!targetEntry) {
    return null;
  }

  return new TextDecoder().decode(targetEntry.data);
}

async function readFirstKmzEntryText(
  kmzBlob: Blob,
  matcher: (entryName: string) => boolean
): Promise<string | null> {
  const entries = await readKmzEntries(kmzBlob);
  const targetEntry = entries.find((entry) => matcher(entry.name));

  if (!targetEntry) {
    return null;
  }

  return new TextDecoder().decode(targetEntry.data);
}

async function readKmzEntries(kmzBlob: Blob) {
  const buffer = await kmzBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const entries: Array<{ name: string; data: Uint8Array }> = [];
  const decoder = new TextDecoder();
  let offset = 0;

  while (offset + 4 <= bytes.length) {
    const signature = view.getUint32(offset, true);
    if (
      signature === ZIP_CENTRAL_DIRECTORY_SIGNATURE ||
      signature === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE
    ) {
      break;
    }

    if (signature !== ZIP_LOCAL_FILE_HEADER_SIGNATURE || offset + 30 > bytes.length) {
      break;
    }

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);
    const fileNameStart = offset + 30;
    const fileNameEnd = fileNameStart + fileNameLength;
    const dataStart = fileNameEnd + extraFieldLength;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > bytes.length) {
      break;
    }

    const name = decoder.decode(bytes.slice(fileNameStart, fileNameEnd));
    const rawData = bytes.slice(dataStart, dataEnd);
    const data = await decodeKmzEntryData(rawData, compressionMethod);

    entries.push({ name, data });
    offset = dataEnd;
  }

  return entries;
}

async function decodeKmzEntryData(rawData: Uint8Array, compressionMethod: number) {
  if (compressionMethod === ZIP_METHOD_STORE) {
    return rawData;
  }

  if (compressionMethod === ZIP_METHOD_DEFLATE && typeof DecompressionStream !== "undefined") {
    const copiedData = Uint8Array.from(rawData);
    const stream = new Blob([copiedData.buffer as ArrayBuffer])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  }

  throw new Error(`Unsupported KMZ compression method: ${compressionMethod}`);
}

function normalizeKmzEntryName(value: string) {
  return value.replace(/\\/g, "/").replace(/^\/+/, "");
}
