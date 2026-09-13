import { json } from "./_middleware.js";

export async function listSheets(kv) {
  const keys = [];
  let cursor;
  do {
    const page = await kv.list({ prefix: "sheet:", cursor });
    keys.push(...page.keys);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return keys;
}

// Returns filenames, most recently saved first (same shape as the old Flask /list).
export async function onRequestGet({ env }) {
  const keys = await listSheets(env.SHEETS);
  keys.sort((a, b) => (b.metadata?.saved_at || "").localeCompare(a.metadata?.saved_at || ""));
  return json(keys.map((key) => key.name.slice("sheet:".length)));
}
