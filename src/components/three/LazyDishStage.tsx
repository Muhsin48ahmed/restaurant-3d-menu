"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser, so the stage is loaded client-side.
// DishViewer draws its own loading state, so none is rendered here.
export const LazyDishStage = dynamic(() => import("./DishStage"), { ssr: false });
