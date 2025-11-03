"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../../../src/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import AuthGuard from "../../../../src/components/AuthGuard";
import { SECTION_SCHEMAS } from "../../../../src/schemas/sections";

export default function SectionPreviewPage() {
  const params = useParams();
  const sectionId = params.sectionId;
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const schema = SECTION_SCHEMAS[sectionId];

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
    if (!user || !draftId || !sectionId) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const secRef = doc(db, "users", user.uid, "sopDrafts", draftId, "sections", sectionId);
        const secSnap = await getDoc(secRef);
        if (secSnap.exists()) {
          setData(secSnap.data().answers || {});
        } else {
          setError("No data found for this section.");
        }
      } catch (err) {
        console.error("Error loading section data:", err);
        setError("Failed to load section data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, draftId, sectionId]);

  const renderFieldValue = (field, value) => {
    if (!value) return <span className="text-gray-500">Not provided</span>;

    switch (field.type) {
      case "file":
        return value ? <span className="text-blue-600">File uploaded</span> : <span className="text-gray-500">No file</span>;
      case "multi-select":
        return Array.isArray(value) ? value.join(", ") : value;
      case "repeater":
        if (!Array.isArray(value)) return <span className="text-gray-500">Invalid data</span>;
        return (
          <ul className="list-disc list-inside space-y-1">
            {value.map((item, idx) => (
              <li key={idx}>
                {field.itemSchema && Object.entries(field.itemSchema).map(([k, schema]) => (
                  <span key={k} className="block text-sm">
                    <strong>{k.replace(/_/g, " ")}:</strong> {item[k] || "N/A"}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        );
      default:
        return <span>{value}</span>;
    }
  };

  if (!schema) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">Unknown Section</h2>
            <p className="text-gray-600">No schema found for section: {sectionId}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading section preview...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-700 text-white py-3 px-6 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold">{schema.title} - Preview</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/questionnaire/${sectionId}?draftId=${draftId}`)}
              className="bg-white text-blue-700 font-semibold px-3 py-1 rounded hover:bg-gray-200"
            >
              Edit Section
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-white text-blue-700 font-semibold px-3 py-1 rounded hover:bg-gray-200"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{schema.title}</h2>
            {schema.description && <p className="text-gray-600 mb-6">{schema.description}</p>}

            <div className="space-y-6">
              {schema.fields.map((field) => (
                <div key={field.name} className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{field.label}</h3>
                  <div className="text-gray-700">
                    {renderFieldValue(field, data[field.name])}
                  </div>
                  {field.helpText && <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => router.push(`/questionnaire/${sectionId}?draftId=${draftId}`)}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
              >
                Edit This Section
              </button>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
