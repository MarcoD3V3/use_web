import { unsealPortalAccess } from "@craftlauncher/shared";

export async function resolvePortalLoginPassword(input: {
  password?: string;
  portalAccessSealed?: string;
}): Promise<string | null> {
  const sealed = input.portalAccessSealed?.trim();
  if (sealed) {
    const secret = process.env.PORTAL_CLIPBOARD_SECRET?.trim();
    if (!secret || secret.length < 16) return null;
    return unsealPortalAccess(sealed, secret);
  }
  const plain = input.password?.trim();
  return plain || null;
}

export function isPortalClipboardSecretConfigured(): boolean {
  const secret = process.env.PORTAL_CLIPBOARD_SECRET?.trim();
  return Boolean(secret && secret.length >= 16);
}
