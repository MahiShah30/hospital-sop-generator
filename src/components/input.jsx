import React from 'react';

export const Input = ({ className = '', ...props }) => (
  <input
    className={`border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
);
