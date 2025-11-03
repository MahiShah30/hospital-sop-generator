// src/components/FormRenderer.jsx
import React, { useEffect, useRef, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; // adjust if your firebase export path differs
import { SECTION_SCHEMAS } from "../schemas/sections";
import { saveWithAttachment } from "../utils/saveWithAttachmentHelper";

/**
 * FieldRenderer - a small child component that owns state for a single field.
 * This avoids conditional hooks in the parent and keeps each field self-contained.
 */
function FieldRenderer({ field, value, onChange }) {
  // Always call hooks at top-level of FieldRenderer
  const [val, setVal] = useState(value ?? (field.type === "repeater" ? [] : ""));

  useEffect(() => {
    // when parent value changes (e.g., loaded from DB), sync
    setVal(value ?? (field.type === "repeater" ? [] : ""));
  }, [value, field.type]);

  function handleChange(e) {
    const target = e.target;
    if (field.type === "file") {
      // file input: pass FileList or null
      const file = target.files && target.files[0] ? target.files[0] : null;
      setVal(file);
      onChange(file);
      return;
    }

    // multi-select (array)
    if (field.type === "multi-select") {
      // handle <select multiple> or custom checkbox arrays
      if (target.multiple) {
        const selected = Array.from(target.selectedOptions).map(o => o.value);
        setVal(selected);
        onChange(selected);
        return;
      }
    }

    setVal(target.value);
    onChange(target.value);
  }

  // Render by field.type
  switch (field.type) {
    case "textarea":
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.required ? " *" : ""}</label>
          <textarea
            className="w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            placeholder={field.placeholder || ""}
            value={val}
            onChange={handleChange}
            rows={4}
          />
          {field.helpText && <div className="text-xs text-gray-400 mt-1">{field.helpText}</div>}
        </div>
      );

    case "select":
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.required ? " *" : ""}</label>
          <select
            value={val || ""}
            onChange={handleChange}
            className="w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{field.placeholder || "Select an option"}</option>
            {Array.isArray(field.options) && field.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );

    case "multi-select":
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.required ? " *" : ""}</label>
          <select
            multiple
            value={Array.isArray(val) ? val : []}
            onChange={handleChange}
            className="w-full p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-28"
          >
            {Array.isArray(field.options) && field.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {field.helpText && <div className="text-xs text-gray-400 mt-1">{field.helpText}</div>}
        </div>
      );

    case "repeater":
      // repeater expects an array of items; each item is an object according to itemSchema
      return (
        <RepeaterField field={field} value={val} onChange={onChange} />
      );

    case "number":
    case "date":
    case "phone":
    case "email":
    case "text":
    default:
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.required ? " *" : ""}</label>
          <input
            type={field.type === "phone" ? "tel" : (field.type === "number" ? "number" : (field.type === "email" ? "email" : (field.type === "date" ? "date" : "text")))}
            placeholder={field.placeholder || ""}
            value={val ?? ""}
            onChange={handleChange}
            className="w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {field.helpText && <div className="text-xs text-gray-400 mt-1">{field.helpText}</div>}
        </div>
      );
  }
}

/**
 * RepeaterField - handles add/remove rows for repeater field types.
 * Keeps internal state and reports full array in onChange.
 */
function RepeaterField({ field, value, onChange }) {
  const [items, setItems] = useState(Array.isArray(value) ? value : []);

  useEffect(() => setItems(Array.isArray(value) ? value : []), [value]);

  const addRow = () => {
    // create an empty item based on itemSchema
    const blank = {};
    if (field.itemSchema) {
      for (const k of Object.keys(field.itemSchema)) {
        blank[k] = "";
      }
    }
    const next = [...items, blank];
    setItems(next);
    onChange(next);
  };

  const updateRow = (index, key, val) => {
    const next = items.map((it, i) => (i === index ? { ...it, [key]: val } : it));
    setItems(next);
    onChange(next);
  };

  const removeRow = (index) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    onChange(next);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="p-3 border rounded-md bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div className="text-sm font-medium text-gray-700">Item {idx + 1}</div>
              <button type="button" onClick={() => removeRow(idx)} className="text-sm text-red-600 hover:underline">Remove</button>
            </div>

            <div className="mt-3 space-y-2">
              {field.itemSchema && Object.entries(field.itemSchema).map(([k, schema]) => (
                <div key={k}>
                  <label className="block text-xs text-gray-600 mb-1">{k.replace(/_/g, " ")}</label>
                  {schema.type === "textarea" ? (
                    <textarea
                      rows={2}
                      value={it[k] ?? ""}
                      onChange={e => updateRow(idx, k, e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  ) : (
                    <input
                      type="text"
                      value={it[k] ?? ""}
                      onChange={e => updateRow(idx, k, e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <button type="button" onClick={addRow} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          + Add
        </button>
      </div>
    </div>
  );
}

/**
 * FormRenderer - parent component that renders a section schema and manages the overall form data.
 */
export default function FormRenderer({ sectionId, draftId }) {
  // Top-level hooks only; avoid conditional hooks
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // main form state: { fieldKey: value, ... }
  const [formState, setFormState] = useState({});
  const autosaveTimer = useRef(null);

  // lookup schema by sectionId (ensure id formats match)
  const schema = SECTION_SCHEMAS[sectionId] || null;

  // Load saved answers (if any) from Firestore on mount/when draftId or sectionId changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      if (!draftId || !sectionId) {
        setFormState({});
        setLoading(false);
        return;
      }
      try {
        // Expecting section doc under users/{uid}/sopDrafts/{draftId}/sections/{sectionId}
        // But we don't have the uid here; try to fetch by current user
        const user = auth.currentUser;
        if (!user) {
          setFormState({});
          setLoading(false);
          return;
        }
        const secRef = doc(db, "users", user.uid, "sopDrafts", draftId, "sections", sectionId);
        const secSnap = await getDoc(secRef);
        if (secSnap.exists()) {
          const data = secSnap.data();
          if (!cancelled) setFormState(data.answers || {});
        } else {
          if (!cancelled) setFormState({});
        }
      } catch (err) {
        console.error("Failed loading section:", err);
        if (!cancelled) setError("Failed to load saved answers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => { cancelled = true; };
  }, [draftId, sectionId]);

  // onFieldChange: update top-level formState
  const onFieldChange = (key, value) => {
    setFormState(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  // save handler (explicit save)
  const handleSaveNow = async () => {
    setSaving(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      // call your helper; it should upload files if provided and write section doc
      await saveWithAttachment(user.uid, draftId, sectionId, formState);

      // Also update master doc's updatedAt and sections map (safe double-update)
      const masterRef = doc(db, "users", user.uid, "sopDrafts", draftId);
      await updateDoc(masterRef, {
        updatedAt: serverTimestamp(),
        [`sections.${sectionId}`]: true
      }).catch(() => {
        // ignore update errors (e.g. if master doc missing)
      });

      setLastSaved(new Date());
    } catch (err) {
      console.error("Save failed:", err);
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Debounced autosave effect: triggers when formState changes
  useEffect(() => {
    // clear existing timer
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }

    // Only auto-save if we have a draft and a user
    if (!draftId || !sectionId) return;
    // optionally avoid autosave if nothing to save
    if (!formState || Object.keys(formState).length === 0) return;

    autosaveTimer.current = setTimeout(async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        // Note: we call saveWithAttachment; if it uploads files, ensure it handles file objects
        await saveWithAttachment(user.uid, draftId, sectionId, formState);

        // update master doc timestamp map (non-blocking)
        const masterRef = doc(db, "users", user.uid, "sopDrafts", draftId);
        await updateDoc(masterRef, { updatedAt: serverTimestamp(), [`sections.${sectionId}`]: true }).catch(() => {});

        setLastSaved(new Date());
      } catch (err) {
        console.error("Autosave error:", err);
        // do not set global error to avoid noisy UI on transient failures
      }
    }, 3500); // Debounce 3.5s

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(formState), draftId, sectionId]);

  // Render guard: if no schema, show helpful message (no hooks conditionally used)
  if (!schema) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white p-6 rounded-md shadow">
          <h2 className="text-xl font-semibold">Unknown section</h2>
          <p className="text-sm text-gray-600">No form schema found for <span className="font-mono">{sectionId}</span>.</p>
        </div>
      </div>
    );
  }

  // Render form
  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">{schema.title || "Section"}</h1>
            {schema.description && <p className="text-sm text-gray-500 mt-1">{schema.description}</p>}
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading...</div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveNow(); }}>
              <div>
                {(schema.fields || []).map((f) => (
                  <FieldRenderer
                    key={f.key || f.id}
                    field={f}
                    value={formState[f.key] ?? formState[f.id] ?? ""}
                    onChange={(val) => onFieldChange(f.key || f.id, val)}
                  />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-4 py-2 rounded-md font-semibold ${saving ? "bg-gray-400 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                  >
                    {saving ? "Saving..." : "Save Section"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // reset to last saved state (re-fetch)
                      setLoading(true);
                      const user = auth.currentUser;
                      if (!user) { setLoading(false); return; }
                      const secRef = doc(db, "users", user.uid, "sopDrafts", draftId, "sections", sectionId);
                      getDoc(secRef).then(snap => {
                        if (snap.exists()) setFormState(snap.data().answers || {});
                        else setFormState({});
                      }).catch(err => console.error(err)).finally(() => setLoading(false));
                    }}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Reload
                  </button>

                  <div className="text-sm text-gray-500">
                    {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : "Not saved yet"}
                  </div>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
