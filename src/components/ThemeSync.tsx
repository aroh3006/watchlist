"use client";

import { useLayoutEffect } from "react";
import { resolveTheme, applyThemeClass } from "@/lib/theme";

/**
 * Safety net for the blocking init script in the root layout. That script
 * only runs once, on the very first HTML parse. If React ever has to
 * throw away a mismatched server render and recreate the tree from
 * scratch client-side (a hydration error unrelated to theming, e.g. a
 * server/client date formatting mismatch elsewhere on the page), it
 * recreates <html> too and the class the script added goes with it. This
 * reapplies it in a layout effect, which runs before the browser paints,
 * so a reset like that is invisible instead of flashing the wrong theme.
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    applyThemeClass(resolveTheme());
  });
  return null;
}
