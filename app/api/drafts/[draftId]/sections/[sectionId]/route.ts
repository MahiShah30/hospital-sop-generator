import { NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "../../../../../../src/server/firebaseAdmin";

export async function PUT(request: Request, { params }: { params: { draftId: string; sectionId: string } }) {
  try {
    const token = getToken(request);
    const decoded = await verifyIdToken(token);
    const body = await request.json();
    const answers = body?.answers ?? {};
    const progress = typeof body?.progress === 'number' ? body.progress : 0.5;
    const db = getAdminDb();
    const sectionRef = db.collection("users").doc(decoded.uid)
      .collection("sopDrafts").doc(params.draftId)
      .collection("sections").doc(params.sectionId);
    await sectionRef.set({ answers, progress, lastSavedAt: new Date(), completed: progress >= 0.99 }, { merge: true });
    const draftRef = db.collection("users").doc(decoded.uid).collection("sopDrafts").doc(params.draftId);
    await draftRef.set({ updatedAt: new Date(), sections: { [params.sectionId]: progress >= 0.99 } }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

function getToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("no token");
  return token;
}


