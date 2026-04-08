import type { RouteRecordModel } from "./types";

export const ROUTE_PAYLOAD_DATA_NAME = "vea_route_payload";
export const ROUTE_PAYLOAD_VERSION = 1;

export interface RouteDraftPayloadData {
  routeName: string;
  department: string;
  routeType: RouteRecordModel["routeType"];
  creatorName: string;
  droneModel: string;
  description: string;
  points: RouteRecordModel["points"];
  globalConfig: RouteRecordModel["globalConfig"];
  pointConfig: RouteRecordModel["pointConfig"];
  areaConfig: RouteRecordModel["areaConfig"];
  loopConfig: RouteRecordModel["loopConfig"];
}

interface RouteDraftPayloadEnvelope {
  version: number;
  payload: RouteDraftPayloadData;
}

export function createRouteDraftPayload(route: RouteRecordModel): RouteDraftPayloadData {
  return {
    routeName: route.routeName,
    department: route.department,
    routeType: route.routeType,
    creatorName: route.creatorName,
    droneModel: route.droneModel,
    description: route.description,
    points: structuredClone(route.points),
    globalConfig: structuredClone(route.globalConfig),
    pointConfig: structuredClone(route.pointConfig),
    areaConfig: structuredClone(route.areaConfig),
    loopConfig: structuredClone(route.loopConfig),
  };
}

export function encodeRouteDraftPayload(route: RouteRecordModel): string {
  const envelope: RouteDraftPayloadEnvelope = {
    version: ROUTE_PAYLOAD_VERSION,
    payload: createRouteDraftPayload(route),
  };

  return encodeTextToBase64(JSON.stringify(envelope));
}

export function decodeRouteDraftPayload(value: string): RouteDraftPayloadData | null {
  try {
    const decoded = decodeTextFromBase64(value);
    const parsed = JSON.parse(decoded) as Partial<RouteDraftPayloadEnvelope> | null;
    if (!parsed || typeof parsed !== "object" || !parsed.payload) {
      return null;
    }
    return parsed.payload as RouteDraftPayloadData;
  } catch {
    return null;
  }
}

export function buildRoutePayloadExtendedDataXml(route: RouteRecordModel): string[] {
  const encodedPayload = encodeRouteDraftPayload(route);

  return [
    "<ExtendedData>",
    `  <Data name="${ROUTE_PAYLOAD_DATA_NAME}">`,
    `    <value>${encodedPayload}</value>`,
    "  </Data>",
    "</ExtendedData>",
  ];
}

function encodeTextToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.slice(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function decodeTextFromBase64(value: string): string {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}
