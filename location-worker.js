// Cloudflare Worker — live location for Holy Ultra
// Deploy via Cloudflare dashboard (paste into editor).
//
// Setup checklist:
//   1. Create Worker named "location-api" (or any name)
//   2. Create KV namespace "LOCATION_KV" → bind to this worker as LOCATION_KV
//   3. Add environment variable LOCATION_TOKEN = (any random secret string)
//   4. Add route: christianhales.com/race-location*
//
// Overland app config:
//   URL: https://christianhales.com/race-location?token=YOUR_TOKEN
//   Method: POST (Overland default)

export default {
  async fetch(request, env) {
    const cors = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // POST — Overland sends location here
    if (request.method === 'POST') {
      const url = new URL(request.url);
      if (url.searchParams.get('token') !== env.LOCATION_TOKEN) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors });
      }
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers: cors });
      }
      const locations = body.locations ?? [];
      if (!locations.length) {
        return new Response(JSON.stringify({ result: 'ok', stored: false }), { headers: cors });
      }
      const loc = locations[locations.length - 1];
      const [lng, lat] = loc.geometry.coordinates;
      const timestamp = loc.properties.timestamp;
      await env.LOCATION_KV.put('current', JSON.stringify({ lat, lng, timestamp }), { expirationTtl: 86400 });
      return new Response(JSON.stringify({ result: 'ok', stored: true }), { headers: cors });
    }

    // GET — map page polls this
    if (request.method === 'GET') {
      const raw = await env.LOCATION_KV.get('current');
      if (!raw) {
        return new Response(JSON.stringify({ active: false }), { headers: cors });
      }
      const loc = JSON.parse(raw);
      const ageHours = (Date.now() - new Date(loc.timestamp).getTime()) / 3600000;
      // Mark inactive after 12 hours (race is over)
      return new Response(JSON.stringify({ active: ageHours < 12, ...loc }), { headers: cors });
    }

    return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: cors });
  }
};
