export type FieldErrors = Record<string, string>;

export function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function nullableText(value: unknown) {
  const cleaned = text(value);
  return cleaned || null;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function booleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
  }

  return fallback;
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function nullableUrl(value: unknown, errors: FieldErrors, field: string) {
  const url = nullableText(value);
  if (url && !isHttpUrl(url)) {
    errors[field] = "Enter a valid http or https URL.";
  }

  return url;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, ...data }, init);
}

export function jsonError(
  message: string,
  status: number,
  fieldErrors?: FieldErrors,
) {
  return Response.json(
    {
      ok: false,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
    { status },
  );
}

export async function readJson<T>(request: Request) {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function idFromRequestUrl(request: Request) {
  return new URL(request.url).searchParams.get("id")?.trim() ?? "";
}
