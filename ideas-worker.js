// Cloudflare Worker for ideas-api
// Paste this into the Cloudflare Worker editor at dash.cloudflare.com
// Requires a KV namespace called IDEAS_KV bound to this worker

export default {
  async fetch(request, env) {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://christianhales.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (request.method === 'GET') {
      // Return list of recently shown idea IDs
      const list = await env.IDEAS_KV.list({ prefix: 'shown:' });
      const shownIds = list.keys.map(k => parseInt(k.name.replace('shown:', '')));
      return new Response(JSON.stringify(shownIds), { headers });
    }

    if (request.method === 'POST') {
      const { id } = await request.json();
      await env.IDEAS_KV.put(`shown:${id}`, '1', { expirationTtl: 43200 }); // 12 hours
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    return new Response('Not found', { status: 404 });
  }
};
