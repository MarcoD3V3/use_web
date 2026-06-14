export function getAdminApiUrl(): string {
  return (
    process.env.ADMIN_API_URL ??
    process.env.NEXT_PUBLIC_ADMIN_API_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

const LOCAL_ADMIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export function isAdminApiUrlMissingForDeploy(): boolean {
  const url = getAdminApiUrl();
  return process.env.NODE_ENV === "production" && LOCAL_ADMIN_RE.test(url);
}
