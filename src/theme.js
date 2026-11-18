const KEY = "theme";

export const THEMES = ["system", "light", "dark"];

export function loadTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    return THEMES.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

// Match the mobile browser bar to the page background.
function updateThemeColor() {
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg")
    .trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && color) meta.setAttribute("content", color);
}

// "system" removes the attribute, so the prefers-color-scheme media query decides.
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light" || theme === "dark") {
    root.dataset.theme = theme;
  } else {
    delete root.dataset.theme;
  }

  try {
    if (theme === "light" || theme === "dark") {
      localStorage.setItem(KEY, theme);
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    // Storage can be blocked. The theme still applies for this visit.
  }

  updateThemeColor();
}

export function initTheme() {
  applyTheme(loadTheme());

  // While on "system", keep the browser bar colour in step with the OS.
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", updateThemeColor);
}
