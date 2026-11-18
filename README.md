# Gas price converter

A small, mobile-first Preact app with three modes, switched at the top of the page.

**Gas** has three tabs. **Price** converts a pump price between currencies and volume units. **Figure** converts a known fuel-economy number between L/100 km and miles per gallon. **Fill-up** works out that figure from how far you drove and how much fuel you put back in the tank.

**Electric** has three tabs. **Efficiency** converts between kWh/100 km, km/kWh, mi/kWh, and MPGe. **Charge** works out efficiency and cost from how far you drove and how much energy you added, and keeps a history. **Time** estimates how long a charge takes and what it costs.

**Compare** puts a gas car and an electric car side by side on running cost.

Live site: https://mabilog.github.io/gas-price-calculator/

## Features

Price tab:

- Currencies: USD, CAD, EUR, GBP, MXN, AUD, JPY
- Units: litre, US gallon, imperial gallon
- Swap button to flip the two sides
- Exchange rates fetched per currency pair, with a manual override
- Rates cached in the browser (`localStorage`). A fetched rate expires after 24 hours and is refetched; if that fails (for example offline), the last saved rate is shown. A rate you type yourself never expires.

Figure tab:

- Convert a known figure between L/100 km, US mpg, and imperial mpg

Fill-up tab:

- Distance in kilometres or miles
- Fuel put back in litres, US gallons, or imperial gallons
- Results: L/100 km, US mpg, and imperial mpg
- Optional price per fuel unit, for the total cost and the cost per km and per mile
- Save fill-ups to a history (kept in `localStorage`), with delete and clear
- Average over all saved fill-ups: total fuel divided by total distance, not the mean of each trip. It is only accurate if you fill the tank to full every time.

Electric mode:

- Efficiency tab: convert a known figure between kWh/100 km, km/kWh, mi/kWh, and US MPGe
- Charge tab: distance in kilometres or miles plus energy added in kWh gives the four efficiency figures. An optional price per kWh adds the total cost and the cost per km and per mile.
- Save charges to a history (kept in `localStorage`), with delete and clear. The average is total kWh divided by total distance, not the mean of each trip.
- Time tab: battery size, start and end percentage, charger power, charging efficiency (90% by default), and an optional price per kWh give the charging time, the energy added to the battery, the energy drawn from the wall, and the cost

Compare mode:

- Gas car: a known figure (L/100 km, US mpg, or imperial mpg) and a price per litre
- Electric car: a known figure (kWh/100 km, km/kWh, mi/kWh, or US MPGe) and a price per kWh
- Shows the running cost per 100 km, per km, and per mile for each, and which is cheaper and by how much. Use the same currency for both prices.

Dark mode:

- Follows the system light or dark setting by default
- A System / Light / Dark control at the bottom of the page overrides it; the choice is saved in `localStorage`

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

Electric efficiency (`C` is kWh/100 km):

```
km/kWh  = 100 / C
mi/kWh  = 100 / (C × 1.609344)
MPGe    = mi/kWh × 33.705
```

MPGe uses the EPA figure of 33.705 kWh per US gallon of gasoline, so it is a US MPGe only.

Charging time:

```
added  = battery × (end% − start%) / 100
billed = added / charging efficiency
hours  = billed / charger power
cost   = billed × price per kWh
```

This assumes a constant charging speed. Real charging slows down above about 80%, so the time is a minimum. You pay for the energy drawn from the wall, which is why cost uses `billed`.

Running cost comparison:

```
gas per 100 km      = L/100 km × price per litre
electric per 100 km = kWh/100 km × price per kWh
```

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

## Install on iPhone

The app is a home-screen web app (PWA), so it needs no App Store account.

1. Open https://mabilog.github.io/gas-price-calculator/ in Safari.
2. Tap the Share button, then **Add to Home Screen**.
3. Open it from the home screen. It runs full screen and loads without a connection once it has been opened online.

The app shell (code, styles and icons) is cached by a service worker that `vite-plugin-pwa` generates at build time. Exchange rates are not cached by the service worker. They are still stored in `localStorage` as described above.

## Project structure

```
src/
  app.jsx      Mode switch (Gas, Electric, Compare) and footer
  gas.jsx      Gas mode: Price, Figure, and Fill-up tabs
  electric.jsx Electric mode: Efficiency, Charge, and Time tabs
  compare.jsx  Compare mode: gas vs electric running cost
  tabs.jsx     Shared tab bar used by the mode switch and the modes
  convert.js   Currency list, unit table, price formula
  economy.js   L/100 km, mpg, fill-up, and trip cost formulas
  electric.js  kWh/100 km, MPGe, charge time, and cost comparison formulas
  history.js   Saved fill-ups and charges (localStorage) and weighted averages
  rate.js      Frankfurter fetch and localStorage cache with expiry
  theme.js     Theme choice (system, light, dark), saved in localStorage
  theme-toggle.jsx  System / Light / Dark control
  app.css      Styles
  index.css    Global base styles and light/dark colour variables
public/
  favicon.svg           Site icon
  apple-touch-icon.png  iPhone home-screen icon (180x180, full square)
  icon-192.png          Manifest icon
  icon-512.png          Manifest icon
```

`vite.config.js` sets `base: '/gas-price-calculator/'` so asset paths work on GitHub Pages. It also configures the web app manifest and the service worker through `vite-plugin-pwa`.
