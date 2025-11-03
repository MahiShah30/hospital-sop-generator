"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../src/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import AuthGuard from "../../src/components/AuthGuard";

export default function PreviousSOPsPage() {
  const [user, setUser] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const draftsCol = collection(db, "users", user.uid, "sopDrafts");
    const q = query(draftsCol, orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const draftsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDrafts(draftsData);
      setLoading(false);
    }, (err) => {
      console.error("Error loading drafts:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleViewDownload = (draft) => {
    if (draft.status === "generated" && draft.downloadUrl) {
      window.open(draft.downloadUrl, "_blank");
    } else {
      // Navigate to dashboard or show message
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading previous SOPs...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-700 text-white py-3 px-6 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold">Previous SOPs</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-white text-blue-700 font-semibold px-3 py-1 rounded hover:bg-gray-200"
          >
            Back to Dashboard
          </button>
        </header>

        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Your Previous SOPs</h2>

            {drafts.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-600">No previous SOPs found. Start creating one from the dashboard.</p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <div key={draft.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{draft.title || "Untitled SOP"}</h3>
                        <p className="text-sm text-gray-600">ID: {draft.id}</p>
                        <p className="text-sm text-gray-600">
                          Status: <span className={`font-medium ${
                            draft.status === "generated" ? "text-green-600" :
                            draft.status === "draft" ? "text-yellow-600" : "text-gray-600"
                          }`}>{draft.status || "draft"}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Last updated: {draft.updatedAt ? new Date(draft.updatedAt.seconds * 1000).toLocaleString() : "N/A"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleViewDownload(draft)}
                        className={`px-4 py-2 rounded font-semibold ${
                          draft.status === "generated"
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {draft.status === "generated" ? "Download PDF" : "View/Edit"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
