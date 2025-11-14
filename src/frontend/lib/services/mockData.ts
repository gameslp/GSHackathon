import { Challenge, Category, StatisticCard } from '@/types';

export const getFeaturedChallenges = (): Challenge[] => {
  return [
    {
      id: '1',
      title: 'Customer Churn Prediction Challenge',
      description: 'Build a model to predict customer churn in the telecommunications industry. Use historical customer data to identify patterns and prevent customer loss.',
      category: 'Classification',
      difficulty: 'Intermediate',
      prize: 25000,
      participants: 1847,
      daysRemaining: 23,
      imageUrl: '/images/challenge-1.jpg',
      status: 'active',
      startDate: '2025-10-15',
      endDate: '2025-12-07',
      organizerName: 'DataCorp Analytics',
    },
    {
      id: '2',
      title: 'Medical Image Segmentation',
      description: 'Develop advanced deep learning models for accurate tumor detection and segmentation in MRI scans. Help improve medical diagnosis accuracy.',
      category: 'Computer Vision',
      difficulty: 'Advanced',
      prize: 50000,
      participants: 2934,
      daysRemaining: 45,
      imageUrl: '/images/challenge-2.jpg',
      status: 'active',
      startDate: '2025-09-20',
      endDate: '2025-12-29',
      organizerName: 'MediTech Research',
    },
    {
      id: '3',
      title: 'Stock Price Forecasting',
      description: 'Create predictive models for stock market trends using time series analysis. Leverage historical data to forecast future price movements.',
      category: 'Time Series',
      difficulty: 'Expert',
      prize: 40000,
      participants: 3156,
      daysRemaining: 12,
      imageUrl: '/images/challenge-3.jpg',
      status: 'active',
      startDate: '2025-10-01',
      endDate: '2025-11-26',
      organizerName: 'FinanceAI Labs',
    },
    {
      id: '4',
      title: 'Sentiment Analysis for Social Media',
      description: 'Analyze sentiment from millions of social media posts. Build NLP models to classify emotions and opinions at scale.',
      category: 'NLP',
      difficulty: 'Intermediate',
      prize: 15000,
      participants: 1523,
      daysRemaining: 34,
      imageUrl: '/images/challenge-4.jpg',
      status: 'active',
      startDate: '2025-10-10',
      endDate: '2025-12-18',
      organizerName: 'SocialMetrics Inc',
    },
    {
      id: '5',
      title: 'House Price Prediction',
      description: 'Perfect for beginners! Predict house prices using various features like location, size, and amenities. Great introduction to regression problems.',
      category: 'Regression',
      difficulty: 'Beginner',
      prize: 5000,
      participants: 4521,
      daysRemaining: 60,
      imageUrl: '/images/challenge-5.jpg',
      status: 'active',
      startDate: '2025-10-01',
      endDate: '2026-01-13',
      organizerName: 'RealEstate Analytics',
    },
    {
      id: '6',
      title: 'Autonomous Vehicle Object Detection',
      description: 'Coming soon: Build state-of-the-art object detection models for autonomous vehicles. Detect pedestrians, vehicles, and obstacles in real-time.',
      category: 'Computer Vision',
      difficulty: 'Expert',
      prize: 100000,
      participants: 0,
      daysRemaining: 90,
      imageUrl: '/images/challenge-6.jpg',
      status: 'upcoming',
      startDate: '2025-12-01',
      endDate: '2026-03-01',
      organizerName: 'AutoDrive Technologies',
    },
  ];
};

export const getCategories = (): Category[] => {
  return [
    {
      id: '1',
      name: 'Classification',
      description: 'Categorize data into predefined classes',
      icon: '🎯',
      challengeCount: 42,
    },
    {
      id: '2',
      name: 'Regression',
      description: 'Predict continuous numerical values',
      icon: '📈',
      challengeCount: 38,
    },
    {
      id: '3',
      name: 'NLP',
      description: 'Process and understand human language',
      icon: '💬',
      challengeCount: 29,
    },
    {
      id: '4',
      name: 'Computer Vision',
      description: 'Analyze and interpret visual information',
      icon: '👁️',
      challengeCount: 51,
    },
    {
      id: '5',
      name: 'Time Series',
      description: 'Forecast trends from sequential data',
      icon: '⏱️',
      challengeCount: 24,
    },
    {
      id: '6',
      name: 'Other',
      description: 'Diverse machine learning challenges',
      icon: '🔬',
      challengeCount: 16,
    },
  ];
};

export const getPlatformStats = (): StatisticCard[] => {
  return [
    {
      label: 'Active Challenges',
      value: 127,
      icon: '🏆',
      trend: 12,
    },
    {
      label: 'Data Scientists',
      value: '45.8K',
      icon: '👥',
      trend: 8,
    },
    {
      label: 'Total Prize Pool',
      value: '$2.4M',
      icon: '💰',
      trend: 15,
    },
    {
      label: 'Submissions Today',
      value: '3.2K',
      icon: '📊',
      trend: 5,
    },
  ];
};

export const getActiveChallenges = (): Challenge[] => {
  return getFeaturedChallenges().filter(c => c.status === 'active');
};

export const getUpcomingChallenges = (): Challenge[] => {
  return getFeaturedChallenges().filter(c => c.status === 'upcoming');
};
