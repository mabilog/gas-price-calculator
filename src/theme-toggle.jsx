import { useState } from "preact/hooks";
import { THEMES, applyTheme, loadTheme } from "./theme.js";

const LABELS = { system: "System", light: "Light", dark: "Dark" };

export function ThemeToggle() {
  const [theme, setTheme] = useState(loadTheme);

  function choose(next) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div class="theme" role="group" aria-label="Theme">
      {THEMES.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={theme === key}
          onClick={() => choose(key)}
        >
          {LABELS[key]}
        </button>
      ))}
    </div>
  );
}
