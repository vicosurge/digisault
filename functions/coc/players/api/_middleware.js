// Runs before every /coc/players/api/* request.
// Needs a KV namespace bound as SHEETS. If the SHEETS_PASSCODE variable is set,
// requests must send it in the X-Sheets-Passcode header.

const encoder = new TextEncoder();

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Saved sheets change often and may be passcode-protected: never cache them.
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

// Same rules as the old Flask sanitize_filename().
export function sanitizeName(name) {
  let clean = String(name ?? "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/^[. ]+|[. ]+$/g, "")
    .replace(/ /g, "_")
    .toLowerCase()
    .slice(0, 50);
  if (!clean) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
    clean = `character_${stamp}`;
  }
  return clean;
}

export function sheetKey(filename) {
  return `sheet:${filename}`;
}

export function nameParam(context) {
  try {
    return decodeURIComponent(context.params.name);
  } catch {
    return context.params.name;
  }
}

function passcodeMatches(given, expected) {
  const a = encoder.encode(given);
  const b = encoder.encode(expected);
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
}

export async function onRequest(context) {
  const { env, request } = context;
  if (!env.SHEETS) {
    return json({ error: "Storage not configured: bind a KV namespace as SHEETS" }, 500);
  }
  if (env.SHEETS_PASSCODE && !passcodeMatches(request.headers.get("X-Sheets-Passcode") || "", env.SHEETS_PASSCODE)) {
    return json({ error: "Passcode required" }, 401);
  }
  return context.next();
}
