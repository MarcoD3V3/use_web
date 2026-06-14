const DEVICE_KEY = "cl_portal_device_id";
const FINGERPRINT_KEY = "cl_portal_device_fp";

async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export async function getDeviceFingerprint(): Promise<string> {
  const cached = localStorage.getItem(FINGERPRINT_KEY);
  if (cached && /^[0-9a-f]{64}$/i.test(cached)) return cached;
  const deviceId = getOrCreateDeviceId();
  const parts = [deviceId, navigator.platform, navigator.userAgent, "craftlauncher-portal"].join("|");
  const fp = await sha256Hex(parts);
  localStorage.setItem(FINGERPRINT_KEY, fp);
  return fp;
}

export async function getPortalDeviceCredentials() {
  return {
    deviceId: getOrCreateDeviceId(),
    fingerprint: await getDeviceFingerprint(),
  };
}
