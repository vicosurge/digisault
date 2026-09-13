import { json, nameParam, sanitizeName, sheetKey } from "../_middleware.js";

export async function onRequest(context) {
  if (context.request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, 405, { Allow: "DELETE" });
  }
  const name = nameParam(context);
  const key = sheetKey(sanitizeName(name));
  const kv = context.env.SHEETS;

  if ((await kv.get(key)) === null) {
    return json({ error: "Character not found" }, 404);
  }
  await kv.delete(key);
  return json({ status: "success", message: `Character '${name}' deleted` });
}
