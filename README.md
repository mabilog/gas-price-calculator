# Gas price converter

A small, mobile-first Preact app with three tabs. **Price** converts a pump price between currencies and volume units. **Figure** converts a known fuel-economy number between L/100 km and miles per gallon. **Fill-up** works out that figure from how far you drove and how much fuel you put back in the tank.

Live site: https://mabilog.github.io/gas-price-calculator/

## Features

Price tab:

- Currencies: USD, CAD, EUR, GBP, MXN, AUD, JPY
- Units: litre, US gallon, imperial gallon
- Swap button to flip the two sides
- Exchange rates fetched per currency pair, with a manual override
- Rates cached in the browser (`localStorage`), so a refresh works offline

Figure tab:

- Convert a known figure between L/100 km, US mpg, and imperial mpg

Fill-up tab:

- Distance in kilometres or miles
- Fuel put back in litres, US gallons, or imperial gallons
- Results: L/100 km, US mpg, and imperial mpg

## Conversion

Volume units are fixed ratios:

- 1 US gallon = 3.785411784 L
- 1 imperial gallon = 4.54609 L

Converting a price:

```
price in target = price in source × rate × (litres in target / litres in source)
```

`rate` is units of the target currency per 1 unit of the source currency.

Fuel economy uses the same gallon sizes and 1 mile = 1.609344 km.

From a fill-up:

```
litres  = fuel × litres in that unit
km      = distance, or distance × 1.609344 when entered in miles
L/100km = litres / km × 100
```

Between the rates (`C` is L/100 km):

```
mpg     = (100 × litres in one gallon) / (C × 1.609344)
L/100km = (100 × litres in one gallon) / (mpg × 1.609344)
```

US mpg is about `235.215 / C`. Imperial mpg is about `282.481 / C`. A US gallon and an imperial gallon are different sizes, so the two mpg numbers are not interchangeable.

## Exchange rates

Rates come from the free [Frankfurter](https://frankfurter.dev/) API. No API key is needed.

These are daily reference rates, not the rate your bank or card charges. Type the rate you actually get into the rate field to override it.

## Run locally

Requires Node.js 22.12 or newer (Vite 6 supports Node 18 and later, but the lockfile was generated on 22).

```bash
npm install
npm run dev
```

Open the URL Vite prints. The app is served under `/gas-price-calculator/`.

## Build

```bash
npm run build
npm run preview
```

The output goes to `dist/`.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes `dist/` to GitHub Pages.

One-time setup in the repository: **Settings → Pages → Source → GitHub Actions**.

## Project structure

```
src/
  app.jsx      UI: Price, Figure, and Fill-up tabs
  convert.js   Currency list, unit table, price formula
  economy.js   L/100 km, mpg, and fill-up formulas
  rate.js      Frankfurter fetch and localStorage cache
  app.css      Styles
  index.css    Global base styles
```

`vite.config.js` sets `base: '/gas-price-calculator/'` so asset paths work on GitHub Pages.
