import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getRuntimeValue(name: string) {
  try {
    const context = await getCloudflareContext({ async: true });
    const value = (context.env as unknown as Record<string, unknown>)[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  } catch {
    // Local Next.js runs can use process.env instead of a Workers binding.
  }

  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export async function getAppOrigin() {
  return (await getRuntimeValue("APP_ORIGIN")) || "https://lucapisanumusic.com";
}
