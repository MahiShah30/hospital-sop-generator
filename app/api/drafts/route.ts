import { NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "../../../src/server/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const token = getToken(request);
    const decoded = await verifyIdToken(token);
    const db = getAdminDb();
    const snap = await db.collection("users").doc(decoded.uid).collection("sopDrafts").orderBy("updatedAt", "desc").get();
    const drafts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ drafts });
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getToken(request);
    const decoded = await verifyIdToken(token);
    const body = await request.json();
    const title = (body?.title ?? "Untitled").toString();
    const db = getAdminDb();
    const ref = db.collection("users").doc(decoded.uid).collection("sopDrafts").doc();
    const now = new Date();
    const draft = { title, status: "in_progress", sections: {}, createdAt: now, updatedAt: now } as any;
    await ref.set(draft);
    return NextResponse.json({ draft: { id: ref.id, ...draft } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

function getToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("no token");
  return token;
}


