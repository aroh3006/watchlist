import { prisma } from "@/lib/prisma";
import { getMetadataProvider } from "./index";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function ensureGenre(name: string) {
  const slug = slugify(name);
  return prisma.genre.upsert({ where: { name }, update: {}, create: { name, slug } });
}

async function ensurePerson(name: string, imageUrl?: string) {
  const slug = slugify(name);
  return prisma.person.upsert({
    where: { slug },
    update: imageUrl ? { imageUrl } : {},
    create: { name, slug, imageUrl },
  });
}

/**
 * Idempotently materializes a provider's show detail into Watchlist's own
 * tables, recording the provider's id in ExternalId so re-imports and
 * cross-provider matching stay stable. Called on demand when a user adds a
 * show discovered through search/discover that isn't in the DB yet.
 */
export async function ensureShowSynced(provider: string, externalId: string): Promise<string> {
  const existing = await prisma.externalId.findUnique({
    where: { provider_entityType_externalId: { provider, entityType: "SHOW", externalId } },
  });
  if (existing?.showId) return existing.showId;

  const metaProvider = getMetadataProvider();
  const detail = await metaProvider.getShow(externalId);
  if (!detail) throw new Error("Show not found in metadata provider");

  const slug = slugify(detail.title) + (provider !== "local" ? `-${provider}-${externalId}` : "");
  const show = await prisma.show.upsert({
    where: { slug },
    update: {},
    create: {
      title: detail.title,
      originalTitle: detail.originalTitle,
      slug,
      description: detail.description,
      status: (detail.status as string) ?? "RETURNING",
      firstAirDate: detail.firstAirDate ? new Date(detail.firstAirDate) : null,
      lastAirDate: detail.lastAirDate ? new Date(detail.lastAirDate) : null,
      episodeRuntime: detail.episodeRuntime,
      language: detail.language,
      country: detail.country,
      posterUrl: detail.posterUrl,
      backdropUrl: detail.backdropUrl,
      popularity: detail.popularity ?? 0,
      voteAverage: detail.voteAverage,
    },
  });

  await prisma.externalId.upsert({
    where: { provider_entityType_externalId: { provider, entityType: "SHOW", externalId } },
    update: { showId: show.id },
    create: { provider, entityType: "SHOW", externalId, showId: show.id },
  });
  if (detail.externalIds) {
    for (const [p, id] of Object.entries(detail.externalIds)) {
      await prisma.externalId.upsert({
        where: { provider_entityType_externalId: { provider: p, entityType: "SHOW", externalId: id } },
        update: { showId: show.id },
        create: { provider: p, entityType: "SHOW", externalId: id, showId: show.id },
      });
    }
  }

  for (const g of detail.genres ?? []) {
    const genre = await ensureGenre(g.name);
    await prisma.showGenre.upsert({
      where: { showId_genreId: { showId: show.id, genreId: genre.id } },
      update: {},
      create: { showId: show.id, genreId: genre.id },
    });
  }

  for (const [i, c] of (detail.cast ?? []).entries()) {
    const person = await ensurePerson(c.person.name, c.person.imageUrl);
    let characterId: string | undefined;
    if (c.character) {
      const character = await prisma.character.create({ data: { name: c.character } });
      characterId = character.id;
    }
    await prisma.showCast.create({
      data: { showId: show.id, personId: person.id, characterId, role: c.role, billingOrder: c.billingOrder ?? i },
    });
  }

  for (const season of detail.seasons) {
    const seasonRow = await prisma.season.upsert({
      where: { showId_seasonNumber: { showId: show.id, seasonNumber: season.seasonNumber } },
      update: {},
      create: {
        showId: show.id,
        seasonNumber: season.seasonNumber,
        title: season.title,
        overview: season.overview,
        posterUrl: season.posterUrl,
        airDate: season.airDate ? new Date(season.airDate) : null,
      },
    });
    for (const ep of season.episodes) {
      await prisma.episode.upsert({
        where: { seasonId_episodeNumber: { seasonId: seasonRow.id, episodeNumber: ep.episodeNumber } },
        update: {},
        create: {
          seasonId: seasonRow.id,
          showId: show.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          overview: ep.overview,
          runtime: ep.runtime,
          airDate: ep.airDate ? new Date(ep.airDate) : null,
          imageUrl: ep.imageUrl,
          voteAverage: ep.voteAverage,
        },
      });
    }
  }

  return show.id;
}

export async function ensureMovieSynced(provider: string, externalId: string): Promise<string> {
  const existing = await prisma.externalId.findUnique({
    where: { provider_entityType_externalId: { provider, entityType: "MOVIE", externalId } },
  });
  if (existing?.movieId) return existing.movieId;

  const metaProvider = getMetadataProvider();
  const detail = await metaProvider.getMovie(externalId);
  if (!detail) throw new Error("Movie not found in metadata provider");

  const slug = slugify(detail.title) + (provider !== "local" ? `-${provider}-${externalId}` : "");
  const movie = await prisma.movie.upsert({
    where: { slug },
    update: {},
    create: {
      title: detail.title,
      originalTitle: detail.originalTitle,
      slug,
      synopsis: detail.synopsis,
      releaseDate: detail.releaseDate ? new Date(detail.releaseDate) : null,
      runtime: detail.runtime,
      language: detail.language,
      country: detail.country,
      posterUrl: detail.posterUrl,
      backdropUrl: detail.backdropUrl,
      popularity: detail.popularity ?? 0,
      voteAverage: detail.voteAverage,
    },
  });

  await prisma.externalId.upsert({
    where: { provider_entityType_externalId: { provider, entityType: "MOVIE", externalId } },
    update: { movieId: movie.id },
    create: { provider, entityType: "MOVIE", externalId, movieId: movie.id },
  });
  if (detail.externalIds) {
    for (const [p, id] of Object.entries(detail.externalIds)) {
      await prisma.externalId.upsert({
        where: { provider_entityType_externalId: { provider: p, entityType: "MOVIE", externalId: id } },
        update: { movieId: movie.id },
        create: { provider: p, entityType: "MOVIE", externalId: id, movieId: movie.id },
      });
    }
  }

  for (const g of detail.genres ?? []) {
    const genre = await ensureGenre(g.name);
    await prisma.movieGenre.upsert({
      where: { movieId_genreId: { movieId: movie.id, genreId: genre.id } },
      update: {},
      create: { movieId: movie.id, genreId: genre.id },
    });
  }

  for (const [i, c] of (detail.cast ?? []).entries()) {
    const person = await ensurePerson(c.person.name, c.person.imageUrl);
    let characterId: string | undefined;
    if (c.character) {
      const character = await prisma.character.create({ data: { name: c.character } });
      characterId = character.id;
    }
    await prisma.movieCast.create({
      data: { movieId: movie.id, personId: person.id, characterId, role: c.role, billingOrder: c.billingOrder ?? i },
    });
  }

  return movie.id;
}
