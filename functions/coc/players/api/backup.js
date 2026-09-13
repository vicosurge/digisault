import { json } from "./_middleware.js";
import { listSheets } from "./list.js";

// Downloads every saved character as one JSON file, keyed by filename.
export async function onRequestGet({ env }) {
  const all = {};
  for (const key of await listSheets(env.SHEETS)) {
    const raw = await env.SHEETS.get(key.name);
    try {
      all[key.name.slice("sheet:".length)] = JSON.parse(raw);
    } catch {
      // skip corrupted entries, like the Flask version did
    }
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
  return json(all, 200, {
    "Content-Disposition": `attachment; filename=coc_characters_backup_${stamp}.json`,
  });
}
