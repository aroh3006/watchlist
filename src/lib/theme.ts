export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "watchlist-theme";

// Fired on window whenever the theme changes, so every mounted toggle (the
// sidebar footer and the Profile page both render one) can resync from the
// DOM instead of drifting out of sync with each other.
export const THEME_CHANGE_EVENT = "watchlist-theme-change";

export function getStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

export function getCurrentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// Resolves the theme the same way the blocking init script does: the
// stored choice if there is one, light otherwise. No OS preference here on
// purpose, a first visit with nothing stored always starts light.
export function resolveTheme(): Theme {
  return getStoredTheme() ?? "light";
}

export function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage can be unavailable (private browsing, disabled storage).
    // The toggle still works for the session, it just won't persist.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

// The exact logic the blocking inline script in the root layout runs before
// hydration, kept here too so anything that needs to compute it client-side
// (none of the app does today, this is just the one source of truth) agrees
// with what already ran. A first visit with no stored choice always starts
// light, the OS preference is never consulted.
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (stored === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;
