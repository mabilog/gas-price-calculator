import { useState } from "preact/hooks";
import { DISTANCES, KM_PER_MILE, fillUpCost } from "./economy.js";
import {
  EFFICIENCIES,
  chargeTime,
  efficiencyFromKwhPer100km,
  knownEfficiencies,
  sessionToKwhPer100km,
} from "./electric.js";
import {
  averageKwhPer100km,
  loadCharges,
  makeCharge,
  saveCharges,
} from "./history.js";
import { Tabs } from "./tabs.jsx";

const EFFICIENCY_KEYS = Object.keys(EFFICIENCIES);

export function formatEfficiency(kind, value) {
  if (value == null) return "—";
  if (kind === "KWH100") return `${value.toFixed(1)} kWh/100 km`;
  if (kind === "KMKWH") return `${value.toFixed(2)} km/kWh`;
  if (kind === "MIKWH") return `${value.toFixed(2)} mi/kWh`;
  return `${value.toFixed(1)} MPGe`;
}

function formatDuration(hours) {
  const minutes = Math.round(hours * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

const ELECTRIC_TABS = [
  { id: "efficiency", label: "Efficiency", heading: "Efficiency" },
  { id: "charge", label: "Charge", heading: "Charging" },
  { id: "time", label: "Time", heading: "Charge time" },
];

export function ElectricMode() {
  const [tab, setTab] = useState("efficiency");
  const current = ELECTRIC_TABS.find((item) => item.id === tab);

  return (
    <>
      <h1>{current.heading}</h1>
      <Tabs
        tabs={ELECTRIC_TABS}
        value={tab}
        onChange={setTab}
        label="Electric calculator"
      />
      {tab === "efficiency" ? (
        <EfficiencyTab />
      ) : tab === "charge" ? (
        <ChargeTab />
      ) : (
        <TimeTab />
      )}
    </>
  );
}

function EfficiencyNote() {
  return (
    <p class="note">
      MPGe uses the US gallon: 33.705 kWh of electricity holds as much energy
      as one US gallon of gasoline.
    </p>
  );
}

function EfficiencyTab() {
  const [figure, setFigure] = useState("");
  const [kind, setKind] = useState("KWH100");

  const known = knownEfficiencies(figure, kind);
  const otherKinds = EFFICIENCY_KEYS.filter((key) => key !== kind);

  return (
    <>
      <section class="side">
        <label>
          {EFFICIENCIES[kind].name}
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
          {EFFICIENCY_KEYS.map((key) => (
            <option key={key} value={key}>
              {EFFICIENCIES[key].name}
            </option>
          ))}
        </select>
        <ul class="figures" aria-live="polite">
          {otherKinds.map((key) => (
            <li key={key}>
              <span>{EFFICIENCIES[key].name}</span>
              <span class="value">{formatEfficiency(key, known?.[key])}</span>
            </li>
          ))}
        </ul>
      </section>
      <EfficiencyNote />
    </>
  );
}

function ChargeTab() {
  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [kwh, setKwh] = useState("");
  const [price, setPrice] = useState("");
  const [history, setHistory] = useState(loadCharges);

  const kwhPer100km = sessionToKwhPer100km(distance, distanceUnit, kwh);
  const trip = efficiencyFromKwhPer100km(kwhPer100km);
  const cost = fillUpCost(kwh, price, distance, distanceUnit);
  const average = efficiencyFromKwhPer100km(averageKwhPer100km(history));

  function updateHistory(next) {
    setHistory(next);
    saveCharges(next);
  }

  function saveCharge() {
    if (kwhPer100km == null) return;
    const km = Number(distance) * (distanceUnit === "mi" ? KM_PER_MILE : 1);
    const entry = makeCharge({ km, kwh: Number(kwh), cost: cost?.total });
    updateHistory([...history.filter((item) => item.id !== entry.id), entry]);
    setDistance("");
    setKwh("");
  }

  function deleteEntry(id) {
    updateHistory(history.filter((entry) => entry.id !== id));
  }

  function clearHistory() {
    if (window.confirm("Delete all saved charges?")) updateHistory([]);
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
          Energy added (kWh)
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={kwh}
            onInput={(event) => setKwh(event.currentTarget.value)}
          />
        </label>
        <label>
          Price per kWh (optional)
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={price}
            onInput={(event) => setPrice(event.currentTarget.value)}
          />
        </label>
        <ul class="figures" aria-live="polite">
          {EFFICIENCY_KEYS.map((key) => (
            <li key={key}>
              <span>{EFFICIENCIES[key].name}</span>
              <span class="value">{formatEfficiency(key, trip?.[key])}</span>
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
          onClick={saveCharge}
          disabled={kwhPer100km == null}
        >
          Save charge
        </button>
      </section>

      {history.length > 0 ? (
        <section class="history">
          <h2>History</h2>
          <p class="side-label">
            Average over {history.length}{" "}
            {history.length === 1 ? "charge" : "charges"}
          </p>
          <ul class="figures" aria-live="polite">
            {EFFICIENCY_KEYS.map((key) => (
              <li key={key}>
                <span>{EFFICIENCIES[key].name}</span>
                <span class="value">
                  {formatEfficiency(key, average?.[key])}
                </span>
              </li>
            ))}
          </ul>
          <ul class="entries">
            {[...history].reverse().map((entry) => (
              <li key={entry.id}>
                <div>
                  <span class="entry-date">{entry.date}</span>
                  <span>
                    {entry.km.toFixed(1)} km, {entry.kwh.toFixed(2)} kWh
                    {entry.cost != null ? `, ${entry.cost.toFixed(2)}` : ""}
                  </span>
                  <span class="meta">
                    {((entry.kwh / entry.km) * 100).toFixed(1)} kWh/100 km
                  </span>
                </div>
                <button
                  type="button"
                  class="secondary"
                  aria-label={`Delete charge from ${entry.date}`}
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

      <EfficiencyNote />
      <p class="note">
        The average assumes each charge covers the distance driven since the
        last one, charging to the same level each time.
      </p>
    </>
  );
}

function TimeTab() {
  const [capacity, setCapacity] = useState("");
  const [startPercent, setStartPercent] = useState("20");
  const [endPercent, setEndPercent] = useState("80");
  const [power, setPower] = useState("");
  const [efficiency, setEfficiency] = useState("90");
  const [price, setPrice] = useState("");

  const result = chargeTime({
    capacity,
    startPercent,
    endPercent,
    power,
    efficiency,
    price,
  });

  return (
    <>
      <section class="side">
        <label>
          Battery size (kWh)
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={capacity}
            onInput={(event) => setCapacity(event.currentTarget.value)}
          />
        </label>
        <div class="pair even">
          <label>
            Start (%)
            <input
              inputmode="decimal"
              enterkeyhint="done"
              autocomplete="off"
              value={startPercent}
              onInput={(event) => setStartPercent(event.currentTarget.value)}
            />
          </label>
          <label>
            End (%)
            <input
              inputmode="decimal"
              enterkeyhint="done"
              autocomplete="off"
              value={endPercent}
              onInput={(event) => setEndPercent(event.currentTarget.value)}
            />
          </label>
        </div>
        <label>
          Charger power (kW)
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={power}
            onInput={(event) => setPower(event.currentTarget.value)}
          />
        </label>
        <label>
          Charging efficiency (%)
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={efficiency}
            onInput={(event) => setEfficiency(event.currentTarget.value)}
          />
        </label>
        <label>
          Price per kWh (optional)
          <input
            inputmode="decimal"
            enterkeyhint="done"
            autocomplete="off"
            value={price}
            onInput={(event) => setPrice(event.currentTarget.value)}
          />
        </label>
        <ul class="figures" aria-live="polite">
          <li>
            <span>Time</span>
            <span class="value">
              {result ? formatDuration(result.hours) : "—"}
            </span>
          </li>
          <li>
            <span>Added to battery</span>
            <span class="value">
              {result ? `${result.added.toFixed(1)} kWh` : "—"}
            </span>
          </li>
          <li>
            <span>Drawn from the wall</span>
            <span class="value">
              {result ? `${result.billed.toFixed(1)} kWh` : "—"}
            </span>
          </li>
          {result?.cost != null ? (
            <li>
              <span>Cost</span>
              <span class="value">{result.cost.toFixed(2)}</span>
            </li>
          ) : null}
        </ul>
      </section>
      <p class="note">
        Assumes a constant charging speed. Real charging slows down above about
        80%, so treat the time as a minimum. The cost is for the energy drawn
        from the wall.
      </p>
    </>
  );
}
