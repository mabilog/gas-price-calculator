export const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "MXN", "AUD", "JPY"];

export const UNITS = {
  L: { name: "litre", short: "L", litres: 1 },
  USGAL: { name: "US gallon", short: "US gal", litres: 3.785411784 },
  IMPGAL: { name: "imperial gallon", short: "imp gal", litres: 4.54609 },
};

export function parsePositive(value) {
  const number = Number(String(value).trim());
  if (!Number.isFinite(number) || number <= 0) return null;
  return number;
}

// `rate` is units of the target currency per 1 unit of the source currency.
// Price per target unit = price per source unit * rate * (litres in target / litres in source).
export function convertPrice(price, rate, fromUnit, toUnit) {
  const amount = parsePositive(price);
  const factor = parsePositive(rate);
  if (amount == null || factor == null) return null;

  return amount * factor * (UNITS[toUnit].litres / UNITS[fromUnit].litres);
}
