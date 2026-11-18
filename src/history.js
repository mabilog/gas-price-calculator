const FILLUPS_KEY = "fillups";
const CHARGES_KEY = "charges";

function hasBase(entry) {
  return (
    entry != null &&
    typeof entry.id === "number" &&
    typeof entry.date === "string" &&
    Number.isFinite(entry.km) &&
    entry.km > 0
  );
}

function isFillUp(entry) {
  return hasBase(entry) && Number.isFinite(entry.litres) && entry.litres > 0;
}

function isCharge(entry) {
  return hasBase(entry) && Number.isFinite(entry.kwh) && entry.kwh > 0;
}

function loadList(key, isValid) {
  try {
    const list = JSON.parse(localStorage.getItem(key));
    return Array.isArray(list) ? list.filter(isValid) : [];
  } catch {
    return [];
  }
}

function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage can be full or blocked. The in-memory list still works.
  }
}

function today() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

// Total energy over total distance, not the mean of per-trip figures.
function weightedPer100km(list, field) {
  const km = list.reduce((sum, entry) => sum + entry.km, 0);
  const amount = list.reduce((sum, entry) => sum + entry[field], 0);
  return km > 0 ? (amount / km) * 100 : null;
}

export function loadHistory() {
  return loadList(FILLUPS_KEY, isFillUp);
}

export function saveHistory(list) {
  saveList(FILLUPS_KEY, list);
}

// Entries are stored in km and litres, so later unit changes don't affect them.
export function makeEntry({ km, litres, cost }) {
  return { id: Date.now(), date: today(), km, litres, cost: cost ?? null };
}

export function averageLitresPer100km(list) {
  return weightedPer100km(list, "litres");
}

export function loadCharges() {
  return loadList(CHARGES_KEY, isCharge);
}

export function saveCharges(list) {
  saveList(CHARGES_KEY, list);
}

// Entries are stored in km and kWh, so later unit changes don't affect them.
export function makeCharge({ km, kwh, cost }) {
  return { id: Date.now(), date: today(), km, kwh, cost: cost ?? null };
}

export function averageKwhPer100km(list) {
  return weightedPer100km(list, "kwh");
}
