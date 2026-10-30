"use client";

import { Bounds, ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef, type ReactNode } from "react";
import type { Group } from "three";
import { useInView, usePrefersReducedMotion } from "./hooks";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { SCAN_SIZE, ScannedDish } from "./ScannedDish";

export type StageProps = {
  slug: string;
  modelUrl: string;
  label: string;
  onReady: () => void;
  onError: () => void;
};

const ENTRANCE_SPEED = 5;
const AUTO_ROTATE_SPEED = 0.7;
const BOUNDS_MARGIN = 1.5;

/** Eases a newly loaded scan up from slightly smaller, for a calm reveal. */
function Entrance({ children, animate }: { children: ReactNode; animate: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    const group = ref.current;
    if (!group || !animate || group.scale.x > 0.999) return;
    const step = 1 - Math.exp(-ENTRANCE_SPEED * delta);
    group.scale.setScalar(group.scale.x + (1 - group.scale.x) * step);
  });
  return (
    <group ref={ref} scale={animate ? 0.92 : 1}>
      {children}
    </group>
  );
}

/** Soft, neutral studio light built locally, so no HDRI is downloaded. */
function Studio() {
  return (
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
      <Lightformer form="rect" intensity={1.4} color="#fff4e6" position={[-4, 1.5, 2]} rotation-y={Math.PI / 3} scale={[4, 2, 1]} />
      <Lightformer form="rect" intensity={0.8} position={[4, 1, -2]} rotation-y={-Math.PI / 3} scale={[4, 2, 1]} />
    </Environment>
  );
}

export default function DishStage({ slug, modelUrl, label, onReady, onError }: StageProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [containerRef, isInView] = useInView<HTMLDivElement>();

  return (
    <div ref={containerRef} className="h-full w-full" role="img" aria-label={label}>
      <Canvas
        shadows
        dpr={[1, 2]}
        frameloop={isInView ? "always" : "never"}
        camera={{ position: [0, 1.4, 3.2], fov: 30 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight castShadow position={[2.5, 5, 3]} intensity={1.6} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
        <Studio />

        <ModelErrorBoundary resetKey={modelUrl} onError={onError}>
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={BOUNDS_MARGIN}>
              <Entrance key={slug} animate={!reducedMotion}>
                <ScannedDish url={modelUrl} onReady={onReady} />
              </Entrance>
            </Bounds>
          </Suspense>
        </ModelErrorBoundary>

        <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={SCAN_SIZE * 2} blur={2.6} far={SCAN_SIZE} resolution={512} />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          minPolarAngle={Math.PI * 0.12}
          maxPolarAngle={Math.PI * 0.47}
          autoRotate={!reducedMotion}
          autoRotateSpeed={AUTO_ROTATE_SPEED}
        />
      </Canvas>
    </div>
  );
}
