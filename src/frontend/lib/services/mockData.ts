import { Challenge, Category, StatisticCard, Survey } from '@/types';

export const getFeaturedChallenges = (): Challenge[] => {
  const now = new Date('2025-11-14');
  
  return [
    {
      id: 1,
      title: 'Customer Churn Prediction Challenge',
      description: 'Build a model to predict customer churn in the telecommunications industry. Use historical customer data to identify patterns and prevent customer loss.',
      rules: 'Maximum 5 submissions per day. Teams of 1-3 members allowed. External data sources not permitted.',
      category: 'Classification',
      difficulty: 'Intermediate',
      prize: 25000,
      organizerId: 1,
      teamMax: 3,
      teamMin: 1,
      registrationOpen: '2025-10-15',
      startDate: '2025-10-15',
      endDate: '2025-12-07',
      createdAt: '2025-10-01',
      updatedAt: '2025-10-01',
      participants: 1847,
      daysRemaining: Math.ceil((new Date('2025-12-07').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      imageUrl: '/images/challenge-1.jpg',
      status: 'active',
      organizerName: 'DataCorp Inc.',
      resources: [
        { id: 1, hackathonId: 1, title: 'train.csv', url: '/datasets/churn/train.csv', createdAt: '2025-09-01', updatedAt: '2025-09-01' },
        { id: 2, hackathonId: 1, title: 'test.csv', url: '/datasets/churn/test.csv', createdAt: '2025-09-01', updatedAt: '2025-09-01' },
        { id: 3, hackathonId: 1, title: 'sample_submission.csv', url: '/datasets/churn/sample_submission.csv', createdAt: '2025-09-01', updatedAt: '2025-09-01' },
        { id: 4, hackathonId: 1, title: 'data_description.txt', url: '/datasets/churn/data_description.txt', createdAt: '2025-09-01', updatedAt: '2025-09-01' },
      ],
    },
    {
      id: 2,
      title: 'Medical Image Segmentation',
      description: 'Develop advanced deep learning models for accurate tumor detection and segmentation in MRI scans. Help improve medical diagnosis accuracy.',
      rules: 'Maximum 5 submissions per day. Teams of 1-3 members allowed. External data sources not permitted.',
      category: 'Computer Vision',
      difficulty: 'Advanced',
      prize: 50000,
      organizerId: 2,
      teamMax: 3,
      teamMin: 1,
      registrationOpen: '2025-09-20',
      startDate: '2025-09-20',
      endDate: '2025-12-29',
      createdAt: '2025-09-01',
      updatedAt: '2025-09-01',
      participants: 2934,
      daysRemaining: Math.ceil((new Date('2025-12-29').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      imageUrl: '/images/challenge-2.jpg',
      status: 'active',
      organizerName: 'MediAI Foundation',
      resources: [
        { id: 5, hackathonId: 2, title: 'train_images.zip', url: '/datasets/xray/train_images.zip', createdAt: '2025-08-15', updatedAt: '2025-08-15' },
        { id: 6, hackathonId: 2, title: 'test_images.zip', url: '/datasets/xray/test_images.zip', createdAt: '2025-08-15', updatedAt: '2025-08-15' },
        { id: 7, hackathonId: 2, title: 'train_labels.csv', url: '/datasets/xray/train_labels.csv', createdAt: '2025-08-15', updatedAt: '2025-08-15' },
        { id: 8, hackathonId: 2, title: 'sample_submission.csv', url: '/datasets/xray/sample_submission.csv', createdAt: '2025-08-15', updatedAt: '2025-08-15' },
        { id: 9, hackathonId: 2, title: 'dataset_info.pdf', url: '/datasets/xray/dataset_info.pdf', createdAt: '2025-08-15', updatedAt: '2025-08-15' },
      ],
    },
    {
      id: 3,
      title: 'Stock Price Forecasting',
      description: 'Create predictive models for stock market trends using time series analysis. Leverage historical data to forecast future price movements.',
      rules: 'Maximum 5 submissions per day. Teams of 1-3 members allowed. External data sources not permitted.',
      category: 'Time Series',
      difficulty: 'Expert',
      prize: 40000,
      organizerId: 3,
      teamMax: 3,
      teamMin: 1,
      registrationOpen: '2025-10-01',
      startDate: '2025-10-01',
      endDate: '2025-11-26',
      createdAt: '2025-09-15',
      updatedAt: '2025-09-15',
      participants: 3156,
      daysRemaining: Math.ceil((new Date('2025-11-26').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      imageUrl: '/images/challenge-3.jpg',
      status: 'active',
      organizerName: 'FinanceAI Labs',
      resources: [
        { id: 10, hackathonId: 3, title: 'train.parquet', url: '/datasets/fraud/train.parquet', createdAt: '2025-07-10', updatedAt: '2025-07-10' },
        { id: 11, hackathonId: 3, title: 'test.parquet', url: '/datasets/fraud/test.parquet', createdAt: '2025-07-10', updatedAt: '2025-07-10' },
        { id: 12, hackathonId: 3, title: 'sample_submission.csv', url: '/datasets/fraud/sample_submission.csv', createdAt: '2025-07-10', updatedAt: '2025-07-10' },
      ],
    },
    {
      id: 4,
      title: 'Sentiment Analysis for Social Media',
      description: 'Analyze sentiment from millions of social media posts. Build NLP models to classify emotions and opinions at scale.',
      rules: 'Maximum 5 submissions per day. Teams of 1-3 members allowed. External data sources not permitted.',
      category: 'NLP',
      difficulty: 'Intermediate',
      prize: 15000,
      organizerId: 4,
      teamMax: 3,
      teamMin: 1,
      registrationOpen: '2025-10-10',
      startDate: '2025-10-10',
      endDate: '2025-12-18',
      createdAt: '2025-09-25',
      updatedAt: '2025-09-25',
      participants: 1523,
      daysRemaining: Math.ceil((new Date('2025-12-18').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      imageUrl: '/images/challenge-4.jpg',
      status: 'active',
      organizerName: 'SocialSense Analytics',
      resources: [
        { id: 13, hackathonId: 4, title: 'train.json', url: '/datasets/sentiment/train.json', createdAt: '2025-06-20', updatedAt: '2025-06-20' },
        { id: 14, hackathonId: 4, title: 'test.json', url: '/datasets/sentiment/test.json', createdAt: '2025-06-20', updatedAt: '2025-06-20' },
        { id: 15, hackathonId: 4, title: 'sample_submission.csv', url: '/datasets/sentiment/sample_submission.csv', createdAt: '2025-06-20', updatedAt: '2025-06-20' },
        { id: 16, hackathonId: 4, title: 'emoji_mapping.json', url: '/datasets/sentiment/emoji_mapping.json', createdAt: '2025-06-20', updatedAt: '2025-06-20' },
      ],
    },
    {
      id: 5,
      title: 'House Price Prediction',
      description: 'Perfect for beginners! Predict house prices using various features like location, size, and amenities. Great introduction to regression problems.',
      rules: 'Maximum 5 submissions per day. Teams of 1-3 members allowed. External data sources not permitted.',
      category: 'Regression',
      difficulty: 'Beginner',
      prize: 5000,
      organizerId: 5,
      teamMax: 3,
      teamMin: 1,
      registrationOpen: '2025-10-01',
      startDate: '2025-10-01',
      endDate: '2026-01-13',
      createdAt: '2025-09-20',
      updatedAt: '2025-09-20',
      participants: 4521,
      daysRemaining: Math.ceil((new Date('2026-01-13').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      imageUrl: '/images/challenge-5.jpg',
      status: 'active',
      organizerName: 'RealEstate Analytics',
      resources: [
        { id: 17, hackathonId: 5, title: 'train.csv', url: '/datasets/housing/train.csv', createdAt: '2025-09-20', updatedAt: '2025-09-20' },
        { id: 18, hackathonId: 5, title: 'test.csv', url: '/datasets/housing/test.csv', createdAt: '2025-09-20', updatedAt: '2025-09-20' },
        { id: 19, hackathonId: 5, title: 'sample_submission.csv', url: '/datasets/housing/sample_submission.csv', createdAt: '2025-09-20', updatedAt: '2025-09-20' },
      ],
    },
    {
      id: 6,
      title: 'Autonomous Vehicle Object Detection',
      description: 'Coming soon: Build state-of-the-art object detection models for autonomous vehicles. Detect pedestrians, vehicles, and obstacles in real-time.',
      rules: 'Maximum 5 submissions per day. Teams of 1-3 members allowed. External data sources not permitted.',
      category: 'Computer Vision',
      difficulty: 'Expert',
      prize: 100000,
      organizerId: 6,
      teamMax: 3,
      teamMin: 1,
      registrationOpen: '2025-12-01',
      startDate: '2025-12-01',
      endDate: '2026-03-01',
      createdAt: '2025-10-01',
      updatedAt: '2025-10-01',
      participants: 0,
      daysRemaining: Math.ceil((new Date('2026-03-01').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      imageUrl: '/images/challenge-6.jpg',
      status: 'upcoming',
      organizerName: 'AutoDrive Technologies',
      resources: [
        { id: 20, hackathonId: 6, title: 'train_video.zip', url: '/datasets/autonomous/train_video.zip', createdAt: '2025-10-01', updatedAt: '2025-10-01' },
        { id: 21, hackathonId: 6, title: 'test_video.zip', url: '/datasets/autonomous/test_video.zip', createdAt: '2025-10-01', updatedAt: '2025-10-01' },
        { id: 22, hackathonId: 6, title: 'annotations.json', url: '/datasets/autonomous/annotations.json', createdAt: '2025-10-01', updatedAt: '2025-10-01' },
        { id: 23, hackathonId: 6, title: 'sample_submission.csv', url: '/datasets/autonomous/sample_submission.csv', createdAt: '2025-10-01', updatedAt: '2025-10-01' },
        { id: 24, hackathonId: 6, title: 'model_weights.h5', url: '/datasets/autonomous/model_weights.h5', createdAt: '2025-10-01', updatedAt: '2025-10-01' },
      ],
    },
  ];
};

export const getCategories = (): Category[] => {
  return [
    {
      id: '1',
      name: 'Classification',
      description: 'Categorize data into predefined classes',
      icon: 'classification',
      challengeCount: 42,
    },
    {
      id: '2',
      name: 'Regression',
      description: 'Predict continuous numerical values',
      icon: 'regression',
      challengeCount: 38,
    },
    {
      id: '3',
      name: 'NLP',
      description: 'Process and understand human language',
      icon: 'nlp',
      challengeCount: 29,
    },
    {
      id: '4',
      name: 'Computer Vision',
      description: 'Analyze and interpret visual information',
      icon: 'vision',
      challengeCount: 51,
    },
    {
      id: '5',
      name: 'Time Series',
      description: 'Forecast trends from sequential data',
      icon: 'timeseries',
      challengeCount: 24,
    },
    {
      id: '6',
      name: 'Other',
      description: 'Diverse machine learning challenges',
      icon: 'other',
      challengeCount: 16,
    },
  ];
};

// Platform stats are now fetched from API via usePlatformStats hook
// This function has been removed - use usePlatformStats() instead

export const getActiveChallenges = (): Challenge[] => {
  return getFeaturedChallenges().filter(c => c.status === 'active');
};

export const getUpcomingChallenges = (): Challenge[] => {
  return getFeaturedChallenges().filter(c => c.status === 'upcoming');
};

// Mock API for Surveys
export const getSurveyByHackathonId = (hackathonId: number) => {
  const surveys: Record<number, Survey> = {
    1: {
      id: 1,
      hackathonId: 1,
      title: 'Ankieta rejestracyjna - Customer Churn Prediction',
      description: 'Wypełnij poniższą ankietę, aby dokończyć proces rejestracji',
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: 'Jakie jest Twoje doświadczenie w machine learning?',
          description: 'np. Początkujący, Średnio zaawansowany, Zaawansowany, Expert',
          required: true,
          placeholder: 'Opisz swoje doświadczenie...',
        },
        {
          id: 'q2',
          type: 'textarea',
          question: 'Dlaczego chcesz wziąć udział w tym wyzwaniu?',
          description: 'Opisz swoją motywację i cele',
          required: true,
          placeholder: 'Opisz swoją motywację...',
          validation: { minLength: 50, maxLength: 500 },
        },
        {
          id: 'q3',
          type: 'textarea',
          question: 'Które technologie i narzędzia znasz?',
          description: 'Wymień technologie, które potrafisz używać',
          required: true,
          placeholder: 'np. Python, TensorFlow, PyTorch, scikit-learn...',
          validation: { minLength: 20 },
        },
        {
          id: 'q4',
          type: 'text',
          question: 'Ile godzin tygodniowo możesz poświęcić na wyzwanie?',
          required: true,
          placeholder: 'np. 10-15 godzin',
        },
        {
          id: 'q5',
          type: 'text',
          question: 'Link do Twojego profilu GitHub (opcjonalnie)',
          required: false,
          placeholder: 'https://github.com/username',
        },
        {
          id: 'q6',
          type: 'textarea',
          question: 'Opisz swoje doświadczenie z problemami klasyfikacji',
          required: true,
          placeholder: 'Opisz projekty, kursy, konkursy...',
          validation: { minLength: 30 },
        },
      ],
      createdAt: '2025-10-01',
      updatedAt: '2025-10-01',
    },
    2: {
      id: 2,
      hackathonId: 2,
      title: 'Ankieta rejestracyjna - Medical Image Segmentation',
      description: 'Wypełnij poniższą ankietę, aby dokończyć proces rejestracji',
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: 'Jakie jest Twoje doświadczenie w computer vision?',
          description: 'np. Początkujący, Średnio zaawansowany, Zaawansowany, Expert',
          required: true,
          placeholder: 'Opisz swoje doświadczenie...',
        },
        {
          id: 'q2',
          type: 'text',
          question: 'Czy masz doświadczenie w medycznym przetwarzaniu obrazów?',
          required: true,
          placeholder: 'np. Tak - 2 lata w szpitalu, Nie - dopiero zaczynam...',
        },
        {
          id: 'q3',
          type: 'textarea',
          question: 'Które frameworki do deep learning znasz?',
          required: true,
          placeholder: 'Wymień frameworki, które znasz...',
          validation: { minLength: 10 },
        },
        {
          id: 'q4',
          type: 'textarea',
          question: 'Opisz swoje doświadczenie z segmentacją obrazów',
          required: true,
          placeholder: 'Projekty, publikacje, konkursy...',
          validation: { minLength: 50 },
        },
        {
          id: 'q5',
          type: 'text',
          question: 'Ile godzin tygodniowo możesz poświęcić?',
          required: true,
          placeholder: 'np. 15-20 godzin',
        },
      ],
      createdAt: '2025-09-01',
      updatedAt: '2025-09-01',
    },
  };

  return surveys[hackathonId] || {
    id: hackathonId,
    hackathonId: hackathonId,
    title: 'Ankieta rejestracyjna',
    description: 'Wypełnij poniższą ankietę, aby dokończyć proces rejestracji',
    questions: [
      {
        id: 'q1',
        type: 'text',
        question: 'Jakie jest Twoje doświadczenie w data science?',
        description: 'np. Początkujący, Średnio zaawansowany, Zaawansowany, Expert',
        required: true,
        placeholder: 'Opisz swoje doświadczenie...',
      },
      {
        id: 'q2',
        type: 'textarea',
        question: 'Dlaczego chcesz wziąć udział w tym wyzwaniu?',
        required: true,
        placeholder: 'Opisz swoją motywację...',
        validation: { minLength: 30 },
      },
      {
        id: 'q3',
        type: 'text',
        question: 'Ile godzin tygodniowo możesz poświęcić?',
        required: true,
        placeholder: 'np. 10-15 godzin',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const submitSurveyResponse = (
  surveyId: number,
  applicationId: number,
  answers: Record<string, string>
) => {
  // Mock API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = {
        id: Date.now(),
        surveyId,
        applicationId,
        userId: 1,
        answers,
        submittedAt: new Date().toISOString(),
      };
      resolve(response);
    }, 1000);
  });
};
