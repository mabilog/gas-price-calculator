# Gas price converter

A small, mobile-first Preact app that converts fuel prices between currencies and volume units. Type a pump price, choose its currency and unit, and see it in another currency and unit.

Live site: https://mabilog.github.io/gas-price-calculator/

## Features

- Currencies: USD, CAD, EUR, GBP, MXN, AUD, JPY
- Units: litre, US gallon, imperial gallon
- Swap button to flip the two sides
- Exchange rates fetched per currency pair, with a manual override
- Rates cached in the browser (`localStorage`), so a refresh works offline

## Conversion

Volume units are fixed ratios:

- 1 US gallon = 3.785411784 L
- 1 imperial gallon = 4.54609 L

Converting a price:

```
price in target = price in source × rate × (litres in target / litres in source)
```

`rate` is units of the target currency per 1 unit of the source currency.

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
  app.jsx      UI: inputs, selects, result, rate field
  convert.js   Currency list, unit table, conversion formula
  rate.js      Frankfurter fetch and localStorage cache
  app.css      Styles
  index.css    Global base styles
```

`vite.config.js` sets `base: '/gas-price-calculator/'` so asset paths work on GitHub Pages.
