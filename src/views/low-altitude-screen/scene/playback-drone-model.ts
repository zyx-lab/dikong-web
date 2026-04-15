import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

const DRONE_MODEL_URL = "/flying_drone_animation.glb";
const DRONE_MODEL_TARGET_SIZE = 18;
export const PLAYBACK_DRONE_MODEL_YAW_OFFSET_DEG = 180;

export interface PlaybackDroneModelRuntime {
  root: THREE.Group;
  setHeadingDegrees(headingDeg: number): void;
  setPosition(position: THREE.Vector3): void;
  update(deltaTime: number): void;
  dispose(): void;
}

export async function loadPlaybackDroneModelRuntime(): Promise<PlaybackDroneModelRuntime> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(DRONE_MODEL_URL);
  const root = new THREE.Group();
  root.name = "PlaybackDroneModelRoot";

  const droneScene = normalizeDroneScene(gltf);
  root.add(droneScene);

  const mixer = createAnimationMixer(droneScene, gltf);

  return {
    root,
    setHeadingDegrees(headingDeg: number) {
      root.rotation.set(0, THREE.MathUtils.degToRad(headingDeg), 0);
    },
    setPosition(position: THREE.Vector3) {
      root.position.copy(position);
    },
    update(deltaTime: number) {
      mixer?.update(deltaTime);
    },
    dispose() {
      mixer?.stopAllAction();
      if (mixer) {
        mixer.uncacheRoot(droneScene);
      }
      disposeObject3D(root);
      root.removeFromParent();
    },
  };
}

function normalizeDroneScene(gltf: GLTF): THREE.Group {
  const droneScene = gltf.scene;
  const box = new THREE.Box3().setFromObject(droneScene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const scale = DRONE_MODEL_TARGET_SIZE / maxDimension;

  droneScene.position.sub(center);
  droneScene.scale.setScalar(scale);
  droneScene.rotation.y = THREE.MathUtils.degToRad(PLAYBACK_DRONE_MODEL_YAW_OFFSET_DEG);

  droneScene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.frustumCulled = false;
    child.castShadow = false;
    child.receiveShadow = false;
  });

  return droneScene;
}

function createAnimationMixer(
  droneScene: THREE.Group,
  gltf: GLTF
): THREE.AnimationMixer | undefined {
  if (!gltf.animations.length) {
    return undefined;
  }

  const mixer = new THREE.AnimationMixer(droneScene);
  mixer.clipAction(gltf.animations[0]).play();
  return mixer;
}

function disposeMaterial(material: THREE.Material): void {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  });
  material.dispose();
}

function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.geometry.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
      return;
    }

    if (child.material) {
      disposeMaterial(child.material);
    }
  });
}
