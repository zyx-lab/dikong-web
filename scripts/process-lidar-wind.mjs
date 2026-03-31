import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const projectRoot = path.resolve(new URL(".", import.meta.url).pathname, "..");
const inputPath = path.resolve(
  projectRoot,
  "public/secondWindSpeed_GHH234012_20260116.csv"
);
const outputDir = path.resolve(projectRoot, "public/generated");
const outputPath = path.resolve(
  outputDir,
  "secondWindSpeed_GHH234012_20260116.processed.json"
);

const DISPLAY_MAX_HEIGHT = 5.8;
const SAMPLE_INTERVAL_SECONDS = 1;
const DISPLAY_DURATION_SECONDS = 180;
const INVALID_VALUE = -1000;

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeNumber(value) {
  if (value === null) return null;
  return Math.abs(value - INVALID_VALUE) < 1e-6 ? null : value;
}

function ensureFrame(frames, index, timestamp, elapsedSeconds) {
  if (!frames[index]) {
    frames[index] = {
      index,
      timestamp,
      elapsedSeconds,
      samplesByLayer: new Map(),
    };
  }
  return frames[index];
}

function ensureLayerAggregate(frame, layerIndex) {
  if (!frame.samplesByLayer.has(layerIndex)) {
    frame.samplesByLayer.set(layerIndex, {
      layerIndex,
      sumVectorX: 0,
      sumVectorZ: 0,
      vectorCount: 0,
      sumVerticalSpeed: 0,
      verticalCount: 0,
      sumTi: 0,
      tiCount: 0,
      sumSnr: 0,
      snrCount: 0,
      valid: false,
    });
  }
  return frame.samplesByLayer.get(layerIndex);
}

function toFixedNumber(value, digits = 6) {
  return Number(value.toFixed(digits));
}

async function main() {
  const input = fs.createReadStream(inputPath, { encoding: "utf8" });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  const frames = [];
  const layerMeta = new Map();
  let headerIndex = null;
  let startTimestampMs = null;
  let firstTimestampIso = null;
  let beamElevationDeg = null;

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (!headerIndex) {
      const headers = line.split(",");
      headerIndex = Object.fromEntries(headers.map((header, index) => [header.trim(), index]));
      continue;
    }

    const values = line.split(",");
    const timestampText = values[headerIndex.TimeStamp];
    const timestampMs = Date.parse(timestampText.replace(" ", "T") + "+08:00");
    if (!Number.isFinite(timestampMs)) {
      throw new Error(`Invalid timestamp: ${timestampText}`);
    }

    if (startTimestampMs === null) {
      startTimestampMs = timestampMs;
      firstTimestampIso = new Date(timestampMs).toISOString();
    }

    const elapsedSeconds = Math.floor((timestampMs - startTimestampMs) / 1000);
    const bucketIndex = Math.floor(elapsedSeconds / SAMPLE_INTERVAL_SECONDS);
    if (bucketIndex >= DISPLAY_DURATION_SECONDS) {
      break;
    }

    const layerIndex = Number(values[headerIndex.Layers]);
    const distance = Number(values[headerIndex.Distance]);
    const elevationDeg = Number(values[headerIndex.Beam_Ele_A]);

    if (!layerMeta.has(layerIndex)) {
      const height = distance * Math.sin((elevationDeg * Math.PI) / 180);
      const radius = distance * Math.cos((elevationDeg * Math.PI) / 180);
      layerMeta.set(layerIndex, {
        layerIndex,
        slantDistance: distance,
        height,
        radius,
      });
    }
    beamElevationDeg = elevationDeg;

    const frame = ensureFrame(frames, bucketIndex, timestampText, bucketIndex * SAMPLE_INTERVAL_SECONDS);
    const aggregate = ensureLayerAggregate(frame, layerIndex);

    const validSpeedFlag = Number(values[headerIndex.Bool_Center_H_Speed]) === 1;
    const speed = sanitizeNumber(parseNumber(values[headerIndex.Center_H_Speed]));
    const directionDeg = sanitizeNumber(parseNumber(values[headerIndex.Center_H_Direction_Abs]));
    const verticalSpeed = sanitizeNumber(parseNumber(values[headerIndex.Vert_Airflow]));
    const ti = sanitizeNumber(parseNumber(values[headerIndex.Ti]));
    const snr = sanitizeNumber(parseNumber(values[headerIndex.SNR]));

    if (validSpeedFlag && speed !== null && directionDeg !== null) {
      const flowDirectionRad = ((directionDeg + 180) * Math.PI) / 180;
      aggregate.sumVectorX += speed * Math.sin(flowDirectionRad);
      aggregate.sumVectorZ += speed * Math.cos(flowDirectionRad);
      aggregate.vectorCount += 1;
      aggregate.valid = true;
    }

    if (verticalSpeed !== null) {
      aggregate.sumVerticalSpeed += verticalSpeed;
      aggregate.verticalCount += 1;
    }
    if (ti !== null) {
      aggregate.sumTi += ti;
      aggregate.tiCount += 1;
    }
    if (snr !== null) {
      aggregate.sumSnr += snr;
      aggregate.snrCount += 1;
    }
  }

  const sortedLayers = [...layerMeta.values()].sort((a, b) => a.layerIndex - b.layerIndex);
  const maxPhysicalHeight = Math.max(...sortedLayers.map((layer) => layer.height), 1);
  const displayScale = DISPLAY_MAX_HEIGHT / maxPhysicalHeight;

  let maxHorizontalSpeed = 0;
  let maxAbsVerticalSpeed = 0;

  const processedFrames = frames
    .filter(Boolean)
    .map((frame) => {
      const samples = sortedLayers.map((layer) => {
        const aggregate = frame.samplesByLayer.get(layer.layerIndex);
        if (!aggregate || aggregate.vectorCount === 0) {
          const verticalSpeed =
            aggregate && aggregate.verticalCount > 0
              ? aggregate.sumVerticalSpeed / aggregate.verticalCount
              : null;
          if (verticalSpeed !== null) {
            maxAbsVerticalSpeed = Math.max(maxAbsVerticalSpeed, Math.abs(verticalSpeed));
          }
          return {
            layerIndex: layer.layerIndex,
            valid: false,
            speed: null,
            directionDeg: null,
            flowDirectionDeg: null,
            vectorX: null,
            vectorZ: null,
            verticalSpeed: verticalSpeed === null ? null : toFixedNumber(verticalSpeed),
            ti:
              aggregate && aggregate.tiCount > 0
                ? toFixedNumber(aggregate.sumTi / aggregate.tiCount)
                : null,
            snr:
              aggregate && aggregate.snrCount > 0
                ? toFixedNumber(aggregate.sumSnr / aggregate.snrCount)
                : null,
          };
        }

        const vectorX = aggregate.sumVectorX / aggregate.vectorCount;
        const vectorZ = aggregate.sumVectorZ / aggregate.vectorCount;
        const speed = Math.hypot(vectorX, vectorZ);
        const flowDirectionDeg = (Math.atan2(vectorX, vectorZ) * 180) / Math.PI;
        const directionDeg = (flowDirectionDeg + 180 + 360) % 360;
        const verticalSpeed =
          aggregate.verticalCount > 0 ? aggregate.sumVerticalSpeed / aggregate.verticalCount : null;
        const ti = aggregate.tiCount > 0 ? aggregate.sumTi / aggregate.tiCount : null;
        const snr = aggregate.snrCount > 0 ? aggregate.sumSnr / aggregate.snrCount : null;

        maxHorizontalSpeed = Math.max(maxHorizontalSpeed, speed);
        if (verticalSpeed !== null) {
          maxAbsVerticalSpeed = Math.max(maxAbsVerticalSpeed, Math.abs(verticalSpeed));
        }

        return {
          layerIndex: layer.layerIndex,
          valid: true,
          speed: toFixedNumber(speed),
          directionDeg: toFixedNumber(directionDeg),
          flowDirectionDeg: toFixedNumber((flowDirectionDeg + 360) % 360),
          vectorX: toFixedNumber(vectorX),
          vectorZ: toFixedNumber(vectorZ),
          verticalSpeed: verticalSpeed === null ? null : toFixedNumber(verticalSpeed),
          ti: ti === null ? null : toFixedNumber(ti),
          snr: snr === null ? null : toFixedNumber(snr),
        };
      });

      return {
        index: frame.index,
        timestamp: frame.timestamp,
        elapsedSeconds: frame.elapsedSeconds,
        samples,
      };
    });

  const output = {
    meta: {
      sourceFile: path.basename(inputPath),
      startTime: firstTimestampIso,
      durationSeconds: processedFrames.length * SAMPLE_INTERVAL_SECONDS,
      displayDurationSeconds: DISPLAY_DURATION_SECONDS,
      sampleIntervalSeconds: SAMPLE_INTERVAL_SECONDS,
      beamElevationDeg,
      layerCount: sortedLayers.length,
      invalidValue: INVALID_VALUE,
      displayScale: toFixedNumber(displayScale),
      maxHorizontalSpeed: toFixedNumber(maxHorizontalSpeed),
      maxAbsVerticalSpeed: toFixedNumber(maxAbsVerticalSpeed),
      directionConvention: "Center_H_Direction_Abs interpreted as meteorological source direction; flow vectors point toward direction + 180 deg.",
    },
    layers: sortedLayers.map((layer) => ({
      layerIndex: layer.layerIndex,
      slantDistance: toFixedNumber(layer.slantDistance),
      height: toFixedNumber(layer.height),
      radius: toFixedNumber(layer.radius),
      displayHeight: toFixedNumber(layer.height * displayScale),
      displayRadius: toFixedNumber(layer.radius * displayScale),
    })),
    frames: processedFrames,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output));
  console.log(`Generated ${path.relative(projectRoot, outputPath)} with ${processedFrames.length} frames.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
