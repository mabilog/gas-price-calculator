const STORAGE_KEY = 'gas-price-rate'
const RATE_URL = 'https://api.frankfurter.dev/v2/rate/usd/cad?providers=boc'

export function loadSavedRate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    const rate = typeof data.rate === 'number' ? String(data.rate) : data.rate
    if (typeof rate !== 'string' || !(Number(rate) > 0)) return null
    return {
      rate,
      date: typeof data.date === 'string' ? data.date : '',
    }
  } catch {
    return null
  }
}

export function saveRate(rate, date = '') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate, date }))
}

export async function fetchLatestRate() {
  const response = await fetch(RATE_URL)
  if (!response.ok) {
    throw new Error('Could not load the latest rate.')
  }

  const data = await response.json()
  const rate = Number(data.rate)
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Could not load the latest rate.')
  }

  const saved = {
    rate: String(rate),
    date: typeof data.date === 'string' ? data.date : '',
  }
  saveRate(saved.rate, saved.date)
  return saved
}
