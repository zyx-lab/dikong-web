import * as THREE from "three";

export interface DashboardSceneRuntime {
  destroy(): void;
  resize(): void;
}

export function mountDashboardScene(canvas: HTMLCanvasElement): DashboardSceneRuntime {
  let renderer: THREE.WebGLRenderer | null = null;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

  camera.position.set(0, 2.2, 7.5);

  if (typeof canvas.getContext !== "function") {
    return {
      destroy() {},
      resize() {},
    };
  }

  const hasWebglContext = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  if (!hasWebglContext) {
    return {
      destroy() {},
      resize() {},
    };
  }

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
  } catch {
    return {
      destroy() {},
      resize() {},
    };
  }

  function resize() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer?.setSize(width, height, false);
    renderer?.render(scene, camera);
  }

  resize();

  return {
    destroy() {
      renderer?.dispose();
    },
    resize,
  };
}
