// Multiple airports on the ceiling: the home airport (`airport`) plus
// display-only extras. Home stays first and is never lost.

import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, mergeConfig } from "../src/config.js";
import { SFO_AIRPORT, addAirport, listAirports, makeHomeAirport, removeAirport, type Airport } from "../src/airport.js";

const ap = (icao: string, name: string): Airport => ({ icao, name, lat: 37.7, lon: -122.2, runways: [] });
const OAK = ap("KOAK", "OAK");
const SJC = ap("KSJC", "SJC");

describe("airport list", () => {
  it("lists home first, without duplicates", () => {
    expect(listAirports({ airport: SFO_AIRPORT, extraAirports: [OAK, SFO_AIRPORT, OAK] }).map((a) => a.icao)).toEqual([
      "KSFO",
      "KOAK",
    ]);
  });

  it("adds extras and refreshes an airport already shown", () => {
    let s = addAirport({ airport: SFO_AIRPORT, extraAirports: [] }, OAK);
    s = addAirport(s, SJC);
    expect(listAirports(s).map((a) => a.icao)).toEqual(["KSFO", "KOAK", "KSJC"]);
    const oak2 = { ...OAK, fullName: "Oakland" };
    s = addAirport(s, oak2);
    expect(s.extraAirports).toEqual([oak2, SJC]);
    const sfo2 = { ...SFO_AIRPORT, name: "SFO2" };
    expect(addAirport(s, sfo2).airport).toBe(sfo2);
  });

  it("makes an extra the home, keeping the old home as an extra", () => {
    const s = makeHomeAirport({ airport: SFO_AIRPORT, extraAirports: [OAK, SJC] }, "koak");
    expect(s.airport).toBe(OAK);
    expect(s.extraAirports.map((a) => a.icao)).toEqual(["KSFO", "KSJC"]);
    // Unknown code: unchanged.
    expect(makeHomeAirport(s, "EGLL").airport).toBe(OAK);
  });

  it("removing the home promotes the first extra; the last one stays", () => {
    const s = removeAirport({ airport: SFO_AIRPORT, extraAirports: [OAK, SJC] }, "KSFO");
    expect(s.airport).toBe(OAK);
    expect(s.extraAirports).toEqual([SJC]);
    expect(removeAirport(s, "KSJC")).toEqual({ airport: OAK, extraAirports: [] });
    expect(removeAirport({ airport: OAK, extraAirports: [] }, "KOAK").airport).toBe(OAK);
  });
});

describe("mergeConfig extraAirports", () => {
  it("defaults to none for a config saved before multi-airport", () => {
    const old = mergeConfig(DEFAULT_CONFIG, { airport: OAK } as never);
    expect(old.airport).toBe(OAK);
    expect(old.extraAirports).toEqual([]);
  });

  it("replaces the list on patch and ignores a malformed value", () => {
    const withExtras = mergeConfig(DEFAULT_CONFIG, { extraAirports: [OAK] });
    expect(withExtras.extraAirports).toEqual([OAK]);
    expect(mergeConfig(withExtras, { radiusMiles: 5 }).extraAirports).toEqual([OAK]);
    expect(mergeConfig(withExtras, { extraAirports: "nope" } as never).extraAirports).toEqual([OAK]);
  });
});
