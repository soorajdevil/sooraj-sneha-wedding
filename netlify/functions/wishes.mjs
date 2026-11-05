// Netlify Function: GET/POST /api/wishes, stored in Netlify Blobs (no external database needed).
import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async (req) => {
  const store = getStore("wishes");

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const keys = blobs.map((b) => b.key).sort().reverse().slice(0, 200); // keys start with a timestamp
    const wishes = await Promise.all(keys.map((k) => store.get(k, { type: "json" })));
    return json(wishes.filter(Boolean));
  }

  if (req.method === "POST") {
    let d;
    try { d = JSON.parse(await req.text()); } catch { return json({ error: "bad request" }, 400); }
    const name = String(d.name || "").trim().slice(0, 60);
    const message = String(d.message || "").trim().slice(0, 500);
    if (!name || !message) return json({ error: "name and message required" }, 400);
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await store.setJSON(key, { name, message });
    return json({ ok: true }, 201);
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/wishes" };
