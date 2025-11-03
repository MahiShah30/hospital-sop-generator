// Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import {
  doc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  addDoc,
  getDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "./firebase"; // your firestore export
import { authedFetch } from "./utils/authedFetch";

// Sections map - single source of truth for UI & progress
const SECTIONS = [
  { id: "hospital-info", title: "Hospital Info", subtitle: "Name, address, logo upload", route: "/questionnaire/hospital-info", color: "bg-blue-100", accent: "text-blue-600" },
  { id: "document-metadata", title: "Document Metadata", subtitle: "SOP title, number, dates, authors", route: "/questionnaire/document-metadata", color: "bg-green-100", accent: "text-green-600" },
  { id: "control-distribution", title: "Control & Distribution", subtitle: "Manual control, distribution list", route: "/questionnaire/control-distribution", color: "bg-indigo-100", accent: "text-indigo-600" },
  { id: "purpose-scope", title: "Purpose & Scope", subtitle: "Purpose, applicability, objectives", route: "/questionnaire/purpose-scope", color: "bg-yellow-100", accent: "text-yellow-600" },
  { id: "responsibilities", title: "Responsibilities & Contacts", subtitle: "Roles, escalation matrix & contacts", route: "/questionnaire/responsibilities", color: "bg-pink-100", accent: "text-pink-600" },
  { id: "policies-procedures", title: "Policies & Procedures", subtitle: "Step-by-step SOP content", route: "/questionnaire/policies-procedures", color: "bg-purple-100", accent: "text-purple-600" },
  { id: "quality-kpis", title: "Quality & KPIs", subtitle: "TAT, audits, KPIs", route: "/questionnaire/quality-kpis", color: "bg-emerald-100", accent: "text-emerald-600" },
  { id: "training-compliance", title: "Training & Compliance", subtitle: "Staff training & audits", route: "/questionnaire/training-compliance", color: "bg-amber-100", accent: "text-amber-600" },
  { id: "references-control", title: "References & Version Control", subtitle: "NABH, AERB, versioning", route: "/questionnaire/references-control", color: "bg-slate-100", accent: "text-slate-600" },
  { id: "layout-branding", title: "Layout & Branding", subtitle: "Cover, footer, page style", route: "/questionnaire/layout-branding", color: "bg-cyan-100", accent: "text-cyan-600" }
];

export default function Dashboard() {
  const [user, setUser] = useState(null);

  // Active draft (the one user is working on) - listened in real-time
  const [activeDraft, setActiveDraft] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [draftsList, setDraftsList] = useState([]); // optional list of user's drafts
  const [error, setError] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAISuggestions, setLoadingAISuggestions] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        if (typeof window !== "undefined") window.location.assign("/login");
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to user's most recent draft (active one). Strategy:
  // - Query user's sopDrafts ordered by updatedAt desc and pick the first draft with status != 'archived'
  useEffect(() => {
    if (!user) return;
    setLoadingDraft(true);
    const draftsCol = collection(db, "users", user.uid, "sopDrafts");
    const q = query(draftsCol, orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const drafts = [];
      snap.forEach((d) => drafts.push({ id: d.id, ...d.data() }));
      setDraftsList(drafts);
      // find the most relevant active draft:
      // prefer a draft whose status is 'draft' or 'ready' or 'generating' (not 'generated' or 'archived')
      const active = drafts.find(x => x.status && ["draft", "ready", "generating"].includes(x.status)) || drafts[0] || null;
      setActiveDraft(active);
      setLoadingDraft(false);
    }, (err) => {
      console.error("Drafts snapshot error:", err);
      setError("Failed to load drafts");
      setLoadingDraft(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Realtime update for sections: if activeDraft exists, listen to its sections subcollection (optional)
  useEffect(() => {
    if (!user || !activeDraft) return;

    const sectionsCol = collection(db, "users", user.uid, "sopDrafts", activeDraft.id, "sections");
    const q = query(sectionsCol, orderBy("lastSavedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      // We will merge the sections info into activeDraft.sections map for UI
      const sectionsObj = activeDraft.sections ? { ...activeDraft.sections } : {};
      snap.forEach((s) => {
        const sd = s.data();
        // determine completion heuristics: if section doc exists & has .progress >= 0.99 or has a completed flag, mark true
        const completed = sd?.progress >= 0.99 || sd?.completed === true;
        sectionsObj[s.id] = completed;
      });
      // update activeDraft locally (keep other fields)
      setActiveDraft(prev => prev ? { ...prev, sections: sectionsObj } : prev);
    }, (err) => {
      console.error("Sections snapshot error:", err);
    });

    return () => unsubscribe();
  }, [user, activeDraft?.id]);

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    if (typeof window !== "undefined") window.location.assign("/login");
  };

  // Helper to compute progress percentage based on activeDraft.sections
  const progress = useMemo(() => {
    const total = SECTIONS.length;
    if (!activeDraft || !activeDraft.sections) return 0;
    let completed = 0;
    for (const s of SECTIONS) {
      if (activeDraft.sections[s.id]) completed++;
    }
    return Math.round((completed / total) * 100);
  }, [activeDraft]);

  // Find first incomplete section route (or first section if none started)
  const firstIncompleteSectionRoute = useMemo(() => {
    if (!activeDraft) return SECTIONS[0].route;
    const sectionsMap = activeDraft.sections || {};
    const firstIncomplete = SECTIONS.find(s => !sectionsMap[s.id]);
    return (firstIncomplete ? firstIncomplete.route : SECTIONS[0].route);
  }, [activeDraft]);

  // Create a new draft document and navigate to the first section (used by Generate New SOP or Start if no draft)
  const createNewDraftAndStart = async () => {
    if (!user) return;
    try {
      // Create master doc
      const draftsCol = collection(db, "users", user.uid, "sopDrafts");
      const now = serverTimestamp();
      const draftPayload = {
        title: "Untitled SOP",
        creatorId: user.uid,
        createdAt: now,
        updatedAt: now,
        status: "draft",
        version: 1,
        sections: {}, // will hold sectionId: true/false
      };
      const newRef = await addDoc(draftsCol, draftPayload);
      // Navigate user to first section route with query params draftId
      if (typeof window !== "undefined") window.location.assign(`${SECTIONS[0].route}?draftId=${newRef.id}`);
    } catch (err) {
      console.error("createNewDraftAndStart error:", err);
      setError("Unable to create new draft");
    }
  };

  // When clicking "Start Full SOP" we should:
  // - if there's an active draft with incomplete sections -> go to first incomplete
  // - else if no draft -> create new draft and go to section 1
  const handleStartFullSOP = async () => {
    if (!user) return;
    if (!activeDraft) {
      // create new one
      await createNewDraftAndStart();
      return;
    }
    // If activeDraft exists and is generated, create new draft instead of resuming
    if (activeDraft.status === "generated") {
      await createNewDraftAndStart();
      return;
    }
    // Otherwise resume: go to first incomplete
    if (typeof window !== "undefined") window.location.assign(`${firstIncompleteSectionRoute}?draftId=${activeDraft.id}`);
  };

  // "Generate New SOP" button - when previous draft is generated, create new draft
  const handleGenerateNewSOP = async () => {
    await createNewDraftAndStart();
  };

  // Compile current draft to PDF via API
  const handleCompile = async () => {
    if (!activeDraft || !user) return;
    try {
      setError(null);
      setDownloadUrl("");
      setIsCompiling(true);
      const res = await authedFetch(`/api/drafts/${encodeURIComponent(activeDraft.id)}/compile`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Compile failed (${res.status})`);
      }
      const { url } = await res.json();
      if (url) setDownloadUrl(url);
    } catch (e) {
      setError(e.message || "Failed to compile SOP");
    } finally {
      setIsCompiling(false);
    }
  };

  // When user clicks a section card, navigate to the route with draftId param (create draft if none)
  const openSection = async (route) => {
    if (!user) return;
    if (!activeDraft) {
      // create then navigate
      await createNewDraftAndStart();
      return;
    }
    if (typeof window !== "undefined") window.location.assign(`${route}?draftId=${activeDraft.id}`);
  };

  // Fetch AI suggestions
  const fetchAISuggestions = async () => {
    if (!user || !activeDraft) return;
    try {
      setLoadingAISuggestions(true);
      const res = await authedFetch('/api/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: activeDraft.id })
      });
      if (!res.ok) {
        throw new Error('Failed to fetch AI suggestions');
      }
      const data = await res.json();
      setAiSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      setError('Failed to load AI suggestions');
    } finally {
      setLoadingAISuggestions(false);
    }
  };

  // Handle AI suggestions toggle
  const handleAISuggestionsToggle = () => {
    setShowAISuggestions(!showAISuggestions);
    if (!showAISuggestions && aiSuggestions.length === 0) {
      fetchAISuggestions();
    }
  };

  // Mark a section as completed quickly (utility for dev/test) - optional helper you can remove
  // async function markSectionComplete(sectionId) {
  //   if (!user || !activeDraft) return;
  //   const secRef = doc(db, "users", user.uid, "sopDrafts", activeDraft.id, "sections", sectionId);
  //   await setDoc(secRef, { completed: true, lastSavedAt: serverTimestamp(), progress: 1 }, { merge: true });
  //   const masterRef = doc(db, "users", user.uid, "sopDrafts", activeDraft.id);
  //   await updateDoc(masterRef, { [`sections.${sectionId}`]: true, updatedAt: serverTimestamp() });
  // }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-700 text-white py-3 px-4 sm:px-6 flex items-center justify-between">
        <h1 className="text-base sm:text-lg md:text-xl font-bold">
          HOSPITAL SOP <span className="text-white">GENERATOR</span>
        </h1>

        <div className="flex items-center gap-4">
          <div className="text-sm text-white/90 hidden sm:block">
            Welcome, <span className="font-semibold">{user?.displayName || "Hospital Admin"}</span>
          </div>

          <button
            onClick={handleLogout}
            className="bg-white text-blue-700 font-semibold px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Create SOPs — section by section</h2>
            <p className="text-sm text-gray-600">Fill each section, autosave progress, then generate a complete SOP.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStartFullSOP}
              className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors text-sm font-semibold"
              title="Start or resume SOP"
            >
              Start / Resume SOP
            </button>

            <a
              href="/previous"
              className="inline-flex items-center justify-center bg-white text-gray-700 px-4 py-2 rounded border hover:bg-gray-50 transition-colors text-sm"
            >
              Previous SOPs
            </a>
          </div>
        </div>

        {/* Progress area */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold">{activeDraft?.title || "No active draft"}</h3>
              <p className="text-xs text-gray-600">
                {activeDraft ? `Draft ID: ${activeDraft.id} • Status: ${activeDraft.status || "draft"}` : "Create a new SOP to begin."}
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span>{loadingDraft ? "Loading..." : `${progress}% complete`}</span>
              {activeDraft && (
                <button
                  onClick={handleCompile}
                  disabled={isCompiling}
                  className={`px-3 py-1 rounded border text-sm ${isCompiling ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"}`}
                  title="Generate SOP PDF"
                >
                  {isCompiling ? "Generating…" : "Generate SOP"}
                </button>
              )}
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
            <div>{SECTIONS.length} sections</div>
            <div>
              {activeDraft && activeDraft.status === "generated" ? (
                <button
                  onClick={handleGenerateNewSOP}
                  className="inline-flex items-center gap-2 bg-white border px-3 py-1 rounded text-sm hover:bg-gray-50 transition"
                >
                  Generate New SOP
                </button>
              ) : (
                <span>Draft is in progress</span>
              )}
            </div>
          </div>

          {downloadUrl && (
            <div className="mt-3 text-sm">
              <a href={downloadUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Download latest SOP PDF</a>
            </div>
          )}
        </div>

        {/* Widgets grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTIONS.map((s) => {
            const completed = activeDraft?.sections?.[s.id] === true;
            const inProgress = activeDraft?.sections?.[s.id] === false; // optional flag if you set explicitly
            const statusLabel = completed ? "Completed" : inProgress ? "In progress" : "Not started";

            return (
              <div
                key={s.id}
                className={`${s.color} rounded-lg p-5 shadow hover:shadow-md transition-shadow border border-transparent`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-lg font-bold ${s.accent}`}>{s.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{s.subtitle}</p>
                  </div>

                  <div className="ml-3 shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-sm ${s.accent}`}>
                      <span className="font-bold">{s.title.split(" ").map(w => w[0]).slice(0,2).join("")}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className={`text-xs ${completed ? "text-green-700" : "text-gray-600"}`}>Status: <span className="font-semibold">{statusLabel}</span></div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openSection(s.route)}
                      className="text-xs text-gray-700 hover:underline"
                      title={`Open ${s.title}`}
                    >
                      Open →
                    </button>

                    {/* Quick navigation link for read-only preview of completed section (if available) */}
                    {completed && (
                      <a
                        href={`/questionnaire/${s.id}/preview?draftId=${activeDraft?.id}`}
                        className="text-xs text-gray-600 hover:underline"
                        title="Preview section"
                      >
                        Preview
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary area: recent previews & quick status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Recent SOP Previews</h3>
            <p className="text-sm text-gray-600">No recent files yet. Start creating SOPs to see previews here.</p>
            <div className="mt-4 p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <p className="text-gray-400 text-sm">Your recent SOPs will appear here</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Quick Status</h3>

            <ul className="space-y-3 text-sm text-gray-700">
              <li>Active draft: <span className="font-semibold text-gray-900">{activeDraft?.title || "-"}</span></li>
              <li>Sections completed: <span className="font-semibold text-gray-900">{Math.round((progress/100) * SECTIONS.length)}</span></li>
              <li>AI suggestions pending: <span className="font-semibold text-purple-600">3</span></li>
              <li>Last activity: <span className="font-semibold text-yellow-600">{activeDraft?.updatedAt ? (new Date(activeDraft.updatedAt.seconds * 1000).toLocaleString()) : "—"}</span></li>
            </ul>

            <div className="mt-4">
              <button
                onClick={handleAISuggestionsToggle}
                className="text-purple-600 text-sm hover:underline"
                disabled={!activeDraft}
              >
                {loadingAISuggestions ? "Loading AI Suggestions…" : "View AI Suggestions →"}
              </button>
            </div>

            {showAISuggestions && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-800 mb-2">AI Suggestions</h4>
                {loadingAISuggestions ? (
                  <p className="text-xs text-purple-600">Generating suggestions...</p>
                ) : aiSuggestions.length > 0 ? (
                  <ul className="space-y-2 text-xs text-purple-700">
                    {aiSuggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion.replace(/^[•\-*]\s*/, '')}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-purple-600">No suggestions available. Complete some sections first.</p>
                )}
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="mt-2 text-xs text-purple-600 hover:underline"
                >
                  Hide suggestions
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <div className="mt-6 text-sm text-red-600">{error}</div>}
      </main>
    </div>
  );
}
