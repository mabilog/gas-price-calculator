import { useEffect, useRef, useState } from "preact/hooks";
import { CURRENCIES, UNITS, convertPrice } from "./convert.js";
import {
  DISTANCES,
  FIGURES,
  KM_PER_MILE,
  figuresFromLitresPer100km,
  fillUpCost,
  fillUpToLitresPer100km,
  knownFigures,
} from "./economy.js";
import {
  averageLitresPer100km,
  loadHistory,
  makeEntry,
  saveHistory,
} from "./history.js";
import { fetchRate, loadSavedRate, saveRate } from "./rate.js";
import { Tabs } from "./tabs.jsx";

const UNIT_KEYS = Object.keys(UNITS);
const FIGURE_KEYS = Object.keys(FIGURES);

function formatFigure(kind, value) {
  if (value == null) return "—";
  const number = value.toFixed(1);
  if (kind === "L100") return `${number} L/100 km`;
  if (kind === "USMPG") return `${number} US mpg`;
  return `${number} imp mpg`;
}

const GAS_TABS = [
  { id: "price", label: "Price", heading: "Gas price" },
  { id: "figure", label: "Figure", heading: "Fuel economy" },
  { id: "fillup", label: "Fill-up", heading: "Fill-up" },
];

export function GasMode() {
  const [tab, setTab] = useState("price");
  const current = GAS_TABS.find((item) => item.id === tab);

  return (
    <>
      <h1>{current.heading}</h1>
      <Tabs tabs={GAS_TABS} value={tab} onChange={setTab} label="Gas calculator" />
      {tab === "price" ? (
        <PriceTab />
      ) : tab === "figure" ? (
        <FigureTab />
      ) : (
        <FillUpTab />
      )}
    </>
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
    if (saved && !saved.stale) {
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
      if (saved) {
        setRate(saved.rate);
        setRateDate(saved.date);
        setError("Couldn't refresh. Showing the last saved rate.");
      } else {
        setError("Could not load the latest rate.");
      }
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
    if (Number(value) > 0) {
      saveRate(from.currency, to.currency, value, "", true);
    }
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
  const [price, setPrice] = useState("");
  const [history, setHistory] = useState(loadHistory);

  const litresPer100km = fillUpToLitresPer100km(
    distance,
    distanceUnit,
    fuel,
    fuelUnit,
  );
  const trip = figuresFromLitresPer100km(litresPer100km);
  const cost = fillUpCost(fuel, price, distance, distanceUnit);
  const average = figuresFromLitresPer100km(averageLitresPer100km(history));

  function updateHistory(next) {
    setHistory(next);
    saveHistory(next);
  }

  function saveFillUp() {
    if (litresPer100km == null) return;
    const km =
      Number(distance) * (distanceUnit === "mi" ? KM_PER_MILE : 1);
    const litres = Number(fuel) * UNITS[fuelUnit].litres;
    const entry = makeEntry({ km, litres, cost: cost?.total });
    updateHistory([...history.filter((item) => item.id !== entry.id), entry]);
    setDistance("");
    setFuel("");
  }

  function deleteEntry(id) {
    updateHistory(history.filter((entry) => entry.id !== id));
  }

  function clearHistory() {
    if (window.confirm("Delete all saved fill-ups?")) updateHistory([]);
  }

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
        <label>
          Price per {UNITS[fuelUnit].name} (optional)
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={price}
            onInput={(event) => setPrice(event.currentTarget.value)}
          />
        </label>
        <ul class="figures" aria-live="polite">
          {FIGURE_KEYS.map((key) => (
            <li key={key}>
              <span>{FIGURES[key].name}</span>
              <span class="value">{formatFigure(key, trip?.[key])}</span>
            </li>
          ))}
        </ul>
        {cost ? (
          <ul class="figures" aria-live="polite">
            <li>
              <span>Total</span>
              <span class="value">{cost.total.toFixed(2)}</span>
            </li>
            <li>
              <span>Per km</span>
              <span class="value">{cost.perKm.toFixed(3)}</span>
            </li>
            <li>
              <span>Per mile</span>
              <span class="value">{cost.perMile.toFixed(3)}</span>
            </li>
          </ul>
        ) : null}
        <button
          class="fetch save"
          type="button"
          onClick={saveFillUp}
          disabled={litresPer100km == null}
        >
          Save fill-up
        </button>
      </section>

      {history.length > 0 ? (
        <section class="history">
          <h2>History</h2>
          <p class="side-label">
            Average over {history.length}{" "}
            {history.length === 1 ? "fill-up" : "fill-ups"}
          </p>
          <ul class="figures" aria-live="polite">
            {FIGURE_KEYS.map((key) => (
              <li key={key}>
                <span>{FIGURES[key].name}</span>
                <span class="value">{formatFigure(key, average?.[key])}</span>
              </li>
            ))}
          </ul>
          <ul class="entries">
            {[...history].reverse().map((entry) => (
              <li key={entry.id}>
                <div>
                  <span class="entry-date">{entry.date}</span>
                  <span>
                    {entry.km.toFixed(1)} km, {entry.litres.toFixed(2)} L
                    {entry.cost != null ? `, ${entry.cost.toFixed(2)}` : ""}
                  </span>
                  <span class="meta">
                    {((entry.litres / entry.km) * 100).toFixed(1)} L/100 km
                  </span>
                </div>
                <button
                  type="button"
                  class="secondary"
                  aria-label={`Delete fill-up from ${entry.date}`}
                  onClick={() => deleteEntry(entry.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <button class="secondary clear" type="button" onClick={clearHistory}>
            Clear history
          </button>
        </section>
      ) : null}

      <GallonNote />
      <p class="note">
        The average is only accurate if you fill the tank to full every time.
      </p>
    </>
  );
}
