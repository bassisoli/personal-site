// Cloudflare Worker — values analysis proxy
// Deploy via Cloudflare dashboard (paste into editor).
//
// Setup checklist:
//   1. Create Worker named "values-api" (or any name)
//   2. Add environment variable ANTHROPIC_API_KEY = (your Anthropic API key)
//   3. Add route: christianhales.com/values-api*

export default {
  async fetch(request, env) {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://christianhales.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
    }

    const { values } = body;
    if (!values || !Array.isArray(values) || values.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing values array' }), { status: 400, headers });
    }

    const rankedList = values.map((v, i) => `${i + 1}. ${v}`).join('\n');

    const prompt = `Here are someone's top 10 personal values, ranked in order of importance to them:

${rankedList}

Write a 3-paragraph personalized analysis of this person based on their values. Address them in second person ("you"). Focus on what the specific combination reveals — not just what each value means individually, but what having all of these together says about how you make decisions, what you protect, what you're drawn toward, and what tensions might quietly exist between some of them. Be warm but honest. Avoid being generic or flattering — say something true.`;

    let claudeResponse;
    try {
      const apiRequest = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-7',
          max_tokens: 600,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!apiRequest.ok) {
        const errText = await apiRequest.text();
        return new Response(JSON.stringify({ error: 'Claude API error', detail: errText }), { status: 502, headers });
      }

      claudeResponse = await apiRequest.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Failed to reach Claude API' }), { status: 502, headers });
    }

    const analysis = claudeResponse?.content?.[0]?.text ?? '';

    return new Response(JSON.stringify({ analysis }), { headers });
  },
};
