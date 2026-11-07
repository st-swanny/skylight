// Airport runway geometry, drawn on the ceiling at true geographic position
// so departures and arrivals visibly line up with the runways. SFO ships as
// the default home airport; any other airport can be imported from the
// control panel by ICAO/IATA code (the server resolves it from the
// OurAirports dataset), and several can be shown at once.

export interface Runway {
  leIdent: string;
  heIdent: string;
  le: [number, number]; // [lat, lon]
  he: [number, number];
  widthFt: number;
}

export interface Airport {
  icao: string;
  /** Short label drawn at the runway centroid (IATA code when known). */
  name: string;
  /** Official name, shown in the control panel. */
  fullName?: string;
  lat: number;
  lon: number;
  runways: Runway[];
}

/** Coordinates from OurAirports (KSFO). */
export const SFO_AIRPORT: Airport = {
  icao: "KSFO",
  name: "SFO",
  fullName: "San Francisco International Airport",
  lat: 37.6213,
  lon: -122.379,
  runways: [
    { leIdent: "10L", heIdent: "28R", le: [37.628742, -122.39341], he: [37.613538, -122.35716], widthFt: 200 },
    { leIdent: "10R", heIdent: "28L", le: [37.626298, -122.393124], he: [37.61172, -122.358367], widthFt: 200 },
    { leIdent: "1L", heIdent: "19R", le: [37.607898, -122.38295], he: [37.626476, -122.37063], widthFt: 200 },
    { leIdent: "1R", heIdent: "19L", le: [37.606333, -122.381061], he: [37.627346, -122.367124], widthFt: 200 },
  ],
};

/**
 * The airports drawn on the ceiling: the home airport (`airport`, which the
 * route checks, departure priority and camera home pose also use) followed by
 * any extras that are only drawn. Extras with the home's ICAO are dropped.
 */
export interface AirportSet {
  airport: Airport;
  extraAirports: Airport[];
}

const sameIcao = (a: Airport, icao: string) => a.icao.toUpperCase() === icao.toUpperCase();

/** Home first, then extras, with no duplicate ICAO codes. */
export function listAirports(s: AirportSet): Airport[] {
  const out: Airport[] = [s.airport];
  for (const a of s.extraAirports ?? []) {
    if (!out.some((o) => sameIcao(o, a.icao))) out.push(a);
  }
  return out;
}

/** Add an airport as an extra. An airport already shown is refreshed in place. */
export function addAirport(s: AirportSet, ap: Airport): AirportSet {
  if (sameIcao(s.airport, ap.icao)) return { airport: ap, extraAirports: s.extraAirports ?? [] };
  const extras = s.extraAirports ?? [];
  const i = extras.findIndex((a) => sameIcao(a, ap.icao));
  if (i >= 0) return { airport: s.airport, extraAirports: extras.map((a, j) => (j === i ? ap : a)) };
  return { airport: s.airport, extraAirports: [...extras, ap] };
}

/** Remove an airport. Removing the home promotes the first extra; the last
 *  remaining airport can't be removed (turn the overlay off instead). */
export function removeAirport(s: AirportSet, icao: string): AirportSet {
  const all = listAirports(s);
  if (all.length <= 1) return { airport: s.airport, extraAirports: s.extraAirports ?? [] };
  const rest = all.filter((a) => !sameIcao(a, icao));
  return { airport: rest[0], extraAirports: rest.slice(1) };
}

/** Make one of the shown airports the home airport (the old home becomes an extra). */
export function makeHomeAirport(s: AirportSet, icao: string): AirportSet {
  const all = listAirports(s);
  const home = all.find((a) => sameIcao(a, icao));
  if (!home) return { airport: s.airport, extraAirports: s.extraAirports ?? [] };
  return { airport: home, extraAirports: all.filter((a) => a !== home) };
}
