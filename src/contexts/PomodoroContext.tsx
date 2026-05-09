import { createContext, useContext, useState, useCallback } from 'react';

interface PomodoroContextValue {
  activeId: string | null;
  claim: (id: string) => void;
  release: (id: string) => void;
}

const PomodoroContext = createContext<PomodoroContextValue>({
  activeId: null,
  claim: () => {},
  release: () => {},
});

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const claim = useCallback((id: string) => setActiveId(id), []);
  const release = useCallback((id: string) => setActiveId(prev => prev === id ? null : prev), []);

  return (
    <PomodoroContext.Provider value={{ activeId, claim, release }}>
      {children}
    </PomodoroContext.Provider>
  );
}

export const usePomodoroContext = () => useContext(PomodoroContext);
