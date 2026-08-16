import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_SHOWS, SEED_MOVIES } from "../src/lib/metadata/localData";
import { posterPlaceholder, backdropPlaceholder } from "../src/lib/metadata/placeholderImage";
import { BADGE_DEFINITIONS } from "../src/lib/badges/definitions";
import { recomputeDailyActivityForUser } from "../src/lib/stats/activity";
import { evaluateBadgesForUser } from "../src/lib/badges/engine";

const prisma = new PrismaClient();

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function dedupeKey(userId: string, kind: string, targetId: string, watchedAt: Date, source: string) {
  return `${userId}:${kind}:${targetId}:${watchedAt.toISOString()}:${source}`;
}

async function ensureGenre(name: string) {
  const slug = slugify(name);
  return prisma.genre.upsert({
    where: { name },
    update: {},
    create: { name, slug },
  });
}

async function ensureNetwork(name: string) {
  const slug = slugify(name);
  return prisma.network.upsert({
    where: { name },
    update: {},
    create: { name, slug, logoUrl: null },
  });
}

async function ensurePerson(name: string) {
  const slug = slugify(name);
  return prisma.person.upsert({
    where: { slug },
    update: {},
    create: { name, slug },
  });
}

async function main() {
  console.log("Seeding Watchlist database...");

  // --- Badges -------------------------------------------------------------
  for (const b of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { key: b.key },
      update: { name: b.name, description: b.description, category: b.category, tier: b.tier, iconKey: b.iconKey },
      create: { key: b.key, name: b.name, description: b.description, category: b.category, tier: b.tier, iconKey: b.iconKey },
    });
  }

  // --- Shows ----------------------------------------------------------------
  for (const s of SEED_SHOWS) {
    const network = await ensureNetwork(s.network);
    const slug = slugify(s.title);
    const show = await prisma.show.upsert({
      where: { slug },
      update: {},
      create: {
        title: s.title,
        slug,
        description: s.description,
        status: s.status,
        firstAirDate: new Date(s.firstAirDate),
        lastAirDate: s.lastAirDate ? new Date(s.lastAirDate) : null,
        episodeRuntime: s.episodeRuntime,
        language: s.language,
        country: s.country,
        posterUrl: posterPlaceholder(s.posterHue, s.title),
        backdropUrl: backdropPlaceholder(s.posterHue, s.title),
        popularity: s.popularity,
        voteAverage: s.voteAverage,
        networkId: network.id,
      },
    });

    await prisma.externalId.upsert({
      where: { provider_entityType_externalId: { provider: "local", entityType: "SHOW", externalId: s.id } },
      update: { showId: show.id },
      create: { provider: "local", entityType: "SHOW", externalId: s.id, showId: show.id },
    });

    for (const genreName of s.genres) {
      const genre = await ensureGenre(genreName);
      await prisma.showGenre.upsert({
        where: { showId_genreId: { showId: show.id, genreId: genre.id } },
        update: {},
        create: { showId: show.id, genreId: genre.id },
      });
    }

    for (const [i, c] of s.cast.entries()) {
      const person = await ensurePerson(c.name);
      let characterId: string | undefined;
      if (c.character) {
        const character = await prisma.character.create({ data: { name: c.character } });
        characterId = character.id;
        await prisma.showCharacter.create({ data: { showId: show.id, characterId } });
      }
      await prisma.showCast.create({
        data: { showId: show.id, personId: person.id, characterId, role: c.role, billingOrder: i },
      });
    }

    for (const [sIdx, season] of s.seasons.entries()) {
      const seasonNumber = sIdx + 1;
      const seasonRow = await prisma.season.upsert({
        where: { showId_seasonNumber: { showId: show.id, seasonNumber } },
        update: {},
        create: {
          showId: show.id,
          seasonNumber,
          title: season.title,
          overview: season.overview,
          posterUrl: posterPlaceholder(s.posterHue, `${s.title} ${season.title}`),
          airDate: new Date(s.firstAirDate),
        },
      });

      for (const [eIdx, ep] of season.episodes.entries()) {
        const episodeNumber = eIdx + 1;
        const airDate = new Date(s.firstAirDate);
        airDate.setDate(airDate.getDate() + sIdx * 90 + eIdx * 7);
        await prisma.episode.upsert({
          where: { seasonId_episodeNumber: { seasonId: seasonRow.id, episodeNumber } },
          update: {},
          create: {
            seasonId: seasonRow.id,
            showId: show.id,
            episodeNumber,
            title: ep.title,
            overview: ep.overview,
            runtime: ep.runtime,
            airDate,
            imageUrl: backdropPlaceholder(s.posterHue, ep.title),
          },
        });
      }
    }
  }

  // --- Movies -----------------------------------------------------------
  for (const m of SEED_MOVIES) {
    const slug = slugify(m.title);
    const movie = await prisma.movie.upsert({
      where: { slug },
      update: {},
      create: {
        title: m.title,
        slug,
        synopsis: m.synopsis,
        releaseDate: new Date(m.releaseDate),
        runtime: m.runtime,
        language: m.language,
        country: m.country,
        posterUrl: posterPlaceholder(m.posterHue, m.title),
        backdropUrl: backdropPlaceholder(m.posterHue, m.title),
        popularity: m.popularity,
        voteAverage: m.voteAverage,
      },
    });

    await prisma.externalId.upsert({
      where: { provider_entityType_externalId: { provider: "local", entityType: "MOVIE", externalId: m.id } },
      update: { movieId: movie.id },
      create: { provider: "local", entityType: "MOVIE", externalId: m.id, movieId: movie.id },
    });

    for (const genreName of m.genres) {
      const genre = await ensureGenre(genreName);
      await prisma.movieGenre.upsert({
        where: { movieId_genreId: { movieId: movie.id, genreId: genre.id } },
        update: {},
        create: { movieId: movie.id, genreId: genre.id },
      });
    }

    for (const [i, c] of m.cast.entries()) {
      const person = await ensurePerson(c.name);
      let characterId: string | undefined;
      if (c.character) {
        const character = await prisma.character.create({ data: { name: c.character } });
        characterId = character.id;
      }
      await prisma.movieCast.create({
        data: { movieId: movie.id, personId: person.id, characterId, role: c.role, billingOrder: i },
      });
    }
  }

  // --- Demo user with realistic history ------------------------------------
  const demoEmail = "demo@watchlist.app";
  const passwordHash = await bcrypt.hash("watchlist-demo", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      username: "demo",
      passwordHash,
      profile: {
        create: {
          displayName: "Demo Viewer",
          bio: "Exploring what to watch next.",
          timezone: process.env.DEFAULT_TIMEZONE ?? "UTC",
        },
      },
    },
  });

  const glassHorizon = await prisma.show.findUnique({ where: { slug: "glass-horizon" }, include: { seasons: { include: { episodes: true } } } });
  const brackenfield = await prisma.show.findUnique({ where: { slug: "brackenfield" }, include: { seasons: { include: { episodes: true } } } });
  const paperclip = await prisma.show.findUnique({ where: { slug: "paperclip-kingdom" }, include: { seasons: { include: { episodes: true } } } });
  const neonDistrict = await prisma.show.findUnique({ where: { slug: "neon-district" } });
  const thistle = await prisma.show.findUnique({ where: { slug: "thistle-thorn" } });

  const glasshouseOrbit = await prisma.movie.findUnique({ where: { slug: "glasshouse-orbit" } });
  const lastLongitude = await prisma.movie.findUnique({ where: { slug: "the-last-longitude" } });
  const carousel = await prisma.movie.findUnique({ where: { slug: "carousel-of-knives" } });

  if (glassHorizon) {
    await prisma.userShow.upsert({
      where: { userId_showId: { userId: demoUser.id, showId: glassHorizon.id } },
      update: {},
      create: { userId: demoUser.id, showId: glassHorizon.id, status: "WATCHING" },
    });
    const existingFavorite = await prisma.favorite.findFirst({
      where: { userId: demoUser.id, targetType: "SHOW", showId: glassHorizon.id, movieId: null },
    });
    if (!existingFavorite) {
      await prisma.favorite.create({ data: { userId: demoUser.id, targetType: "SHOW", showId: glassHorizon.id } });
    }

    const allEpisodes = glassHorizon.seasons.flatMap((s) => s.episodes).sort((a, b) => a.episodeNumber - b.episodeNumber);
    const watchCount = Math.floor(allEpisodes.length * 0.6);
    const now = new Date();
    for (let i = 0; i < watchCount; i++) {
      const ep = allEpisodes[i];
      const watchedAt = new Date(now);
      watchedAt.setDate(watchedAt.getDate() - (watchCount - i) * 2);
      const key = dedupeKey(demoUser.id, "episode", ep.id, watchedAt, "seed");
      await prisma.episodeWatch.upsert({
        where: { userId_dedupeKey: { userId: demoUser.id, dedupeKey: key } },
        update: {},
        create: { userId: demoUser.id, episodeId: ep.id, watchedAt, source: "seed", dedupeKey: key },
      });
    }
    const existingRating = await prisma.rating.findFirst({
      where: { userId: demoUser.id, targetType: "SHOW", showId: glassHorizon.id, episodeId: null, movieId: null },
    });
    if (!existingRating) {
      await prisma.rating.create({ data: { userId: demoUser.id, targetType: "SHOW", showId: glassHorizon.id, score: 9 } });
    }
  }

  if (brackenfield) {
    await prisma.userShow.upsert({
      where: { userId_showId: { userId: demoUser.id, showId: brackenfield.id } },
      update: {},
      create: { userId: demoUser.id, showId: brackenfield.id, status: "COMPLETED" },
    });
    const allEpisodes = brackenfield.seasons.flatMap((s) => s.episodes);
    const now = new Date();
    for (let i = 0; i < allEpisodes.length; i++) {
      const watchedAt = new Date(now);
      watchedAt.setDate(watchedAt.getDate() - (allEpisodes.length - i) * 4 - 30);
      const key = dedupeKey(demoUser.id, "episode", allEpisodes[i].id, watchedAt, "seed");
      await prisma.episodeWatch.upsert({
        where: { userId_dedupeKey: { userId: demoUser.id, dedupeKey: key } },
        update: {},
        create: { userId: demoUser.id, episodeId: allEpisodes[i].id, watchedAt, source: "seed", dedupeKey: key },
      });
    }
  }

  if (paperclip) {
    await prisma.userShow.upsert({
      where: { userId_showId: { userId: demoUser.id, showId: paperclip.id } },
      update: {},
      create: { userId: demoUser.id, showId: paperclip.id, status: "PAUSED" },
    });
  }
  if (neonDistrict) {
    await prisma.userShow.upsert({
      where: { userId_showId: { userId: demoUser.id, showId: neonDistrict.id } },
      update: {},
      create: { userId: demoUser.id, showId: neonDistrict.id, status: "PLANNED" },
    });
  }
  if (thistle) {
    await prisma.userShow.upsert({
      where: { userId_showId: { userId: demoUser.id, showId: thistle.id } },
      update: {},
      create: { userId: demoUser.id, showId: thistle.id, status: "WATCHING" },
    });
  }

  for (const [movie, daysAgo] of [
    [glasshouseOrbit, 3],
    [lastLongitude, 10],
    [carousel, 20],
  ] as const) {
    if (!movie) continue;
    await prisma.userMovie.upsert({
      where: { userId_movieId: { userId: demoUser.id, movieId: movie.id } },
      update: {},
      create: { userId: demoUser.id, movieId: movie.id, status: "COMPLETED" },
    });
    const watchedAt = new Date();
    watchedAt.setDate(watchedAt.getDate() - daysAgo);
    const key = dedupeKey(demoUser.id, "movie", movie.id, watchedAt, "seed");
    await prisma.movieWatch.upsert({
      where: { userId_dedupeKey: { userId: demoUser.id, dedupeKey: key } },
      update: {},
      create: { userId: demoUser.id, movieId: movie.id, watchedAt, source: "seed", dedupeKey: key },
    });
  }

  const list = await prisma.customList.create({
    data: {
      userId: demoUser.id,
      name: "Weekend Watch",
      description: "Short, punchy things for a lazy Saturday.",
      isPublic: false,
      items: {
        create: [
          ...(glasshouseOrbit ? [{ movieId: glasshouseOrbit.id, position: 0 }] : []),
          ...(thistle ? [{ showId: thistle.id, position: 1 }] : []),
        ],
      },
    },
  });
  console.log(`Created list ${list.name}`);

  await recomputeDailyActivityForUser(demoUser.id);
  await evaluateBadgesForUser(demoUser.id);

  console.log("Seed complete.");
  console.log(`Demo login: ${demoEmail} / watchlist-demo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
