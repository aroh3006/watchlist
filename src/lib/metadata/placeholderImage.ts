/**
 * Deterministic, tastefully-designed placeholder artwork used until real
 * licensed poster/backdrop images are available (see the metadata provider
 * abstraction — swapping in TMDB or a licensed dataset replaces these with
 * real posterUrl/backdropUrl values with no other code changes).
 *
 * Deliberately NOT a random-hue gradient with giant initials: every card
 * shares the app's own charcoal/slate-blue palette, varied only through a
 * small curated accent set and the title's own typography, so a shelf of
 * placeholders reads as one designed system rather than generated noise.
 */

// A handful of muted accents drawn from the app's palette — never a raw
// 0-360 hue sweep, which is what makes bulk placeholder art look generated.
const ACCENTS = ["#284b68", "#8fb2cf", "#a1442b", "#c48a5a", "#7a6a45", "#4d7c9e"];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function accentFor(seed: string): string {
  return ACCENTS[hashString(seed) % ACCENTS.length];
}

function wrapText(title: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length === maxLines - 1) break;
  }
  if (current) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*\S*$/, "") + "…";
  }
  return lines.slice(0, maxLines);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function posterSvg(title: string, seed: string, w: number, h: number): string {
  const accent = accentFor(seed);
  const fontSize = Math.round(w / 13);
  const maxChars = Math.round(w / (fontSize * 0.52));
  const lines = wrapText(title, maxChars, 4);
  const lineHeight = fontSize * 1.25;
  const blockHeight = lines.length * lineHeight;
  const startY = h - h * 0.12 - blockHeight;

  const grainId = `grain-${hashString(seed + w)}`;

  const textEls = lines
    .map(
      (line, i) =>
        `<text x="${w * 0.08}" y="${startY + i * lineHeight}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="600" fill="#ece7de" opacity="0.92">${escapeXml(line)}</text>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stop-color="#1c1a17"/>
        <stop offset="100%" stop-color="#111110"/>
      </linearGradient>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
      </linearGradient>
      <filter id="${grainId}">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise"/>
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.035 0"/>
      </filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect width="${w}" height="${h}" filter="url(#${grainId})"/>
    <rect x="0" y="0" width="${Math.round(w * 0.09)}" height="${h}" fill="${accent}" opacity="0.9"/>
    <rect width="${w}" height="${h}" fill="url(#fade)"/>
    ${textEls}
  </svg>`;
}

function backdropSvg(title: string, seed: string, w: number, h: number): string {
  const accent = accentFor(seed);
  const grainId = `bgrain-${hashString(seed + w)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#181715"/>
        <stop offset="100%" stop-color="#111110"/>
      </linearGradient>
      <filter id="${grainId}">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" result="noise"/>
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.03 0"/>
      </filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect width="${w}" height="${h}" filter="url(#${grainId})"/>
    <rect x="0" y="${h - 4}" width="${w}" height="4" fill="${accent}" opacity="0.85"/>
  </svg>`;
}

export function posterPlaceholder(seed: string | number, title: string): string {
  const key = String(seed) + title;
  return `data:image/svg+xml;utf8,${encodeURIComponent(posterSvg(title, key, 400, 600))}`;
}

export function backdropPlaceholder(seed: string | number, title: string): string {
  const key = String(seed) + title;
  return `data:image/svg+xml;utf8,${encodeURIComponent(backdropSvg(title, key, 1280, 720))}`;
}

export function avatarPlaceholder(seed: string | number, name: string): string {
  const accent = accentFor(String(seed) + name);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#1c1a17"/>
    <circle cx="100" cy="100" r="96" fill="none" stroke="${accent}" stroke-width="2" opacity="0.6"/>
    <text x="50%" y="52%" font-family="system-ui, sans-serif" font-size="64" font-weight="600" fill="#ece7de" opacity="0.85" text-anchor="middle" dominant-baseline="middle">${escapeXml(initials)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
