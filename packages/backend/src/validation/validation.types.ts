import { Effect } from '../session/session.types';

export interface ValidationResult {
  accepted: ValidatedEffect[];
  rejected: RejectedEffect[];
}

export interface ValidatedEffect {
  effect: Effect;
  clamped?: boolean;   // true if the delta was clamped to a boundary
  oldValue: number;
  newValue: number;
}

export interface RejectedEffect {
  effect: Effect;
  reason: string;
}