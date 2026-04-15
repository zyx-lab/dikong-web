export interface LowAltitudeScreenLocationLike {
  hash: string;
  search: string;
}

function resolveLocationQuery({ hash, search }: LowAltitudeScreenLocationLike) {
  const hashQueryIndex = hash.indexOf("?");
  const hashQuery = hashQueryIndex >= 0 ? hash.slice(hashQueryIndex + 1) : "";
  const searchQuery = search.replace(/^\?/, "");

  return new URLSearchParams(hashQuery || searchQuery);
}

export function shouldShowSceneCalibrationPanel(location: LowAltitudeScreenLocationLike) {
  return resolveLocationQuery(location).get("calibrate") === "1";
}
