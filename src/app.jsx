import { useEffect, useRef, useState } from "preact/hooks";
import { CURRENCIES, UNITS, convertPrice } from "./convert.js";
import {
  DISTANCES,
  FIGURES,
  figuresFromLitresPer100km,
  fillUpToLitresPer100km,
  knownFigures,
} from "./economy.js";
import { fetchRate, loadSavedRate, saveRate } from "./rate.js";
import "./app.css";

const UNIT_KEYS = Object.keys(UNITS);
const FIGURE_KEYS = Object.keys(FIGURES);

function formatFigure(kind, value) {
  if (value == null) return "—";
  const number = value.toFixed(1);
  if (kind === "L100") return `${number} L/100 km`;
  if (kind === "USMPG") return `${number} US mpg`;
  return `${number} imp mpg`;
}

export function App() {
  const [tab, setTab] = useState("price");

  return (
    <main>
      <h1>
        {tab === "price"
          ? "Gas price"
          : tab === "figure"
            ? "Fuel economy"
            : "Fill-up"}
      </h1>
      <div class="tabs" role="tablist" aria-label="Calculator">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "price"}
          onClick={() => setTab("price")}
        >
          Price
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "figure"}
          onClick={() => setTab("figure")}
        >
          Figure
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "fillup"}
          onClick={() => setTab("fillup")}
        >
          Fill-up
        </button>
      </div>
      {tab === "price" ? (
        <PriceTab />
      ) : tab === "figure" ? (
        <FigureTab />
      ) : (
        <FillUpTab />
      )}
    </main>
  );
}

function PriceTab() {
  const [from, setFrom] = useState({ currency: "USD", unit: "USGAL" });
  const [to, setTo] = useState({ currency: "CAD", unit: "L" });
  const [price, setPrice] = useState("");
  const [rate, setRate] = useState("");
  const [rateDate, setRateDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const sameCurrency = from.currency === to.currency;

  useEffect(() => {
    loadRate();
  }, [from.currency, to.currency]);

  async function loadRate({ force = false } = {}) {
    const id = ++requestId.current;

    if (sameCurrency) {
      setRate("1");
      setRateDate("");
      setError("");
      setLoading(false);
      return;
    }

    const saved = force ? null : loadSavedRate(from.currency, to.currency);
    if (saved) {
      setRate(saved.rate);
      setRateDate(saved.date);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const latest = await fetchRate(from.currency, to.currency);
      if (id !== requestId.current) return;
      setRate(latest.rate);
      setRateDate(latest.date);
    } catch {
      if (id !== requestId.current) return;
      setError("Could not load the latest rate.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function onRateInput(event) {
    requestId.current += 1;
    const value = event.currentTarget.value;
    setRate(value);
    setRateDate("");
    setError("");
    setLoading(false);
    if (Number(value) > 0) saveRate(from.currency, to.currency, value, "");
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const converted = convertPrice(price, rate, from.unit, to.unit);
  const result =
    converted == null
      ? null
      : `${to.currency} ${converted.toFixed(3)} / ${UNITS[to.unit].short}`;

  return (
    <>
      <section class="side">
        <label>
          Price per {UNITS[from.unit].name}
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={price}
            onInput={(event) => setPrice(event.currentTarget.value)}
          />
        </label>
        <div class="pair">
          <select
            aria-label="Currency you typed"
            value={from.currency}
            onChange={(event) =>
              setFrom({ ...from, currency: event.currentTarget.value })
            }
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <select
            aria-label="Unit you typed"
            value={from.unit}
            onChange={(event) =>
              setFrom({ ...from, unit: event.currentTarget.value })
            }
          >
            {UNIT_KEYS.map((key) => (
              <option key={key} value={key}>
                {UNITS[key].name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <button class="swap" type="button" onClick={swap}>
        Swap
      </button>

      <section class="side">
        <p class="side-label">Show in</p>
        <div class="pair">
          <select
            aria-label="Currency to show"
            value={to.currency}
            onChange={(event) =>
              setTo({ ...to, currency: event.currentTarget.value })
            }
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <select
            aria-label="Unit to show"
            value={to.unit}
            onChange={(event) =>
              setTo({ ...to, unit: event.currentTarget.value })
            }
          >
            {UNIT_KEYS.map((key) => (
              <option key={key} value={key}>
                {UNITS[key].name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <p class="result-label">Result</p>
      <p class="result" aria-live="polite">
        {result ?? "—"}
      </p>

      <label>
        1 {from.currency} = ? {to.currency}
        <input
          inputmode="decimal"
          enterkeyhint="done"
          autocomplete="off"
          value={rate}
          disabled={sameCurrency}
          onInput={onRateInput}
        />
      </label>

      {rateDate ? (
        <p class="meta">Rate from Frankfurter for {rateDate}</p>
      ) : null}
      {error ? <p class="error">{error}</p> : null}

      <button
        class="fetch"
        type="button"
        onClick={() => loadRate({ force: true })}
        disabled={loading || sameCurrency}
      >
        {loading ? "Loading…" : "Use latest rate"}
      </button>

      <p class="note">
        Units: 1 US gallon = 3.785 L, 1 imperial gallon = 4.546 L. Rates are
        daily reference rates, not what your bank or card charges.
      </p>
    </>
  );
}

function GallonNote() {
  return (
    <p class="note">
      A US gallon (3.785 L) and an imperial gallon (4.546 L) are different, so
      the two mpg figures are not the same.
    </p>
  );
}

function FigureTab() {
  const [figure, setFigure] = useState("");
  const [kind, setKind] = useState("L100");

  const known = knownFigures(figure, kind);
  const otherKinds = FIGURE_KEYS.filter((key) => key !== kind);

  return (
    <>
      <section class="side">
        <label>
          {FIGURES[kind].name}
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={figure}
            onInput={(event) => setFigure(event.currentTarget.value)}
          />
        </label>
        <select
          aria-label="Figure you typed"
          value={kind}
          onChange={(event) => setKind(event.currentTarget.value)}
        >
          {FIGURE_KEYS.map((key) => (
            <option key={key} value={key}>
              {FIGURES[key].name}
            </option>
          ))}
        </select>
        <ul class="figures" aria-live="polite">
          {otherKinds.map((key) => (
            <li key={key}>
              <span>{FIGURES[key].name}</span>
              <span class="value">{formatFigure(key, known?.[key])}</span>
            </li>
          ))}
        </ul>
      </section>
      <GallonNote />
    </>
  );
}

function FillUpTab() {
  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [fuel, setFuel] = useState("");
  const [fuelUnit, setFuelUnit] = useState("L");

  const trip = figuresFromLitresPer100km(
    fillUpToLitresPer100km(distance, distanceUnit, fuel, fuelUnit),
  );

  return (
    <>
      <section class="side">
        <label>
          Distance
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={distance}
            onInput={(event) => setDistance(event.currentTarget.value)}
          />
        </label>
        <select
          aria-label="Distance unit"
          value={distanceUnit}
          onChange={(event) => setDistanceUnit(event.currentTarget.value)}
        >
          {Object.entries(DISTANCES).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
        <label>
          Fuel put back in
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={fuel}
            onInput={(event) => setFuel(event.currentTarget.value)}
          />
        </label>
        <select
          aria-label="Fuel unit"
          value={fuelUnit}
          onChange={(event) => setFuelUnit(event.currentTarget.value)}
        >
          {UNIT_KEYS.map((key) => (
            <option key={key} value={key}>
              {UNITS[key].name}
            </option>
          ))}
        </select>
        <ul class="figures" aria-live="polite">
          {FIGURE_KEYS.map((key) => (
            <li key={key}>
              <span>{FIGURES[key].name}</span>
              <span class="value">{formatFigure(key, trip?.[key])}</span>
            </li>
          ))}
        </ul>
      </section>
      <GallonNote />
    </>
  );
}
