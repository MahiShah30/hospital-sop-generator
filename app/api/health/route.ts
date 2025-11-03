import { NextResponse } from "next/server";
import { verifyIdToken } from "../../../src/server/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    await verifyIdToken(token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
}


