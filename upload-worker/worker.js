/**
 * Cloudflare Worker — HARS Photo Upload Proxy
 *
 * Reçoit une image JPEG depuis le widget JotForm,
 * l'upload sur Supabase Storage, et retourne l'URL publique.
 *
 * Secrets requis (wrangler secret put) :
 *   SUPABASE_URL         ex: https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY clé service_role (pas anon)
 *
 * Bucket Supabase : widget-photos (public)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname !== '/upload') {
      return json({ error: 'Not found' }, 404);
    }

    try {
      const formData = await request.formData();
      const file     = formData.get('file');      // Blob JPEG
      const filename = formData.get('filename') || ('photo_' + Date.now() + '.jpg');

      if (!file) {
        return json({ error: 'Champ "file" manquant' }, 400);
      }

      // Chemin dans le bucket : photos/2026/04/photo_xxx.jpg
      const now  = new Date();
      const dir  = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0');
      const path = dir + '/' + filename;

      const uploadUrl = env.SUPABASE_URL +
        '/storage/v1/object/widget-photos/' + path;

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        body: file,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error('[Worker] Supabase upload error:', uploadRes.status, errText);
        return json({ error: 'Supabase upload failed: ' + uploadRes.status }, 500);
      }

      const publicUrl = env.SUPABASE_URL +
        '/storage/v1/object/public/widget-photos/' + path;

      return json({ url: publicUrl, path: path });

    } catch (err) {
      console.error('[Worker] Exception:', err);
      return json({ error: err.message }, 500);
    }
  }
};

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
