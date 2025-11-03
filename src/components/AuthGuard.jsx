"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function AuthGuard({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStatus("authed");
      } else {
        setStatus("redirect");
        if (typeof window !== "undefined") {
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.replace(`/login?returnTo=${returnTo}`);
        }
      }
    });
    return () => unsub();
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Checking authentication…</div>
      </div>
    );
  }

  if (status !== "authed") {
    return null;
  }

  return <>{children}</>;
}


