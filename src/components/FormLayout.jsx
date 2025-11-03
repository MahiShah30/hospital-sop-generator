// src/components/FormLayout.jsx
import React from "react";

export default function FormLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200 py-12 px-4 flex justify-center items-start">
      <div className="w-full max-w-4xl p-6 md:p-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-50">
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-700">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
