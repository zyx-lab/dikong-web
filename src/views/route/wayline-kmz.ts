import { RouteType } from "@/api/flight/types";
import { buildRoutePayloadExtendedDataXml } from "./route-payload";
import type { CameraMode, LoopRouteConfig, RouteRecordModel } from "./types";

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const KML_NAMESPACE = "http://www.opengis.net/kml/2.2";
const WPML_NAMESPACE = "http://www.dji.com/wpmz/1.0.2";
const EARTH_RADIUS = 6378137;

export interface WaylineDevicePreset {
  key: string;
  label: string;
  droneEnumValue: number;
  droneSubEnumValue: number;
  payloadEnumValue: number;
  payloadSubEnumValue: number;
  payloadPositionIndex: number;
  supportsInfrared: boolean;
}

export interface WaylineBuildOptions {
  fileName: string;
  author?: string;
  device: WaylineDevicePreset;
}

interface DispatchPoint {
  name: string;
  lng: number;
  lat: number;
  alt: number;
  hoverSeconds: number;
  gimbalPitch: number;
  yaw: number;
  shootPhoto: boolean;
  startRecord: boolean;
  stopRecord: boolean;
  preflight?: boolean;
}

interface IntervalCaptureConfig {
  triggerType: "multipleTiming" | "multipleDistance";
  triggerParam: number;
}

interface DispatchMission {
  points: DispatchPoint[];
  intervalCapture: IntervalCaptureConfig | null;
}

export const WAYLINE_DEVICE_PRESETS: WaylineDevicePreset[] = [
  {
    key: "m30t",
    label: "M30T",
    droneEnumValue: 67,
    droneSubEnumValue: 1,
    payloadEnumValue: 53,
    payloadSubEnumValue: 0,
    payloadPositionIndex: 0,
    supportsInfrared: true,
  },
  {
    key: "m30",
    label: "M30",
    droneEnumValue: 67,
    droneSubEnumValue: 0,
    payloadEnumValue: 52,
    payloadSubEnumValue: 0,
    payloadPositionIndex: 0,
    supportsInfrared: false,
  },
  {
    key: "m3t",
    label: "M3T",
    droneEnumValue: 77,
    droneSubEnumValue: 1,
    payloadEnumValue: 67,
    payloadSubEnumValue: 0,
    payloadPositionIndex: 0,
    supportsInfrared: true,
  },
  {
    key: "m3e",
    label: "M3E",
    droneEnumValue: 77,
    droneSubEnumValue: 0,
    payloadEnumValue: 66,
    payloadSubEnumValue: 0,
    payloadPositionIndex: 0,
    supportsInfrared: false,
  },
  {
    key: "m3td",
    label: "M3TD",
    droneEnumValue: 91,
    droneSubEnumValue: 1,
    payloadEnumValue: 81,
    payloadSubEnumValue: 0,
    payloadPositionIndex: 0,
    supportsInfrared: true,
  },
  {
    key: "m3d",
    label: "M3D",
    droneEnumValue: 91,
    droneSubEnumValue: 0,
    payloadEnumValue: 80,
    payloadSubEnumValue: 0,
    payloadPositionIndex: 0,
    supportsInfrared: false,
  },
  {
    key: "m300-h20t",
    label: "M300 RTK + H20T",
    droneEnumValue: 60,
    droneSubEnumValue: 0,
    payloadEnumValue: 43,
    payloadSubEnumValue: 0,
    payloadPositionIndex: 0,
    supportsInfrared: true,
  },
  {
    key: "m350-h30t",
    label: "M350 RTK + H30T",
    droneEnumValue: 89,
    droneSubEnumValue: 0,
    payloadEnumValue: 83,
    payloadSubEnumValue: 0,
    payloadPositionIndex: 0,
    supportsInfrared: true,
  },
];

export async function buildWaylineKmzFile(
  route: RouteRecordModel,
  options: WaylineBuildOptions
): Promise<File> {
  const mission = buildDispatchMission(route);
  const templateKml = buildTemplateKml(route, mission, options);
  const waylinesWpml = buildWaylinesWpml(route, mission, options);
  const encoder = new TextEncoder();
  const blob = buildZipBlob([
    { name: "wpmz/template.kml", data: encoder.encode(templateKml) },
    { name: "wpmz/waylines.wpml", data: encoder.encode(waylinesWpml) },
  ]);

  return new File([blob], ensureKmzFileName(options.fileName), {
    type: "application/vnd.google-earth.kmz",
  });
}

export function buildRouteTemplateXml(route: RouteRecordModel, options: WaylineBuildOptions) {
  return buildTemplateKml(route, buildDispatchMission(route), options);
}

export function ensureKmzFileName(fileName: string) {
  const safeName = (fileName || "航线").trim().replace(/[\\/:*?"<>|]/g, "-") || "航线";
  return safeName.toLowerCase().endsWith(".kmz") ? safeName : `${safeName}.kmz`;
}

export function ensureRouteXmlFileName(fileName: string) {
  const safeName = (fileName || "航线").trim().replace(/[\\/:*?"<>|]/g, "-") || "航线";
  return safeName.toLowerCase().endsWith(".xml") ? safeName : `${safeName}.xml`;
}

function buildDispatchMission(route: RouteRecordModel): DispatchMission {
  if (route.routeType === RouteType.POINT) {
    const points: DispatchPoint[] = route.points.map((point) => ({
      name: point.name,
      lng: point.lng,
      lat: point.lat,
      alt: point.alt,
      hoverSeconds: point.hoverSeconds,
      gimbalPitch: point.gimbalPitch,
      yaw: point.yaw,
      shootPhoto: point.shootPhoto,
      startRecord: point.startRecord,
      stopRecord: point.stopRecord,
    }));

    if (points.length > 0) {
      points.unshift({
        name: "Preflight Action",
        lng: points[0].lng,
        lat: points[0].lat,
        alt: route.pointConfig.preflightAction.height,
        hoverSeconds: route.pointConfig.preflightAction.hoverSeconds,
        gimbalPitch: route.pointConfig.preflightAction.gimbalPitch,
        yaw: points[0].yaw,
        shootPhoto: false,
        startRecord: false,
        stopRecord: false,
        preflight: true,
      });
    }

    return {
      points,
      intervalCapture: null,
    };
  }

  if (route.routeType === RouteType.AREA) {
    return {
      points: route.points.map((point, index) => ({
        name: point.name || `航点${index + 1}`,
        lng: point.lng,
        lat: point.lat,
        alt: route.areaConfig.flightHeight,
        hoverSeconds: 0,
        gimbalPitch: -90,
        yaw: 0,
        shootPhoto: false,
        startRecord: false,
        stopRecord: false,
      })),
      intervalCapture: {
        triggerType: route.areaConfig.shootMode === "time" ? "multipleTiming" : "multipleDistance",
        triggerParam:
          route.areaConfig.shootMode === "time"
            ? route.areaConfig.shootIntervalSeconds
            : route.areaConfig.shootIntervalDistance,
      },
    };
  }

  return {
    points: buildLoopDispatchPoints(route.loopConfig),
    intervalCapture: {
      triggerType: route.loopConfig.shootMode === "time" ? "multipleTiming" : "multipleDistance",
      triggerParam:
        route.loopConfig.shootMode === "time"
          ? route.loopConfig.shootIntervalSeconds
          : route.loopConfig.shootIntervalDistance,
    },
  };
}

function buildLoopDispatchPoints(loopConfig: LoopRouteConfig): DispatchPoint[] {
  if (!loopConfig.targetPoint) {
    return [];
  }

  const totalAngle = Math.max(0, Math.abs(loopConfig.totalAngle));
  const segmentCount = Math.max(12, Math.ceil(totalAngle / 30));
  const direction = loopConfig.direction === "clockwise" ? 1 : -1;

  return Array.from({ length: segmentCount + 1 }, (_, index) => {
    const progress = segmentCount === 0 ? 0 : index / segmentCount;
    const bearing = loopConfig.startAngle + direction * totalAngle * progress;
    const coordinate = offsetCoordinate(
      loopConfig.targetPoint!.lng,
      loopConfig.targetPoint!.lat,
      Math.max(1, loopConfig.radius),
      bearing
    );

    return {
      name: `环绕点${index + 1}`,
      lng: coordinate.lng,
      lat: coordinate.lat,
      alt: loopConfig.flightHeight,
      hoverSeconds: 0,
      gimbalPitch: loopConfig.gimbalPitch,
      yaw: 0,
      shootPhoto: false,
      startRecord: false,
      stopRecord: false,
    };
  });
}

function buildTemplateKml(
  route: RouteRecordModel,
  mission: DispatchMission,
  options: WaylineBuildOptions
) {
  const groupId = { value: 0 };
  const documentParts = [
    XML_HEADER,
    `<kml xmlns="${KML_NAMESPACE}" xmlns:wpml="${WPML_NAMESPACE}">`,
    "<Document>",
    `  <wpml:author>${escapeXml(options.author || route.creatorName || "系统用户")}</wpml:author>`,
    `  <wpml:createTime>${Date.now()}</wpml:createTime>`,
    `  <wpml:updateTime>${Date.now()}</wpml:updateTime>`,
    ...buildRoutePayloadExtendedDataXml(route).map((line) => `  ${line}`),
    buildMissionConfig(route, options.device)
      .map((line) => `  ${line}`)
      .join("\n"),
    "  <Folder>",
    "    <wpml:templateType>waypoint</wpml:templateType>",
    "    <wpml:templateId>0</wpml:templateId>",
    "    <wpml:waylineCoordinateSysParam>",
    "      <wpml:coordinateMode>WGS84</wpml:coordinateMode>",
    "      <wpml:heightMode>relativeToStartPoint</wpml:heightMode>",
    "      <wpml:positioningType>GPS</wpml:positioningType>",
    "    </wpml:waylineCoordinateSysParam>",
    `    <wpml:autoFlightSpeed>${formatNumber(route.globalConfig.routeSpeed, 2)}</wpml:autoFlightSpeed>`,
    "    <wpml:gimbalPitchMode>usePointSetting</wpml:gimbalPitchMode>",
    "    <wpml:globalWaypointHeadingParam>",
    "      <wpml:waypointHeadingMode>followWayline</wpml:waypointHeadingMode>",
    "      <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>",
    "    </wpml:globalWaypointHeadingParam>",
    "    <wpml:globalWaypointTurnMode>toPointAndStopWithDiscontinuityCurvature</wpml:globalWaypointTurnMode>",
    mission.points
      .map((point, index) =>
        buildTemplatePlacemark(route, mission, point, index, options, groupId)
          .map((line) => `    ${line}`)
          .join("\n")
      )
      .join("\n"),
    "  </Folder>",
    "</Document>",
    "</kml>",
  ];

  return documentParts.filter(Boolean).join("\n");
}

function buildWaylinesWpml(
  route: RouteRecordModel,
  mission: DispatchMission,
  options: WaylineBuildOptions
) {
  const groupId = { value: 0 };
  const documentParts = [
    XML_HEADER,
    `<kml xmlns="${KML_NAMESPACE}" xmlns:wpml="${WPML_NAMESPACE}">`,
    "<Document>",
    buildMissionConfig(route, options.device)
      .map((line) => `  ${line}`)
      .join("\n"),
    "  <Folder>",
    "    <wpml:templateId>0</wpml:templateId>",
    "    <wpml:executeHeightMode>relativeToStartPoint</wpml:executeHeightMode>",
    "    <wpml:waylineId>0</wpml:waylineId>",
    `    <wpml:autoFlightSpeed>${formatNumber(route.globalConfig.routeSpeed, 2)}</wpml:autoFlightSpeed>`,
    mission.points
      .map((point, index) =>
        buildWaylinePlacemark(route, mission, point, index, options, groupId)
          .map((line) => `    ${line}`)
          .join("\n")
      )
      .join("\n"),
    "  </Folder>",
    "</Document>",
    "</kml>",
  ];

  return documentParts.filter(Boolean).join("\n");
}

function buildMissionConfig(route: RouteRecordModel, device: WaylineDevicePreset) {
  const finishAction = mapFinishAction(route.globalConfig.finishAction);
  const exitOnRCLost = mapExitOnRCLost(route.globalConfig.signalLossAction);
  const executeRCLostAction = mapExecuteRCLostAction(route.globalConfig.signalLossAction);
  const missionConfig = [
    "<wpml:missionConfig>",
    "  <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>",
    `  <wpml:finishAction>${finishAction}</wpml:finishAction>`,
    `  <wpml:exitOnRCLost>${exitOnRCLost}</wpml:exitOnRCLost>`,
  ];

  if (executeRCLostAction) {
    missionConfig.push(
      `  <wpml:executeRCLostAction>${executeRCLostAction}</wpml:executeRCLostAction>`
    );
  }

  missionConfig.push(
    `  <wpml:takeOffSecurityHeight>${formatNumber(route.globalConfig.takeoffHeight, 2)}</wpml:takeOffSecurityHeight>`,
    `  <wpml:globalTransitionalSpeed>${formatNumber(route.globalConfig.routeSpeed, 2)}</wpml:globalTransitionalSpeed>`,
    "  <wpml:droneInfo>",
    `    <wpml:droneEnumValue>${device.droneEnumValue}</wpml:droneEnumValue>`,
    `    <wpml:droneSubEnumValue>${device.droneSubEnumValue}</wpml:droneSubEnumValue>`,
    "  </wpml:droneInfo>",
    "  <wpml:payloadInfo>",
    `    <wpml:payloadEnumValue>${device.payloadEnumValue}</wpml:payloadEnumValue>`,
    `    <wpml:payloadSubEnumValue>${device.payloadSubEnumValue}</wpml:payloadSubEnumValue>`,
    `    <wpml:payloadPositionIndex>${device.payloadPositionIndex}</wpml:payloadPositionIndex>`,
    "  </wpml:payloadInfo>",
    "</wpml:missionConfig>"
  );

  return missionConfig;
}

function buildTemplatePlacemark(
  route: RouteRecordModel,
  mission: DispatchMission,
  point: DispatchPoint,
  index: number,
  options: WaylineBuildOptions,
  groupId: { value: number }
) {
  const lines = [
    "<Placemark>",
    "  <Point>",
    `    <coordinates>${formatCoordinate(point.lng)},${formatCoordinate(point.lat)}</coordinates>`,
    "  </Point>",
    `  <wpml:index>${index}</wpml:index>`,
    "  <wpml:useGlobalHeight>0</wpml:useGlobalHeight>",
    `  <wpml:ellipsoidHeight>${formatNumber(point.alt, 2)}</wpml:ellipsoidHeight>`,
    `  <wpml:height>${formatNumber(point.alt, 2)}</wpml:height>`,
    "  <wpml:useGlobalSpeed>1</wpml:useGlobalSpeed>",
    "  <wpml:useGlobalHeadingParam>0</wpml:useGlobalHeadingParam>",
    ...indentLines(buildWaypointHeadingParam(route, point), 1),
    "  <wpml:useGlobalTurnParam>1</wpml:useGlobalTurnParam>",
    `  <wpml:gimbalPitchAngle>${formatNumber(point.gimbalPitch, 2)}</wpml:gimbalPitchAngle>`,
    ...indentLines(buildActionGroups(route, mission, point, index, options, groupId), 1),
    "</Placemark>",
  ];

  return lines;
}

function buildWaylinePlacemark(
  route: RouteRecordModel,
  mission: DispatchMission,
  point: DispatchPoint,
  index: number,
  options: WaylineBuildOptions,
  groupId: { value: number }
) {
  const lines = [
    "<Placemark>",
    "  <Point>",
    `    <coordinates>${formatCoordinate(point.lng)},${formatCoordinate(point.lat)}</coordinates>`,
    "  </Point>",
    `  <wpml:index>${index}</wpml:index>`,
    `  <wpml:executeHeight>${formatNumber(point.alt, 2)}</wpml:executeHeight>`,
    `  <wpml:waypointSpeed>${formatNumber(route.globalConfig.routeSpeed, 2)}</wpml:waypointSpeed>`,
    ...indentLines(buildWaypointHeadingParam(route, point), 1),
    "  <wpml:waypointTurnParam>",
    "    <wpml:waypointTurnMode>toPointAndStopWithDiscontinuityCurvature</wpml:waypointTurnMode>",
    "    <wpml:waypointTurnDampingDist>0</wpml:waypointTurnDampingDist>",
    "  </wpml:waypointTurnParam>",
    ...indentLines(buildActionGroups(route, mission, point, index, options, groupId), 1),
    "</Placemark>",
  ];

  return lines;
}

function buildWaypointHeadingParam(route: RouteRecordModel, point: DispatchPoint) {
  if (
    route.routeType === RouteType.LOOP &&
    route.loopConfig.targetPoint &&
    route.loopConfig.yawMode === "track"
  ) {
    return [
      "<wpml:waypointHeadingParam>",
      "  <wpml:waypointHeadingMode>towardPOI</wpml:waypointHeadingMode>",
      `  <wpml:waypointPoiPoint>${formatCoordinate(route.loopConfig.targetPoint.lng)},${formatCoordinate(route.loopConfig.targetPoint.lat)},0</wpml:waypointPoiPoint>`,
      "  <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>",
      "</wpml:waypointHeadingParam>",
    ];
  }

  if (route.routeType === RouteType.POINT && route.pointConfig.yawMode === "manual") {
    return [
      "<wpml:waypointHeadingParam>",
      "  <wpml:waypointHeadingMode>smoothTransition</wpml:waypointHeadingMode>",
      `  <wpml:waypointHeadingAngle>${formatNumber(point.yaw, 2)}</wpml:waypointHeadingAngle>`,
      "  <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>",
      "</wpml:waypointHeadingParam>",
    ];
  }

  return [
    "<wpml:waypointHeadingParam>",
    "  <wpml:waypointHeadingMode>followWayline</wpml:waypointHeadingMode>",
    "</wpml:waypointHeadingParam>",
  ];
}

function buildActionGroups(
  route: RouteRecordModel,
  mission: DispatchMission,
  point: DispatchPoint,
  index: number,
  options: WaylineBuildOptions,
  groupId: { value: number }
) {
  const groups: string[] = [];
  const pointActions = buildPointActions(route, point, options.device, index);

  if (pointActions.length > 0) {
    groups.push(
      buildActionGroupXml({
        groupId: groupId.value++,
        startIndex: index,
        endIndex: index,
        triggerType: "reachPoint",
        actions: pointActions,
      })
    );
  }

  if (index === 0 && mission.intervalCapture && mission.points.length > 1) {
    groups.push(
      buildActionGroupXml({
        groupId: groupId.value++,
        startIndex: 0,
        endIndex: mission.points.length - 1,
        triggerType: mission.intervalCapture.triggerType,
        triggerParam: mission.intervalCapture.triggerParam,
        actions: [
          buildTakePhotoAction(
            options.device,
            `${sanitizeSuffix(route.routeName)}-${route.routeType}`,
            getPayloadLensIndex(route.globalConfig.cameraMode, options.device)
          ),
        ],
      })
    );
  }

  return groups;
}

function buildPointActions(
  route: RouteRecordModel,
  point: DispatchPoint,
  device: WaylineDevicePreset,
  index: number
) {
  const actions: string[] = [];
  const lensIndex = getPayloadLensIndex(route.globalConfig.cameraMode, device);

  if (route.routeType === RouteType.POINT || point.preflight || index === 0) {
    actions.push(buildGimbalRotateAction(device, point.gimbalPitch));
  }
  if (point.startRecord) {
    actions.push(
      buildStartRecordAction(device, `${sanitizeSuffix(route.routeName)}-${index + 1}`, lensIndex)
    );
  }
  if (point.hoverSeconds > 0) {
    actions.push(buildHoverAction(point.hoverSeconds));
  }
  if (point.shootPhoto) {
    actions.push(
      buildTakePhotoAction(device, `${sanitizeSuffix(route.routeName)}-${index + 1}`, lensIndex)
    );
  }
  if (point.stopRecord) {
    actions.push(buildStopRecordAction(device, lensIndex));
  }

  return actions;
}

function buildActionGroupXml(options: {
  groupId: number;
  startIndex: number;
  endIndex: number;
  triggerType: "reachPoint" | "multipleTiming" | "multipleDistance";
  triggerParam?: number;
  actions: string[];
}) {
  const lines = [
    "<wpml:actionGroup>",
    `  <wpml:actionGroupId>${options.groupId}</wpml:actionGroupId>`,
    `  <wpml:actionGroupStartIndex>${options.startIndex}</wpml:actionGroupStartIndex>`,
    `  <wpml:actionGroupEndIndex>${options.endIndex}</wpml:actionGroupEndIndex>`,
    "  <wpml:actionGroupMode>sequence</wpml:actionGroupMode>",
    "  <wpml:actionTrigger>",
    `    <wpml:actionTriggerType>${options.triggerType}</wpml:actionTriggerType>`,
  ];

  if (options.triggerType !== "reachPoint" && options.triggerParam) {
    lines.push(
      `    <wpml:actionTriggerParam>${formatNumber(options.triggerParam, 2)}</wpml:actionTriggerParam>`
    );
  }

  lines.push("  </wpml:actionTrigger>");

  options.actions.forEach((actionXml, index) => {
    const actionLines = actionXml
      .replace("{{ACTION_ID}}", String(index))
      .split("\n")
      .map((line) => `  ${line}`);
    lines.push(...actionLines);
  });

  lines.push("</wpml:actionGroup>");
  return lines.join("\n");
}

function buildGimbalRotateAction(device: WaylineDevicePreset, gimbalPitch: number) {
  return [
    "<wpml:action>",
    "  <wpml:actionId>{{ACTION_ID}}</wpml:actionId>",
    "  <wpml:actionActuatorFunc>gimbalRotate</wpml:actionActuatorFunc>",
    "  <wpml:actionActuatorFuncParam>",
    `    <wpml:payloadPositionIndex>${device.payloadPositionIndex}</wpml:payloadPositionIndex>`,
    "    <wpml:gimbalHeadingYawBase>north</wpml:gimbalHeadingYawBase>",
    "    <wpml:gimbalRotateMode>absoluteAngle</wpml:gimbalRotateMode>",
    "    <wpml:gimbalPitchRotateEnable>1</wpml:gimbalPitchRotateEnable>",
    `    <wpml:gimbalPitchRotateAngle>${formatNumber(gimbalPitch, 2)}</wpml:gimbalPitchRotateAngle>`,
    "    <wpml:gimbalRollRotateEnable>0</wpml:gimbalRollRotateEnable>",
    "    <wpml:gimbalRollRotateAngle>0</wpml:gimbalRollRotateAngle>",
    "    <wpml:gimbalYawRotateEnable>0</wpml:gimbalYawRotateEnable>",
    "    <wpml:gimbalYawRotateAngle>0</wpml:gimbalYawRotateAngle>",
    "    <wpml:gimbalRotateTimeEnable>0</wpml:gimbalRotateTimeEnable>",
    "    <wpml:gimbalRotateTime>0</wpml:gimbalRotateTime>",
    "  </wpml:actionActuatorFuncParam>",
    "</wpml:action>",
  ].join("\n");
}

function buildHoverAction(hoverSeconds: number) {
  return [
    "<wpml:action>",
    "  <wpml:actionId>{{ACTION_ID}}</wpml:actionId>",
    "  <wpml:actionActuatorFunc>hover</wpml:actionActuatorFunc>",
    "  <wpml:actionActuatorFuncParam>",
    `    <wpml:hoverTime>${formatNumber(hoverSeconds, 2)}</wpml:hoverTime>`,
    "  </wpml:actionActuatorFuncParam>",
    "</wpml:action>",
  ].join("\n");
}

function buildTakePhotoAction(device: WaylineDevicePreset, fileSuffix: string, lensIndex?: string) {
  return [
    "<wpml:action>",
    "  <wpml:actionId>{{ACTION_ID}}</wpml:actionId>",
    "  <wpml:actionActuatorFunc>takePhoto</wpml:actionActuatorFunc>",
    "  <wpml:actionActuatorFuncParam>",
    `    <wpml:payloadPositionIndex>${device.payloadPositionIndex}</wpml:payloadPositionIndex>`,
    `    <wpml:fileSuffix>${escapeXml(fileSuffix)}</wpml:fileSuffix>`,
    `    <wpml:payloadLensIndex>${lensIndex || "wide"}</wpml:payloadLensIndex>`,
    "    <wpml:useGlobalPayloadLensIndex>0</wpml:useGlobalPayloadLensIndex>",
    "  </wpml:actionActuatorFuncParam>",
    "</wpml:action>",
  ].join("\n");
}

function buildStartRecordAction(
  device: WaylineDevicePreset,
  fileSuffix: string,
  lensIndex?: string
) {
  return [
    "<wpml:action>",
    "  <wpml:actionId>{{ACTION_ID}}</wpml:actionId>",
    "  <wpml:actionActuatorFunc>startRecord</wpml:actionActuatorFunc>",
    "  <wpml:actionActuatorFuncParam>",
    `    <wpml:payloadPositionIndex>${device.payloadPositionIndex}</wpml:payloadPositionIndex>`,
    `    <wpml:fileSuffix>${escapeXml(fileSuffix)}</wpml:fileSuffix>`,
    `    <wpml:payloadLensIndex>${lensIndex || "wide"}</wpml:payloadLensIndex>`,
    "    <wpml:useGlobalPayloadLensIndex>0</wpml:useGlobalPayloadLensIndex>",
    "  </wpml:actionActuatorFuncParam>",
    "</wpml:action>",
  ].join("\n");
}

function buildStopRecordAction(device: WaylineDevicePreset, lensIndex?: string) {
  return [
    "<wpml:action>",
    "  <wpml:actionId>{{ACTION_ID}}</wpml:actionId>",
    "  <wpml:actionActuatorFunc>stopRecord</wpml:actionActuatorFunc>",
    "  <wpml:actionActuatorFuncParam>",
    `    <wpml:payloadPositionIndex>${device.payloadPositionIndex}</wpml:payloadPositionIndex>`,
    `    <wpml:payloadLensIndex>${lensIndex || "wide"}</wpml:payloadLensIndex>`,
    "  </wpml:actionActuatorFuncParam>",
    "</wpml:action>",
  ].join("\n");
}

function mapFinishAction(action: RouteRecordModel["globalConfig"]["finishAction"]) {
  if (action === "land") return "autoLand";
  if (action === "hover") return "noAction";
  return "goHome";
}

function mapExitOnRCLost(action: RouteRecordModel["globalConfig"]["signalLossAction"]) {
  return action === "continue" ? "goContinue" : "executeLostAction";
}

function mapExecuteRCLostAction(action: RouteRecordModel["globalConfig"]["signalLossAction"]) {
  if (action === "continue") return "";
  return action === "hover" ? "hover" : "goBack";
}

function getPayloadLensIndex(cameraMode: CameraMode, device: WaylineDevicePreset) {
  if (cameraMode === "infrared" && device.supportsInfrared) {
    return "ir";
  }
  return "wide";
}

function sanitizeSuffix(value: string) {
  return (value || "wayline").trim().replace(/[\\/:*?"<>|\s]+/g, "-") || "wayline";
}

function offsetCoordinate(lng: number, lat: number, distance: number, bearing: number) {
  const angularDistance = distance / EARTH_RADIUS;
  const bearingRadians = toRadians(bearing);
  const latRadians = toRadians(lat);
  const lngRadians = toRadians(lng);
  const targetLat = Math.asin(
    Math.sin(latRadians) * Math.cos(angularDistance) +
      Math.cos(latRadians) * Math.sin(angularDistance) * Math.cos(bearingRadians)
  );
  const targetLng =
    lngRadians +
    Math.atan2(
      Math.sin(bearingRadians) * Math.sin(angularDistance) * Math.cos(latRadians),
      Math.cos(angularDistance) - Math.sin(latRadians) * Math.sin(targetLat)
    );

  return {
    lng: toDegrees(targetLng),
    lat: toDegrees(targetLat),
  };
}

function buildZipBlob(entries: Array<{ name: string; data: Uint8Array }>) {
  const date = new Date();
  const { dosTime, dosDate } = getDosDateTime(date);
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = new TextEncoder().encode(entry.name);
    const crc = crc32(entry.data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, entry.data.length, true);
    localView.setUint32(22, entry.data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, entry.data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, entry.data.length, true);
    centralView.setUint32(24, entry.data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + entry.data.length;
  });

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const endHeader = new Uint8Array(22);
  const endView = new DataView(endHeader.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  const blobParts = [...localParts, ...centralParts, endHeader].map(
    (part) => Uint8Array.from(part).buffer
  );

  return new Blob(blobParts, {
    type: "application/vnd.google-earth.kmz",
  });
}

function getDosDateTime(date: Date) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

let crcTable: Uint32Array | null = null;

function crc32(data: Uint8Array) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let crc = index;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
      }
      crcTable[index] = crc >>> 0;
    }
  }

  let crc = 0xffffffff;
  data.forEach((byte) => {
    crc = crcTable![(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });

  return (crc ^ 0xffffffff) >>> 0;
}

function indentLines(lines: string | string[], level: number) {
  const list = Array.isArray(lines) ? lines : [lines];
  if (list.length === 0) {
    return [];
  }
  const indent = "  ".repeat(level);
  return list
    .flatMap((line) => line.split("\n"))
    .filter((line) => line.trim().length > 0)
    .map((line) => `${indent}${line}`);
}

function formatCoordinate(value: number) {
  return formatNumber(value, 7);
}

function formatNumber(value: number, precision = 6) {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Number(value.toFixed(precision)).toString();
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}
