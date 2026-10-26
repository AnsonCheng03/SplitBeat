export type HomeActivity = 'practice' | 'focus' | 'score' | 'learn';

export interface HomeActivityOption {
  id: HomeActivity;
  title: string;
  description: string;
  testID: string;
}
