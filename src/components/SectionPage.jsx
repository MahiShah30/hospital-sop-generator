// src/components/SectionPage.jsx

import React, { useEffect, useState, useMemo } from "react";
import { SECTION_SCHEMAS } from "../schemas/sections";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

// --- CLEANED UP IMPORTS ---
// We only need our single, authoritative save function.
import { saveSectionAnswers } from "../utils/saveSection";

export default function SectionPage({ sectionId: propSectionId, draftId: propDraftId }) {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const draftId = propDraftId || params.get("draftId");
  const sectionId = propSectionId || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : undefined);
  const schema = SECTION_SCHEMAS[sectionId];

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(() => {
    const initial = {};
    (schema?.fields || []).forEach(f => initial[f.name] = f.type === "file" ? null : "");
    return initial;
  });
  
  // NEW STATE for loading and errors
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // (Optional) You can still implement logic to load existing data here.

  // --- REWRITTEN AND SIMPLIFIED SAVE HANDLER ---
  const handleExplicitSave = async () => {
    if (!user || !draftId) {
      alert("You must be logged in and have an active draft");
      return;
    }
    
    setSaveError(''); // Clear previous errors

    // --- ADD VALIDATION HERE ---
    // Example: Check if the first field is empty
    const firstField = schema.fields[0];
    if (firstField && !formData[firstField.name]) {
        setSaveError(`${firstField.label} is a required field.`);
        return; // Stop the save
    }
    // Add more validation rules as needed...

    setIsSaving(true);
    try {
      // DELEGATE ALL THE COMPLEX LOGIC to our single, reliable function.
      // This will handle file uploads to Supabase and save data to Firestore automatically.
      await saveSectionAnswers(user.uid, draftId, sectionId, formData, 1.0); // progress = 100%
      alert("Section saved");

    } catch (err) {
      console.error("Explicit save error", err);
      const msg = err?.message || 'Save failed. Please try again.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, type, value, files, checked } = e.target;
    if (type === "file") {
      setFormData(prev => ({ ...prev, [name]: files[0] || null }));
    } else if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (!schema) {
    return <div>Unknown section: "{sectionId}"</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{schema.title}</h1>
        <p className="text-sm text-gray-600">{schema.description}</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleExplicitSave(); }}>
        <div className="space-y-4">
          {schema.fields.map((field) => {
            const key = field.name;
            const value = formData[key] ?? "";

            // Your field rendering logic (textarea, file, input) is perfect, no changes needed here.
            // ... (paste your existing field rendering JSX here)
            if (field.type === "textarea") { /* ... */ }
            if (field.type === "file") { /* ... */ }
            return (
              <div key={key} className="field">
                <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={key}
                    name={key}
                    value={value}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                ) : field.type === "file" ? (
                  <input
                    id={key}
                    name={key}
                    type="file"
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                ) : (
                  <input
                    id={key}
                    name={key}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save section"}
          </button>
          <button type="button" onClick={() => window.history.back()} className="bg-white border px-3 py-2 rounded">
            Back
          </button>
          
          {/* Display any save errors */}
          {saveError && <div className="text-sm text-red-600 ml-auto">{saveError}</div>}
        </div>
      </form>
    </div>
  );
}