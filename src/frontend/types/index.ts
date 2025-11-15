export type Role = 'PARTICIPANT' | 'ORGANIZER' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  totpSecret: string;
  totpConfirmed: boolean;
  role: Role;
  teams?: Team[];
  invitations?: TeamInvitation[];
  organizedHackathon?: Hackathon[];
  createdAt: string;
  updatedAt: string;
}

export interface Hackathon {
  id: number;
  title: string;
  description: string;
  rules: string;
  category: 'Classification' | 'Regression' | 'NLP' | 'Computer Vision' | 'Time Series' | 'Other';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  organizerId: number;
  teams?: Team[];
  teamMax: number;
  teamMin: number;
  prize: number;
  registrationOpen: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  organizer?: User;
  resources?: HackathonResource[];
}

export interface HackathonResource {
  id: number;
  hackathonId: number;
  title: string;
  url: string;
  hackathon?: Hackathon;
  createdAt: string;
  updatedAt: string;
}

export interface ProvidedFile {
  id: number;
  hackathonId: number;
  title: string;
  fileUrl: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: number;
  name: string;
  hackathonId: number;
  members?: User[];
  invitations?: TeamInvitation[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamInvitation {
  id: number;
  teamId: number;
  userId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  team?: Team;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  challengeCount: number;
}

export interface StatisticCard {
  label: string;
  value: string | number;
  icon?: string;
  trend?: number;
}

export type SurveyQuestionType = 'text' | 'textarea';

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  question: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
  };
}

export interface Survey {
  id: number;
  hackathonId: number;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: number;
  surveyId: number;
  applicationId: number;
  userId: number;
  answers: Record<string, string>;
  submittedAt: string;
}

// Temporary compatibility type alias
export type Challenge = Hackathon & {
  category?: 'Classification' | 'Regression' | 'NLP' | 'Computer Vision' | 'Time Series' | 'Other';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  participants?: number;
  daysRemaining?: number;
  imageUrl?: string;
  status?: 'active' | 'upcoming' | 'completed';
  organizerName?: string;
  organizerAvatar?: string;
}
