import AsyncStorage from '@react-native-async-storage/async-storage';
import { RHYTHM_MISSIONS } from '@/rhythm/rhythmMissions';

const RHYTHM_MISSION_PROGRESS_KEY = '@splitbeat/rhythm-mission-progress-v1';
const VALID_MISSION_IDS = new Set(RHYTHM_MISSIONS.map((mission) => mission.id));

export async function readCompletedRhythmMissionIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RHYTHM_MISSION_PROGRESS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is string => typeof id === 'string' && VALID_MISSION_IDS.has(id)))];
  } catch {
    return [];
  }
}

export async function completeRhythmMission(missionId: string): Promise<string[]> {
  if (!VALID_MISSION_IDS.has(missionId)) throw new Error('Unknown rhythm mission.');
  const completedIds = await readCompletedRhythmMissionIds();
  if (!completedIds.includes(missionId)) completedIds.push(missionId);
  await AsyncStorage.setItem(RHYTHM_MISSION_PROGRESS_KEY, JSON.stringify(completedIds));
  return completedIds;
}
