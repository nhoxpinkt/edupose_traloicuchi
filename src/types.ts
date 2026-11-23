export type OptionKey = 'A' | 'B' | 'C' | 'D';

export type GestureType = 'left_hand_up' | 'right_hand_up' | 'arms_spread' | 'both_hands_up' | 'none';

export interface QuestionOption {
  text: string;
  image?: string;
}

export interface Question {
  id: string;
  text: string;
  image?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  optionImages?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  correctAnswer: OptionKey;
  points: number;
  timeLimit: number; // in seconds
  explanation?: string;
}

export interface CustomImages {
  bg?: string;
  logo?: string;
  left_hand_up?: string;
  right_hand_up?: string;
  arms_spread?: string;
  both_hands_up?: string;
  celebration?: string;
}

export interface GameSettings {
  defaultTimeLimit: number;
  defaultPoints: number;
  allowIndividualPoints: boolean;
  onWrongAnswer: 'next' | 'retry';
  soundEnabled: boolean;
  celebrationEnabled: boolean;
  holdDuration: number; // in seconds, default 0.8
  cameraMirrored: boolean;
  gestureMapping: {
    A: GestureType;
    B: GestureType;
    C: GestureType;
    D: GestureType;
  };
  customImages: CustomImages;
}

export interface DetectionResult {
  hasPerson: boolean;
  detectedGesture: GestureType;
  confidence: number;
  rawLandmarks?: any;
}

export interface QuizSet {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string; // 'blue' | 'emerald' | 'purple' | 'amber'
  questions: Question[];
  createdAt: string;
}

export type AppScreen = 'home' | 'game' | 'settings';
