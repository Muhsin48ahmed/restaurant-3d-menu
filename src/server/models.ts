import { existsSync } from "node:fs";
import path from "node:path";

const MODELS_DIR = path.join(process.cwd(), "public", "models");
const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * Picks the 3D model for a dish: an explicit `modelUrl` wins, otherwise a
 * scan dropped at public/models/<slug>.glb is used automatically.
 */
export function resolveModelUrl(slug: string, modelUrl: string | null): string | null {
  if (modelUrl) return modelUrl;
  if (!SLUG_PATTERN.test(slug)) return null;
  return existsSync(path.join(MODELS_DIR, `${slug}.glb`)) ? `/models/${slug}.glb` : null;
}
