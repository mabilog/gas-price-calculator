import { useState } from "preact/hooks";
import { CompareMode } from "./compare.jsx";
import { ElectricMode } from "./electric.jsx";
import { GasMode } from "./gas.jsx";
import { Tabs } from "./tabs.jsx";
import { ThemeToggle } from "./theme-toggle.jsx";
import "./app.css";

const MODES = [
  { id: "gas", label: "Gas" },
  { id: "electric", label: "Electric" },
  { id: "compare", label: "Compare" },
];

export function App() {
  const [mode, setMode] = useState("gas");

  return (
    <main>
      <Tabs
        tabs={MODES}
        value={mode}
        onChange={setMode}
        label="Mode"
        variant="modes"
      />
      {mode === "gas" ? (
        <GasMode />
      ) : mode === "electric" ? (
        <ElectricMode />
      ) : (
        <CompareMode />
      )}
      <footer>
        <ThemeToggle />
      </footer>
    </main>
  );
}
