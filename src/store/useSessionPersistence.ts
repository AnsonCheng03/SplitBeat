import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  parseCombinationProgress,
  parseSavedPracticePairs,
  recordCombinationProgress,
  removeSavedPracticePair as removeSavedPracticePairRecord,
  savePracticePairsForLater as addPracticePairsForLater,
  type CombinationProgress,
  type SavedPracticePair,
} from '@/rhythm/targetedPractice';
import { appendSessionRecord, createSessionRecord, parseSessionHistory, type SessionRecord } from '@/store/sessionHistory';
import type { RhythmPatternPair, SessionResults, TimeSignature } from '@/types/rhythm';

const SESSION_HISTORY_KEY = 'split-beat.session-history.v1';
const COMBINATION_PROGRESS_KEY = 'split-beat.combination-progress.v1';
const SAVED_PRACTICE_PAIRS_KEY = 'split-beat.saved-practice-pairs.v1';

export function useSessionHistory(enabled: boolean) {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(SESSION_HISTORY_KEY)
      .then((raw) => {
        if (active) setRecords(parseSessionHistory(raw));
      })
      .catch(() => {
        if (active) setRecords([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const recordSession = useCallback((sessionId: string, results: SessionResults) => {
    if (!enabled) return;
    const record = createSessionRecord(sessionId, Date.now(), results);
    setRecords((current) => {
      const next = appendSessionRecord(current, record);
      void AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, [enabled]);

  return { records, loaded, recordSession };
}

export function useCombinationProgress(enabled: boolean) {
  const [progress, setProgress] = useState<CombinationProgress[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(COMBINATION_PROGRESS_KEY)
      .then((raw) => {
        if (active) setProgress(parseCombinationProgress(raw));
      })
      .catch(() => {
        if (active) setProgress([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const recordSessionResults = useCallback((results: SessionResults) => {
    if (!enabled || results.trainingMode !== 'two-hand') return;
    setProgress((current) => {
      const next = recordCombinationProgress(
        current,
        results.combinations,
        results.timeSignature,
        Date.now(),
      );
      if (next !== current) {
        void AsyncStorage.setItem(COMBINATION_PROGRESS_KEY, JSON.stringify(next)).catch(() => undefined);
      }
      return next;
    });
  }, [enabled]);

  return { progress, loaded, recordSessionResults };
}

export function useSavedPracticePairs() {
  const [pairs, setPairs] = useState<SavedPracticePair[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(SAVED_PRACTICE_PAIRS_KEY)
      .then((raw) => {
        if (active) setPairs(parseSavedPracticePairs(raw));
      })
      .catch(() => {
        if (active) setPairs([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const savePairsForLater = useCallback((patterns: readonly RhythmPatternPair[], timeSignature: TimeSignature) => {
    setPairs((current) => {
      const next = addPracticePairsForLater(current, patterns, timeSignature, Date.now());
      void AsyncStorage.setItem(SAVED_PRACTICE_PAIRS_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const removeSavedPracticePair = useCallback((id: string) => {
    setPairs((current) => {
      const next = removeSavedPracticePairRecord(current, id);
      void AsyncStorage.setItem(SAVED_PRACTICE_PAIRS_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  return { pairs, loaded, savePairsForLater, removeSavedPracticePair };
}
