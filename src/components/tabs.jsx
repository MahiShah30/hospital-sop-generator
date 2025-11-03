import React, { useState } from 'react';

export const Tabs = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <div className={className}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};

export const TabsList = ({ children, className = '' }) => (
  <div className={`flex ${className}`}>{children}</div>
);

export const TabsTrigger = ({ value, children, activeTab, setActiveTab }) => {
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`flex-1 text-center p-2 border-b-2 ${
        isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
      }`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, activeTab }) => {
  return activeTab === value ? <div className="mt-4">{children}</div> : null;
};
