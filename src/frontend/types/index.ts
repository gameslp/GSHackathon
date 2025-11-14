export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'Classification' | 'Regression' | 'NLP' | 'Computer Vision' | 'Time Series' | 'Other';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  prize: number;
  participants: number;
  daysRemaining: number;
  imageUrl: string;
  status: 'active' | 'upcoming' | 'completed';
  startDate: string;
  endDate: string;
  organizerName: string;
  organizerAvatar?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  rank?: number;
  points: number;
  completedChallenges: number;
  joinedDate: string;
}

export interface Leaderboard {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  submissionCount: number;
  lastSubmission: string;
}

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  score: number;
  submittedAt: string;
  status: 'pending' | 'scored' | 'error';
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
