// src/hooks/useAutosave.js
import { useEffect, useRef, useState } from "react";

/**
 * useAutosave
 * - value: object to save
 * - saveFn: async function(value) -> handles the save
 * - delay: debounce ms
 */
export default function useAutosave(value, saveFn, delay = 3000) {
  const timer = useRef(null);
  const lastSavedRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error

  useEffect(() => {
    // Clear existing timer
    if (timer.current) clearTimeout(timer.current);

    // If value is nullish, do nothing
    if (value == null) return;

    setStatus("saving");
    timer.current = setTimeout(async () => {
      try {
        await saveFn(value);
        lastSavedRef.current = Date.now();
        setStatus("saved");
      } catch (err) {
        console.error("Autosave error", err);
        setStatus("error");
      } finally {
        timer.current = null;
      }
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]); // stringify so nested objects trigger effect

  return { status, lastSavedAt: lastSavedRef.current };
}
