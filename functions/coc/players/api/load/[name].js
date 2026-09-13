import { json, nameParam, sanitizeName, sheetKey } from "../_middleware.js";

export async function onRequestGet(context) {
  const raw = await context.env.SHEETS.get(sheetKey(sanitizeName(nameParam(context))));
  if (raw === null) {
    return json({ error: "Character not found" }, 404);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ error: "Corrupted character file" }, 500);
  }
  delete data._metadata;
  return json(data);
}
