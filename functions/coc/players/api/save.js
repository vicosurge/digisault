import { json, sanitizeName, sheetKey } from "./_middleware.js";

const MAX_BYTES = 512 * 1024;

export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, { Allow: "POST" });
  }
  const raw = await request.text();
  if (raw.length > MAX_BYTES) {
    return json({ error: "File too large" }, 413);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ error: "No data provided" }, 400);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json({ error: "No data provided" }, 400);
  }

  const name = typeof data.name === "string" ? data.name : "unnamed";
  if (!name.trim()) {
    return json({ error: "Character name is required" }, 400);
  }

  const filename = sanitizeName(name);
  const savedAt = new Date().toISOString();
  data._metadata = { saved_at: savedAt, original_name: name };

  await env.SHEETS.put(sheetKey(filename), JSON.stringify(data), {
    metadata: { display_name: name, saved_at: savedAt },
  });

  return json({ status: "success", message: `Character '${name}' saved successfully`, filename });
}
