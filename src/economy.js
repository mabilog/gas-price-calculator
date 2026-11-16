import { UNITS, parsePositive } from "./convert.js";

export const KM_PER_MILE = 1.609344;

export const FIGURES = {
  L100: { name: "L/100 km" },
  USMPG: { name: "US mpg" },
  IMPMPG: { name: "imperial mpg" },
};

export const DISTANCES = {
  km: "kilometres",
  mi: "miles",
};

export function litresPer100kmToMpg(litresPer100km, gallon) {
  const consumption = parsePositive(litresPer100km);
  if (consumption == null) return null;
  return (100 * UNITS[gallon].litres) / (consumption * KM_PER_MILE);
}

export function mpgToLitresPer100km(mpg, gallon) {
  const milesPerGallon = parsePositive(mpg);
  if (milesPerGallon == null) return null;
  return (100 * UNITS[gallon].litres) / (milesPerGallon * KM_PER_MILE);
}

export function fillUpToLitresPer100km(distance, distanceUnit, fuel, fuelUnit) {
  const travelled = parsePositive(distance);
  const added = parsePositive(fuel);
  if (travelled == null || added == null) return null;

  const km = distanceUnit === "mi" ? travelled * KM_PER_MILE : travelled;
  const litres = added * UNITS[fuelUnit].litres;
  return (litres / km) * 100;
}

export function figuresFromLitresPer100km(litresPer100km) {
  const consumption = parsePositive(litresPer100km);
  if (consumption == null) return null;
  return {
    L100: consumption,
    USMPG: litresPer100kmToMpg(consumption, "USGAL"),
    IMPMPG: litresPer100kmToMpg(consumption, "IMPGAL"),
  };
}

export function knownFigures(value, kind) {
  if (kind === "L100") return figuresFromLitresPer100km(value);
  if (kind === "USMPG") {
    return figuresFromLitresPer100km(mpgToLitresPer100km(value, "USGAL"));
  }
  return figuresFromLitresPer100km(mpgToLitresPer100km(value, "IMPGAL"));
}
