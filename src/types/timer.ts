export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export type FinishAction = 'stop' | 'restart' | 'continue';

export interface TimerConfig {
  finishAction: FinishAction;
  title: string;
  showMessage: boolean;
}

export const PRESET_VALUES = [
  0.5, 2, 3, 5, 20, 60,
] as const;

export type PresetValue = (typeof PRESET_VALUES)[number];

export const DEFAULT_CONFIG: TimerConfig = {
  finishAction: 'stop',
  title: '',
  showMessage: true,
};
