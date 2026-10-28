import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { readTutorialCompletion, saveTutorialCompletion } from '@/features/tutorial/tutorialStorage';

interface AppTutorialContextValue {
  tutorialLoaded: boolean;
  tutorialCompleted: boolean;
  tutorialVisible: boolean;
  showTutorialForFirstLaunch: () => void;
  replayTutorial: () => void;
  completeTutorial: () => void;
}

const AppTutorialContext = createContext<AppTutorialContextValue | null>(null);

export function AppTutorialProvider({ children }: PropsWithChildren) {
  const [tutorialLoaded, setTutorialLoaded] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const firstLaunchAttemptedRef = useRef(false);
  const completionUpdatedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void readTutorialCompletion()
      .then((completed) => {
        if (active && !completionUpdatedRef.current) setTutorialCompleted(completed);
      })
      .finally(() => {
        if (active) setTutorialLoaded(true);
      });

    return () => { active = false; };
  }, []);

  const showTutorialForFirstLaunch = useCallback(() => {
    if (!tutorialLoaded || tutorialCompleted || firstLaunchAttemptedRef.current) return;
    firstLaunchAttemptedRef.current = true;
    setTutorialVisible(true);
  }, [tutorialCompleted, tutorialLoaded]);

  const replayTutorial = useCallback(() => {
    firstLaunchAttemptedRef.current = true;
    setTutorialVisible(true);
  }, []);

  const completeTutorial = useCallback(() => {
    firstLaunchAttemptedRef.current = true;
    completionUpdatedRef.current = true;
    setTutorialVisible(false);
    setTutorialCompleted(true);
    void saveTutorialCompletion();
  }, []);

  const value = useMemo(() => ({
    tutorialLoaded,
    tutorialCompleted,
    tutorialVisible,
    showTutorialForFirstLaunch,
    replayTutorial,
    completeTutorial,
  }), [tutorialLoaded, tutorialCompleted, tutorialVisible, showTutorialForFirstLaunch, replayTutorial, completeTutorial]);

  return <AppTutorialContext.Provider value={value}>{children}</AppTutorialContext.Provider>;
}

export function useAppTutorial(): AppTutorialContextValue {
  const context = useContext(AppTutorialContext);
  if (!context) throw new Error('useAppTutorial must be used inside AppTutorialProvider');
  return context;
}
