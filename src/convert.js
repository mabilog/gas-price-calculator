export const LITERS_PER_US_GALLON = 3.785411784

export function usdPerGallonToCadPerLiter(usdPerGallon, cadPerUsd) {
  return (usdPerGallon * cadPerUsd) / LITERS_PER_US_GALLON
}

export function cadPerLiterToUsdPerGallon(cadPerLiter, cadPerUsd) {
  return (cadPerLiter * LITERS_PER_US_GALLON) / cadPerUsd
}

export function parsePositive(value) {
  const number = Number(String(value).trim())
  if (!Number.isFinite(number) || number <= 0) return null
  return number
}

export function convertPrice(price, rate, direction) {
  const amount = parsePositive(price)
  const cadPerUsd = parsePositive(rate)
  if (amount == null || cadPerUsd == null) return null

  return direction === 'usd'
    ? usdPerGallonToCadPerLiter(amount, cadPerUsd)
    : cadPerLiterToUsdPerGallon(amount, cadPerUsd)
}
