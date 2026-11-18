import { parsePositive } from "./convert.js";
import { KM_PER_MILE } from "./economy.js";

// EPA figure: one US gallon of gasoline holds as much energy as this many kWh.
export const KWH_PER_US_GALLON = 33.705;

// The canonical figure is kWh/100 km, like L/100 km for gas.
export const EFFICIENCIES = {
  KWH100: { name: "kWh/100 km" },
  KMKWH: { name: "km/kWh" },
  MIKWH: { name: "mi/kWh" },
  MPGE: { name: "US MPGe" },
};

export function kwhPer100kmToKmPerKwh(kwhPer100km) {
  const consumption = parsePositive(kwhPer100km);
  if (consumption == null) return null;
  return 100 / consumption;
}

export function kwhPer100kmToMilesPerKwh(kwhPer100km) {
  const kmPerKwh = kwhPer100kmToKmPerKwh(kwhPer100km);
  return kmPerKwh == null ? null : kmPerKwh / KM_PER_MILE;
}

export function efficiencyFromKwhPer100km(kwhPer100km) {
  const consumption = parsePositive(kwhPer100km);
  if (consumption == null) return null;
  const milesPerKwh = kwhPer100kmToMilesPerKwh(consumption);
  return {
    KWH100: consumption,
    KMKWH: kwhPer100kmToKmPerKwh(consumption),
    MIKWH: milesPerKwh,
    MPGE: milesPerKwh * KWH_PER_US_GALLON,
  };
}

// Turns a figure of any kind into kWh/100 km, or null if it is not a positive number.
export function toKwhPer100km(value, kind) {
  const number = parsePositive(value);
  if (number == null) return null;
  if (kind === "KWH100") return number;
  if (kind === "KMKWH") return 100 / number;
  if (kind === "MIKWH") return 100 / (number * KM_PER_MILE);
  return (100 * KWH_PER_US_GALLON) / (number * KM_PER_MILE);
}

export function knownEfficiencies(value, kind) {
  return efficiencyFromKwhPer100km(toKwhPer100km(value, kind));
}

export function sessionToKwhPer100km(distance, distanceUnit, kwh) {
  const travelled = parsePositive(distance);
  const added = parsePositive(kwh);
  if (travelled == null || added == null) return null;

  const km = distanceUnit === "mi" ? travelled * KM_PER_MILE : travelled;
  return (added / km) * 100;
}

// Assumes constant charging power. Real charging slows down near 80%, so the
// time is a lower bound. `price` is optional and is per kWh drawn from the wall.
export function chargeTime({
  capacity,
  startPercent,
  endPercent,
  power,
  efficiency,
  price,
}) {
  const battery = parsePositive(capacity);
  const kilowatts = parsePositive(power);
  const start = Number(String(startPercent).trim());
  const end = Number(String(endPercent).trim());
  const loss = parsePositive(efficiency);
  if (battery == null || kilowatts == null || loss == null) return null;
  if (String(startPercent).trim() === "" || String(endPercent).trim() === "") {
    return null;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0 || end > 100 || end <= start || loss > 100) return null;

  const added = (battery * (end - start)) / 100;
  const billed = added / (loss / 100);
  const hours = billed / kilowatts;
  const unitPrice = parsePositive(price);
  return {
    added,
    billed,
    hours,
    cost: unitPrice == null ? null : billed * unitPrice,
  };
}

function costs(per100km) {
  const perKm = per100km / 100;
  return { per100km, perKm, perMile: perKm * KM_PER_MILE };
}

// Gas and electricity are assumed to be priced in the same currency.
export function compareCosts({
  gasLitresPer100km,
  gasPricePerLitre,
  evKwhPer100km,
  pricePerKwh,
}) {
  const litres = parsePositive(gasLitresPer100km);
  const litrePrice = parsePositive(gasPricePerLitre);
  const kwh = parsePositive(evKwhPer100km);
  const kwhPrice = parsePositive(pricePerKwh);
  if (litres == null || litrePrice == null) return null;
  if (kwh == null || kwhPrice == null) return null;

  const gas = costs(litres * litrePrice);
  const ev = costs(kwh * kwhPrice);
  const difference = Math.abs(gas.per100km - ev.per100km);
  const dearer = Math.max(gas.per100km, ev.per100km);
  const cheaper =
    gas.per100km === ev.per100km ? "same" : gas.per100km < ev.per100km ? "gas" : "ev";
  return { gas, ev, cheaper, difference, percent: (difference / dearer) * 100 };
}
