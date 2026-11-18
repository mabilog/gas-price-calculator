import { useState } from "preact/hooks";
import { FIGURES, knownFigures } from "./economy.js";
import { EFFICIENCIES, compareCosts, knownEfficiencies } from "./electric.js";

const FIGURE_KEYS = Object.keys(FIGURES);
const EFFICIENCY_KEYS = Object.keys(EFFICIENCIES);

function CostList({ title, costs }) {
  return (
    <>
      <p class="side-label">{title}</p>
      <ul class="figures" aria-live="polite">
        <li>
          <span>Per 100 km</span>
          <span class="value">{costs ? costs.per100km.toFixed(2) : "—"}</span>
        </li>
        <li>
          <span>Per km</span>
          <span class="value">{costs ? costs.perKm.toFixed(3) : "—"}</span>
        </li>
        <li>
          <span>Per mile</span>
          <span class="value">{costs ? costs.perMile.toFixed(3) : "—"}</span>
        </li>
      </ul>
    </>
  );
}

export function CompareMode() {
  const [gasFigure, setGasFigure] = useState("");
  const [gasKind, setGasKind] = useState("L100");
  const [gasPrice, setGasPrice] = useState("");
  const [evFigure, setEvFigure] = useState("");
  const [evKind, setEvKind] = useState("KWH100");
  const [kwhPrice, setKwhPrice] = useState("");

  const comparison = compareCosts({
    gasLitresPer100km: knownFigures(gasFigure, gasKind)?.L100,
    gasPricePerLitre: gasPrice,
    evKwhPer100km: knownEfficiencies(evFigure, evKind)?.KWH100,
    pricePerKwh: kwhPrice,
  });

  let verdict = "—";
  if (comparison) {
    if (comparison.cheaper === "same") {
      verdict = "Both cost the same";
    } else {
      const name = comparison.cheaper === "gas" ? "Gas" : "Electric";
      verdict = `${name} is cheaper by ${comparison.difference.toFixed(2)} per 100 km (${comparison.percent.toFixed(0)}%)`;
    }
  }

  return (
    <>
      <h1>Gas vs electric</h1>

      <section class="side">
        <p class="side-label">Gas car</p>
        <label>
          {FIGURES[gasKind].name}
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={gasFigure}
            onInput={(event) => setGasFigure(event.currentTarget.value)}
          />
        </label>
        <select
          aria-label="Gas figure you typed"
          value={gasKind}
          onChange={(event) => setGasKind(event.currentTarget.value)}
        >
          {FIGURE_KEYS.map((key) => (
            <option key={key} value={key}>
              {FIGURES[key].name}
            </option>
          ))}
        </select>
        <label>
          Price per litre
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={gasPrice}
            onInput={(event) => setGasPrice(event.currentTarget.value)}
          />
        </label>
      </section>

      <section class="side">
        <p class="side-label">Electric car</p>
        <label>
          {EFFICIENCIES[evKind].name}
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={evFigure}
            onInput={(event) => setEvFigure(event.currentTarget.value)}
          />
        </label>
        <select
          aria-label="Electric figure you typed"
          value={evKind}
          onChange={(event) => setEvKind(event.currentTarget.value)}
        >
          {EFFICIENCY_KEYS.map((key) => (
            <option key={key} value={key}>
              {EFFICIENCIES[key].name}
            </option>
          ))}
        </select>
        <label>
          Price per kWh
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={kwhPrice}
            onInput={(event) => setKwhPrice(event.currentTarget.value)}
          />
        </label>
      </section>

      <p class="result-label">Result</p>
      <p class="verdict" aria-live="polite">
        {verdict}
      </p>
      <CostList title="Gas" costs={comparison?.gas} />
      <CostList title="Electric" costs={comparison?.ev} />

      <p class="note">
        Costs are in whatever currency you typed the prices in, so use the same
        currency for both. Charging losses are not included.
      </p>
    </>
  );
}
