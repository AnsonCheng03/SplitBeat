export type HomeActivity = 'practice' | 'focus' | 'score' | 'learn' | 'missions';

export interface HomeActivityOption {
  id: HomeActivity;
  title: string;
  description: string;
  testID: string;
}
