const WIKI_API = 'https://fr.wikipedia.org/w/api.php';

export interface WikiPlace {
  xid: string;
  name: string;
  kinds: string;
  coordinates: { lat: number; lng: number };
  rate: number;
  wikidata: string;
  preview?: { source: string; height: number; width: number };
  description?: string;
  dist: number;
  articleLength: number;
}

async function geocode(cityName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1&accept-language=fr`;
    const res = await fetch(url, { headers: { 'User-Agent': 'VoyageApp/2.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function searchWikipediaPlaces(
  cityName: string,
  options: { limit?: number; radius?: number } = {}
): Promise<WikiPlace[]> {
  const { limit = 50 } = options;

  const coords = await geocode(cityName);
  if (!coords) throw new Error(`Ville "${cityName}" introuvable`);

  // Étape 1 : geosearch — 500 articles dans un rayon de 10 km
  const geoParams = new URLSearchParams({
    action: 'query',
    list: 'geosearch',
    gscoord: `${coords.lat}|${coords.lng}`,
    gsradius: '10000',
    gslimit: '500',
    format: 'json',
    origin: '*',
  });

  const geoRes = await fetch(`${WIKI_API}?${geoParams}`, {
    headers: { 'User-Agent': 'VoyageApp/2.0' },
  });
  if (!geoRes.ok) throw new Error('Erreur Wikipedia geosearch');

  const geoData = await geoRes.json();
  const geoResults: any[] = geoData.query?.geosearch || [];
  if (!geoResults.length) return [];

  // Étape 2 : taille des articles en parallèle (proxy de notoriété)
  // article long = lieu célèbre (Tour Eiffel ~120 000 oct, petit immeuble ~2 000 oct)
  const pageids = geoResults.map((r: any) => r.pageid);
  const infoMap: Record<string, number> = {};

  const infoBatches: Promise<void>[] = [];
  for (let i = 0; i < pageids.length; i += 50) {
    const batch = pageids.slice(i, i + 50);
    const infoParams = new URLSearchParams({
      action: 'query',
      pageids: batch.join('|'),
      prop: 'info',
      format: 'json',
      origin: '*',
    });
    infoBatches.push(
      fetch(`${WIKI_API}?${infoParams}`, { headers: { 'User-Agent': 'VoyageApp/2.0' } })
        .then(r => r.json())
        .then(data => {
          for (const [id, page] of Object.entries(data.query?.pages || {}) as any) {
            infoMap[id] = (page as any).length ?? 0;
          }
        })
        .catch(() => {})
    );
  }
  await Promise.all(infoBatches);

  // Étape 3 : tri par taille décroissante → top N
  const topResults = geoResults
    .map(geo => ({ ...geo, articleLength: infoMap[String(geo.pageid)] ?? 0 }))
    .sort((a, b) => b.articleLength - a.articleLength)
    .slice(0, limit);

  if (!topResults.length) return [];

  // Étape 4 : détails (image + extrait) uniquement pour le top N
  const topPageids = topResults.map((r: any) => r.pageid);
  const detailsMap: Record<string, any> = {};

  for (let i = 0; i < topPageids.length; i += 50) {
    const batch = topPageids.slice(i, i + 50);
    const detailParams = new URLSearchParams({
      action: 'query',
      pageids: batch.join('|'),
      prop: 'extracts|pageimages',
      exintro: 'true',
      exchars: '250',
      piprop: 'thumbnail',
      pithumbsize: '600',
      format: 'json',
      origin: '*',
    });
    const detailRes = await fetch(`${WIKI_API}?${detailParams}`, {
      headers: { 'User-Agent': 'VoyageApp/2.0' },
    });
    if (detailRes.ok) {
      const d = await detailRes.json();
      Object.assign(detailsMap, d.query?.pages || {});
    }
  }

  // Étape 5 : fusion
  return topResults.map((geo: any) => {
    const detail = detailsMap[String(geo.pageid)] || {};
    const thumb = detail.thumbnail;
    const extract: string = (detail.extract || '').replace(/<[^>]+>/g, '').slice(0, 250);
    return {
      xid: `wiki_${geo.pageid}`,
      name: geo.title,
      kinds: '',
      coordinates: { lat: geo.lat, lng: geo.lon },
      rate: 3,
      wikidata: `wiki_${geo.pageid}`,
      dist: geo.dist,
      articleLength: geo.articleLength,
      preview: thumb ? { source: thumb.source, height: thumb.height, width: thumb.width } : undefined,
      description: extract || undefined,
    };
  });
}
