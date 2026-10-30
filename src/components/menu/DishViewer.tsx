"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { LazyDishStage } from "@/components/three/LazyDishStage";

export type ViewerDish = {
  slug: string;
  name: string;
  modelUrl: string | null;
  imageUrl: string | null;
};

type Mode = "3d" | "photo";
type LoadState = "loading" | "ready" | "error";

type Props = { dish: ViewerDish; sizes: string; className?: string; priority?: boolean };

/**
 * Shows a dish as an interactive 3D scan when one exists, otherwise its
 * photo. Remount with `key={dish.slug}` to reset state between dishes.
 */
export function DishViewer({ dish, sizes, className = "", priority = false }: Props) {
  const hasModel = Boolean(dish.modelUrl);
  const [mode, setMode] = useState<Mode>(hasModel ? "3d" : "photo");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const handleReady = useCallback(() => setLoadState("ready"), []);
  const handleError = useCallback(() => setLoadState("error"), []);

  const show3d = hasModel && mode === "3d" && loadState !== "error";
  const canToggle = hasModel && Boolean(dish.imageUrl) && loadState !== "error";

  return (
    <div className={`relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#fbf8f3_0%,#efe8dc_70%)] ${className}`}>
      {!show3d && dish.imageUrl && (
        <Image src={dish.imageUrl} alt={dish.name} fill sizes={sizes} priority={priority} className="object-cover" />
      )}

      {show3d && dish.modelUrl && (
        <>
          <LazyDishStage
            slug={dish.slug}
            modelUrl={dish.modelUrl}
            label={`Interactive 3D scan of ${dish.name}. Drag to turn it, scroll or pinch to zoom.`}
            onReady={handleReady}
            onError={handleError}
          />
          <p
            aria-live="polite"
            className={`pointer-events-none absolute inset-x-0 bottom-5 text-center text-[0.65rem] tracking-[var(--tracking-label)] text-muted uppercase transition-opacity duration-500 ${
              loadState === "loading" ? "opacity-100" : "opacity-0"
            }`}
          >
            Loading 3D scan…
          </p>
        </>
      )}

      {canToggle && <ModeToggle mode={mode} onChange={setMode} />}
      {show3d && loadState === "ready" && (
        <p className="pointer-events-none absolute bottom-4 left-5 text-[0.65rem] tracking-[var(--tracking-label)] text-muted uppercase">
          Drag to turn
        </p>
      )}
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="absolute top-4 right-4 flex border border-ink/15 bg-paper/85 backdrop-blur" role="group" aria-label="View as">
      {(["3d", "photo"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={mode === option}
          onClick={() => onChange(option)}
          className={`min-h-9 px-3.5 text-[0.62rem] font-semibold tracking-[var(--tracking-label)] uppercase transition-colors ${
            mode === option ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
          }`}
        >
          {option === "3d" ? "3D scan" : "Photo"}
        </button>
      ))}
    </div>
  );
}
