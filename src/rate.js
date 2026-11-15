const RATE_URL = "https://api.frankfurter.dev/v2/rate";

function storageKey(from, to) {
  return `rate:${from}:${to}`;
}

export function loadSavedRate(from, to) {
  try {
    const raw = localStorage.getItem(storageKey(from, to));
    if (!raw) return null;
    const data = JSON.parse(raw);
    const rate = typeof data.rate === "number" ? String(data.rate) : data.rate;
    if (typeof rate !== "string" || !(Number(rate) > 0)) return null;
    return {
      rate,
      date: typeof data.date === "string" ? data.date : "",
    };
  } catch {
    return null;
  }
}

export function saveRate(from, to, rate, date = "") {
  localStorage.setItem(storageKey(from, to), JSON.stringify({ rate, date }));
}

export async function fetchRate(from, to) {
  const response = await fetch(
    `${RATE_URL}/${from.toLowerCase()}/${to.toLowerCase()}`,
  );
  if (!response.ok) {
    throw new Error("Could not load the latest rate.");
  }

  const data = await response.json();
  const rate = Number(data.rate);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Could not load the latest rate.");
  }

  const saved = {
    rate: String(rate),
    date: typeof data.date === "string" ? data.date : "",
  };
  saveRate(from, to, saved.rate, saved.date);
  return saved;
}
