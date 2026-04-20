/**
 * GitHub Stats Proxy Worker.
 *
 * Proxies specific GitHub repo API requests through a Marbl-owned edge,
 * caches the response for 5 minutes, and returns a minimal payload to
 * the caller. Prevents client IPs from being exposed to GitHub, avoids
 * anonymous rate limits for our users, and gives us a stable contract.
 *
 * Route: https://github-stats.marbl-codes.workers.dev/repos/:owner/:repo
 * Returns: { stargazers_count, forks_count, subscribers_count, updated_at }
 *
 * Allow-list by design: only Marbl-owned repos can be queried.
 */

const ALLOWED_REPOS = new Set([
  'memdigital/thou-art-that'
  // Add more Marbl public repos as needed
]);

const CACHE_TTL_SECONDS = 300; // 5 minutes

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'GET') {
      return jsonError(405, 'Method not allowed');
    }

    const match = url.pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/?$/);
    if (!match) {
      return jsonError(404, 'Not found');
    }
    const owner = match[1];
    const repo = match[2];
    const key = owner + '/' + repo;

    if (!ALLOWED_REPOS.has(key)) {
      return jsonError(403, 'Repo not in allow-list');
    }

    const cacheKey = new Request('https://cache/repos/' + key, { method: 'GET' });
    const cache = caches.default;

    let response = await cache.match(cacheKey);
    if (response) {
      return response;
    }

    const ghUrl = 'https://api.github.com/repos/' + owner + '/' + repo;
    const ghHeaders = {
      'User-Agent': 'marbl-codes-thou-art-that-proxy/1.0',
      'Accept': 'application/vnd.github+json'
    };
    if (env && env.GITHUB_TOKEN) {
      ghHeaders['Authorization'] = 'Bearer ' + env.GITHUB_TOKEN;
    }

    const ghRes = await fetch(ghUrl, { headers: ghHeaders });
    if (!ghRes.ok) {
      return jsonError(ghRes.status, 'Upstream error');
    }

    const data = await ghRes.json();
    const body = JSON.stringify({
      stargazers_count: data.stargazers_count,
      forks_count: data.forks_count,
      subscribers_count: data.subscribers_count,
      updated_at: data.updated_at
    });

    response = new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=' + CACHE_TTL_SECONDS
      }
    });

    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://marbl.codes',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
  });
}
