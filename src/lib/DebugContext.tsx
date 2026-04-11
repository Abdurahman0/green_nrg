import React, { createContext, useContext, useMemo, useState } from 'react';

type DebugContextValue = {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
};

const DebugContext = createContext<DebugContextValue | undefined>(undefined);

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(false);

  const value = useMemo(() => ({ enabled, setEnabled }), [enabled]);
  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>;
};

export const useDebug = () => {
  const ctx = useContext(DebugContext);
  if (!ctx) throw new Error('useDebug must be used within DebugProvider');
  return ctx;
};

