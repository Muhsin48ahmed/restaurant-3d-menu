"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

// Scans come in at real-world scale (a croissant is ~0.2 units); normalise
// them so lighting and shadows behave the same for every dish.
export const SCAN_SIZE = 2;

type Props = { url: string; onReady?: () => void };

/**
 * Renders a photogrammetry scan (Polycam, Luma, Poly Haven…) exported as
 * .glb, scaled to a common size and resting on the ground plane.
 */
export function ScannedDish({ url, onReady }: Props) {
  const { scene } = useGLTF(url);

  const { model, scale, offset } = useMemo(() => {
    // Clone so the cached glTF scene is never altered.
    const clone = scene.clone(true);
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const fit = SCAN_SIZE / Math.max(size.x, size.y, size.z, 1e-6);

    return {
      model: clone,
      scale: fit,
      offset: [-center.x * fit, -box.min.y * fit, -center.z * fit] as const,
    };
  }, [scene]);

  // Suspense only renders this once the file is decoded, so it's ready now.
  useEffect(() => {
    onReady?.();
  }, [model, onReady]);

  return (
    <group position={offset} scale={scale}>
      <primitive object={model} />
    </group>
  );
}
