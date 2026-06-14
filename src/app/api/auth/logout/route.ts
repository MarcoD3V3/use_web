import { NextResponse } from "next/server";
import { PORTAL_AUTH } from "@/lib/auth-cookies";

export async function POST() {
  const response = NextResponse.json({ success: true });
  for (const name of Object.values(PORTAL_AUTH) as string[]) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}
