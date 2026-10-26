import React, { createContext, useContext } from 'react';
import { useSessionController } from '@/store/useSessionController';
import type { SessionContextValue } from '@/store/useSessionController';

export type { AudioPreparationStatus } from '@/store/useSessionController';

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: React.PropsWithChildren) {
  const value = useSessionController();
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useRhythmSession(): SessionContextValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useRhythmSession must be used inside SessionProvider');
  return session;
}
