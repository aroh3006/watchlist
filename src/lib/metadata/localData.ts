/**
 * Original, non-infringing seed dataset used by the "local" metadata
 * provider. Every title, character, and person here is fictional and
 * created for Watchlist's development/demo environment. None of it is
 * sourced from TheTVDB, TMDB, or any other proprietary database.
 *
 * This file is intentionally the *only* place that knows what "local" data
 * looks like; MetadataProvider consumers never see this shape directly.
 */

export interface SeedEpisode {
  title: string;
  overview: string;
  runtime: number;
}

export interface SeedSeason {
  title: string;
  overview: string;
  episodes: SeedEpisode[];
}

export interface SeedCastEntry {
  name: string;
  character?: string;
  role: "actor" | "creator" | "director" | "writer";
}

export interface SeedShow {
  id: string; // stable slug-like id used as the "local" externalId
  title: string;
  description: string;
  genres: string[];
  status: "RETURNING" | "ENDED" | "CANCELLED" | "IN_PRODUCTION" | "PLANNED";
  network: string;
  firstAirDate: string;
  lastAirDate?: string;
  episodeRuntime: number;
  language: string;
  country: string;
  popularity: number;
  voteAverage: number;
  posterHue: number; // used to generate a deterministic gradient placeholder
  cast: SeedCastEntry[];
  seasons: SeedSeason[];
}

export interface SeedMovie {
  id: string;
  title: string;
  synopsis: string;
  genres: string[];
  releaseDate: string;
  runtime: number;
  language: string;
  country: string;
  popularity: number;
  voteAverage: number;
  posterHue: number;
  cast: SeedCastEntry[];
}

function episodes(count: number, prefix: string, runtime: number): SeedEpisode[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `${prefix} ${i + 1}`,
    overview: `An eventful chapter unfolds as the story pushes toward its next turning point. (${prefix} ${i + 1})`,
    runtime,
  }));
}

export const SEED_SHOWS: SeedShow[] = [
  {
    id: "show-glass-horizon",
    title: "Glass Horizon",
    description:
      "A crew of orbital engineers keep a failing space station alive while uncovering a conspiracy that reaches back to Earth.",
    genres: ["Sci-Fi", "Drama", "Mystery"],
    status: "RETURNING",
    network: "Northlight",
    firstAirDate: "2021-03-14",
    episodeRuntime: 48,
    language: "en",
    country: "US",
    popularity: 92,
    voteAverage: 8.4,
    posterHue: 210,
    cast: [
      { name: "Maren Ilič", character: "Cmdr. Ada Solberg", role: "actor" },
      { name: "Deshawn Ruiz", character: "Eng. Tomas Reyes", role: "actor" },
      { name: "Priya Natarajan", character: "Dr. Ken Osei", role: "actor" },
      { name: "Colton Farrow", role: "creator" },
    ],
    seasons: [
      { title: "Season 1", overview: "The station's first crisis.", episodes: episodes(10, "Fracture", 48) },
      { title: "Season 2", overview: "Secrets from the ground.", episodes: episodes(10, "Descent", 50) },
      { title: "Season 3", overview: "The signal returns.", episodes: episodes(8, "Echo", 47) },
    ],
  },
  {
    id: "show-brackenfield",
    title: "Brackenfield",
    description:
      "In a fog-bound English village, a detective inspector and a folklore archivist investigate crimes that blur into local legend.",
    genres: ["Mystery", "Drama", "Crime"],
    status: "RETURNING",
    network: "Harrow One",
    firstAirDate: "2019-10-02",
    episodeRuntime: 44,
    language: "en",
    country: "GB",
    popularity: 78,
    voteAverage: 8.1,
    posterHue: 265,
    cast: [
      { name: "Fiona Whitlock", character: "DI Rowan Blake", role: "actor" },
      { name: "Aditya Kapoor", character: "Marta Voss", role: "actor" },
      { name: "Helen Doyle", role: "creator" },
    ],
    seasons: [
      { title: "Series 1", overview: "The Hollow Bell case.", episodes: episodes(6, "The Hollow Bell", 44) },
      { title: "Series 2", overview: "The Long Field murders.", episodes: episodes(6, "The Long Field", 45) },
      { title: "Series 3", overview: "Ashgrove.", episodes: episodes(6, "Ashgrove", 44) },
    ],
  },
  {
    id: "show-paperclip-kingdom",
    title: "Paperclip Kingdom",
    description:
      "Four mismatched office temps accidentally build a micro-empire out of a failing stationery startup.",
    genres: ["Comedy"],
    status: "ENDED",
    network: "Freeport",
    firstAirDate: "2017-01-09",
    lastAirDate: "2022-05-30",
    episodeRuntime: 24,
    language: "en",
    country: "US",
    popularity: 65,
    voteAverage: 7.6,
    posterHue: 35,
    cast: [
      { name: "Jules Okafor", character: "Nora Pell", role: "actor" },
      { name: "Ben Csik", character: "Marcus Diallo", role: "actor" },
      { name: "Renata Souza", character: "Ivy Chandra", role: "actor" },
    ],
    seasons: Array.from({ length: 5 }, (_, s) => ({
      title: `Season ${s + 1}`,
      overview: "Another quarter, another disaster.",
      episodes: episodes(13, "Memo", 23),
    })),
  },
  {
    id: "show-red-orchard",
    title: "Red Orchard",
    description:
      "Three generations of a winemaking family fight for control of their vineyard as a drought threatens everything.",
    genres: ["Drama", "Family"],
    status: "IN_PRODUCTION",
    network: "Southline",
    firstAirDate: "2023-06-11",
    episodeRuntime: 52,
    language: "en",
    country: "AU",
    popularity: 54,
    voteAverage: 7.9,
    posterHue: 5,
    cast: [
      { name: "Odette Marchetti", character: "Rosa Calder", role: "actor" },
      { name: "Liam Fitzgerald", character: "Dean Calder", role: "actor" },
    ],
    seasons: [{ title: "Season 1", overview: "The drought begins.", episodes: episodes(8, "Vintage", 52) }],
  },
  {
    id: "show-neon-district",
    title: "Neon District",
    description:
      "A rookie beat cop and a black-market data broker form an uneasy alliance in a rain-soaked megacity.",
    genres: ["Action", "Sci-Fi", "Thriller"],
    status: "RETURNING",
    network: "Pulsewire",
    firstAirDate: "2020-08-21",
    episodeRuntime: 42,
    language: "en",
    country: "CA",
    popularity: 88,
    voteAverage: 8.2,
    posterHue: 320,
    cast: [
      { name: "Iris Okonkwo", character: "Officer Sable Nakamura", role: "actor" },
      { name: "Theo Vance", character: "Whistler", role: "actor" },
    ],
    seasons: [
      { title: "Season 1", overview: "The Ledger job.", episodes: episodes(10, "Ledger", 42) },
      { title: "Season 2", overview: "The Undertow arc.", episodes: episodes(10, "Undertow", 43) },
    ],
  },
  {
    id: "show-thistle-and-thorn",
    title: "Thistle & Thorn",
    description:
      "Two rival apothecaries in a walled medieval city discover their feud is being manipulated by something far older.",
    genres: ["Fantasy", "Drama"],
    status: "RETURNING",
    network: "Harrow One",
    firstAirDate: "2022-02-18",
    episodeRuntime: 50,
    language: "en",
    country: "GB",
    popularity: 81,
    voteAverage: 8.5,
    posterHue: 150,
    cast: [
      { name: "Saoirse Lennon", character: "Wren Ashby", role: "actor" },
      { name: "Kofi Mensah", character: "Cassian Vale", role: "actor" },
    ],
    seasons: [
      { title: "Season 1", overview: "The Bramble Pact.", episodes: episodes(8, "Bramble", 50) },
      { title: "Season 2", overview: "The Ashfall.", episodes: episodes(8, "Ashfall", 51) },
    ],
  },
  {
    id: "show-lowtide-motel",
    title: "Lowtide Motel",
    description:
      "An anthology series set at a struggling coastal motel, telling a self-contained story each season through its rotating guests.",
    genres: ["Drama", "Anthology", "Mystery"],
    status: "RETURNING",
    network: "Freeport",
    firstAirDate: "2021-11-05",
    episodeRuntime: 46,
    language: "en",
    country: "US",
    popularity: 73,
    voteAverage: 7.8,
    posterHue: 195,
    cast: [{ name: "Marisol Feng", character: "Dot Calloway", role: "actor" }],
    seasons: [
      { title: "Season 1: Room 4", overview: "A missing guest.", episodes: episodes(8, "Room 4", 46) },
      { title: "Season 2: The Long Weekend", overview: "A storm traps everyone.", episodes: episodes(8, "Weekend", 46) },
    ],
  },
  {
    id: "show-circuit-breakers",
    title: "Circuit Breakers",
    description:
      "A teenage robotics team competes nationally while secretly building something that could change their small town forever.",
    genres: ["Comedy", "Drama", "Family"],
    status: "ENDED",
    network: "Northlight",
    firstAirDate: "2018-09-14",
    lastAirDate: "2021-04-02",
    episodeRuntime: 30,
    language: "en",
    country: "US",
    popularity: 61,
    voteAverage: 7.4,
    posterHue: 45,
    cast: [{ name: "Ravi Chandrasekhar", character: "Milo Voss", role: "actor" }],
    seasons: [
      { title: "Season 1", overview: "Regionals.", episodes: episodes(12, "Regionals", 29) },
      { title: "Season 2", overview: "Nationals.", episodes: episodes(12, "Nationals", 30) },
      { title: "Season 3", overview: "The Build.", episodes: episodes(10, "Build", 31) },
    ],
  },
  {
    id: "show-obsidian-court",
    title: "Obsidian Court",
    description: "A prestige legal drama following public defenders in a system stacked against their clients.",
    genres: ["Drama", "Legal"],
    status: "RETURNING",
    network: "Southline",
    firstAirDate: "2019-01-22",
    episodeRuntime: 55,
    language: "en",
    country: "US",
    popularity: 69,
    voteAverage: 8.0,
    posterHue: 260,
    cast: [{ name: "Dominique Prince", character: "Alexis Moreau", role: "actor" }],
    seasons: [
      { title: "Season 1", overview: "The Delgado case.", episodes: episodes(10, "Delgado", 55) },
      { title: "Season 2", overview: "The Wynn appeal.", episodes: episodes(10, "Wynn", 56) },
      { title: "Season 3", overview: "State v. Harmon.", episodes: episodes(10, "Harmon", 54) },
      { title: "Season 4", overview: "The Recusal.", episodes: episodes(8, "Recusal", 55) },
    ],
  },
  {
    id: "show-quietfall",
    title: "Quietfall",
    description: "A slow-burn survival drama about a small town cut off from the world after a silent catastrophe.",
    genres: ["Drama", "Thriller", "Sci-Fi"],
    status: "PLANNED",
    network: "Pulsewire",
    firstAirDate: "2026-11-01",
    episodeRuntime: 45,
    language: "en",
    country: "US",
    popularity: 40,
    voteAverage: 0,
    posterHue: 220,
    cast: [{ name: "Nadia Kessler", character: "Sela Grant", role: "actor" }],
    seasons: [{ title: "Season 1", overview: "The first silence.", episodes: episodes(1, "Pilot", 45) }],
  },
];

export const SEED_MOVIES: SeedMovie[] = [
  {
    id: "movie-the-last-longitude",
    title: "The Last Longitude",
    synopsis: "A disgraced cartographer races a rival expedition to chart the final unmapped stretch of ocean.",
    genres: ["Adventure", "Drama"],
    releaseDate: "2022-07-15",
    runtime: 128,
    language: "en",
    country: "US",
    popularity: 70,
    voteAverage: 7.9,
    posterHue: 200,
    cast: [
      { name: "Otis Bellamy", character: "Capt. Hale Renwick", role: "actor" },
      { name: "Wren Adeyemi", role: "director" },
    ],
  },
  {
    id: "movie-paperweight",
    title: "Paperweight",
    synopsis: "A burnt-out architect inherits a tiny apartment that seems to rearrange itself every night.",
    genres: ["Fantasy", "Comedy"],
    releaseDate: "2023-03-03",
    runtime: 101,
    language: "en",
    country: "US",
    popularity: 58,
    voteAverage: 7.5,
    posterHue: 30,
    cast: [{ name: "Celia Marchetti", character: "Dana Okafor", role: "actor" }],
  },
  {
    id: "movie-the-quiet-arsonist",
    title: "The Quiet Arsonist",
    synopsis: "A volunteer firefighter suspects her own brother is behind a string of small-town blazes.",
    genres: ["Thriller", "Drama"],
    releaseDate: "2021-10-08",
    runtime: 112,
    language: "en",
    country: "CA",
    popularity: 64,
    voteAverage: 7.7,
    posterHue: 10,
    cast: [{ name: "Greta Lindqvist", character: "Ines Larsson", role: "actor" }],
  },
  {
    id: "movie-satellite-orchard",
    title: "Satellite Orchard",
    synopsis: "Two estranged siblings inherit their grandfather's failing satellite-tracking farm.",
    genres: ["Drama", "Sci-Fi"],
    releaseDate: "2020-05-29",
    runtime: 118,
    language: "en",
    country: "US",
    popularity: 49,
    voteAverage: 7.3,
    posterHue: 190,
    cast: [{ name: "Marcus Feld", character: "Owen Pratt", role: "actor" }],
  },
  {
    id: "movie-carousel-of-knives",
    title: "Carousel of Knives",
    synopsis: "A traveling carnival's knife-thrower must protect her apprentice from the crew that raised her.",
    genres: ["Thriller", "Action"],
    releaseDate: "2019-09-13",
    runtime: 105,
    language: "en",
    country: "US",
    popularity: 72,
    voteAverage: 7.6,
    posterHue: 340,
    cast: [{ name: "Yuki Tanaka", character: "Bly Fontaine", role: "actor" }],
  },
  {
    id: "movie-the-cartographers-daughter",
    title: "The Cartographer's Daughter",
    synopsis: "A young mapmaker discovers a hidden valley that shouldn't exist — and the empire that wants it buried.",
    genres: ["Fantasy", "Adventure"],
    releaseDate: "2024-02-16",
    runtime: 132,
    language: "en",
    country: "NZ",
    popularity: 76,
    voteAverage: 8.0,
    posterHue: 155,
    cast: [{ name: "Freya Sundstrom", character: "Elin Marsh", role: "actor" }],
  },
  {
    id: "movie-static-hour",
    title: "Static Hour",
    synopsis: "A late-night radio host takes a call that convinces her the city's blackout is not an accident.",
    genres: ["Thriller", "Mystery"],
    releaseDate: "2022-11-04",
    runtime: 97,
    language: "en",
    country: "US",
    popularity: 66,
    voteAverage: 7.4,
    posterHue: 250,
    cast: [{ name: "Adaeze Nwosu", character: "Ronnie Blackwood", role: "actor" }],
  },
  {
    id: "movie-glasshouse-orbit",
    title: "Glasshouse Orbit",
    synopsis: "A botanist aboard a generation ship must save the last seed vault after a catastrophic system failure.",
    genres: ["Sci-Fi", "Drama"],
    releaseDate: "2023-08-25",
    runtime: 124,
    language: "en",
    country: "US",
    popularity: 84,
    voteAverage: 8.1,
    posterHue: 175,
    cast: [{ name: "Priya Natarajan", character: "Dr. Amara Solis", role: "actor" }],
  },
  {
    id: "movie-the-understudy",
    title: "The Understudy",
    synopsis: "A theater understudy's chance at stardom curdles when the lead actress refuses to disappear quietly.",
    genres: ["Drama", "Thriller"],
    releaseDate: "2018-12-07",
    runtime: 109,
    language: "en",
    country: "GB",
    popularity: 55,
    voteAverage: 7.5,
    posterHue: 285,
    cast: [{ name: "Fiona Whitlock", character: "Nell Ashworth", role: "actor" }],
  },
  {
    id: "movie-ordinary-comets",
    title: "Ordinary Comets",
    synopsis: "A found-family road comedy about three strangers chasing a once-in-a-lifetime meteor shower.",
    genres: ["Comedy", "Adventure"],
    releaseDate: "2024-06-21",
    runtime: 99,
    language: "en",
    country: "US",
    popularity: 60,
    voteAverage: 7.2,
    posterHue: 60,
    cast: [{ name: "Deshawn Ruiz", character: "Cole Faraday", role: "actor" }],
  },
];
