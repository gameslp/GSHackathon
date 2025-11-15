import { PrismaClient, Role, HackathonType } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.submissionFile.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.providedFile.deleteMany();
  await prisma.hackathonResource.deleteMany();
  await prisma.hackathonJudge.deleteMany();
  await prisma.surveyResponse.deleteMany();
  await prisma.team.deleteMany();
  await prisma.surveyQuestion.deleteMany();
  await prisma.submissionFileFormat.deleteMany();
  await prisma.hackathon.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      totpSecret: 'ADMINSECRET',
      totpConfirmed: true,
      role: Role.ADMIN,
      email: 'admin@hackathon.local',
      name: 'Alicia',
      surname: 'Admin',
    },
  });

  const judge = await prisma.user.create({
    data: {
      username: 'judge',
      totpSecret: 'JUDGESECRET',
      totpConfirmed: true,
      role: Role.JUDGE,
      email: 'judge@hackathon.local',
      name: 'Jordan',
      surname: 'Justice',
    },
  });

  const participants = await prisma.$transaction(
    ['sarah', 'miguel', 'nora', 'liam'].map((username, index) =>
      prisma.user.create({
        data: {
          username,
          totpSecret: `USERSECRET${index}`,
          totpConfirmed: true,
          role: Role.PARTICIPANT,
          email: `${username}@hackathon.local`,
          name: username.charAt(0).toUpperCase() + username.slice(1),
          surname: 'Participant',
        },
      })
    )
  );

  return { admin, judge, participants };
}

async function seedHackathons(organizerId: number) {
  const now = new Date();
  const oneMonth = 1000 * 60 * 60 * 24 * 30;

  const hackathon1 = await prisma.hackathon.create({
    data: {
      title: 'Vision Quest Challenge',
      description:
        'Build a computer vision model capable of detecting wildlife on low-resolution drone footage. Focus on robustness and speed.',
      rules:
        '1. Teams must respect the privacy guidelines.\n2. Submit at most 5 times.\n3. Every model must include a short summary of techniques used.',
      organizerId,
      type: HackathonType.COMPUTER_VISION,
      prize: 15000,
      teamMin: 2,
      teamMax: 5,
      thumbnailUrl: 'thumbnails/vision-quest.jpg',
      registrationOpen: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
      registrationClose: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      startDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10),
      endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 20),
      submissionLimit: 5,
      submissionTimeout: 120,
      threadLimit: 8,
      ramLimit: 32,
      autoScoringEnabled: true,
      resources: {
        create: [
          {
            title: 'Dataset Overview',
            url: '/uploads/resources/vision-overview.pdf',
          },
          {
            title: 'Annotation Guidelines',
            url: '/uploads/resources/annotation-guide.pdf',
          },
        ],
      },
      surveyQuestions: {
        create: [
          { question: 'What is your experience with computer vision?', order: 1 },
          { question: 'Link to previous work (if any).', order: 2 },
        ],
      },
      submissionFileFormats: {
        create: [
          {
            name: 'Model weights',
            description: 'Compressed archive with your trained model weights.',
            extension: '.zip',
            maxSizeKB: 20_000,
            obligatory: true,
          },
          {
            name: 'Report',
            description: 'Short description of your methodology.',
            extension: '.pdf',
            maxSizeKB: 5_000,
          },
        ],
      },
    },
    include: {
      surveyQuestions: true,
      submissionFileFormats: true,
    },
  });

  const hackathon2 = await prisma.hackathon.create({
    data: {
      title: 'Smart City Forecasting',
      description:
        'Predict daily energy consumption for a smart city hub. Bring together time-series forecasting and anomaly detection.',
      rules:
        '1. Teams of up to 4 members.\n2. Submissions must include code for reproducibility.\n3. Judges may request a live demo.',
      organizerId,
      type: HackathonType.TIME_SERIES,
      prize: 10000,
      teamMin: 1,
      teamMax: 4,
      thumbnailUrl: 'thumbnails/smart-city.jpg',
      registrationOpen: new Date(now.getTime() - oneMonth),
      registrationClose: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
      endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),
      submissionLimit: 3,
      submissionTimeout: 90,
      threadLimit: 4,
      ramLimit: 16,
      resources: {
        create: [
          {
            title: 'Baseline notebook',
            url: '/uploads/resources/forecast-baseline.ipynb',
          },
        ],
      },
      surveyQuestions: {
        create: [
          { question: 'How do you plan to approach forecasting?', order: 1 },
        ],
      },
      submissionFileFormats: {
        create: [
          {
            name: 'Predictions CSV',
            description: 'CSV file with the requested forecast horizon.',
            extension: '.csv',
            maxSizeKB: 2_000,
            obligatory: true,
          },
        ],
      },
    },
    include: {
      surveyQuestions: true,
      submissionFileFormats: true,
    },
  });

  return { hackathon1, hackathon2 };
}

async function seedTeamsAndSubmissions(params: {
  hackathon1: Awaited<ReturnType<typeof seedHackathons>>['hackathon1'];
  hackathon2: Awaited<ReturnType<typeof seedHackathons>>['hackathon2'];
  participants: Awaited<ReturnType<typeof seedUsers>>['participants'];
  judgeId: number;
}) {
  const { hackathon1, hackathon2, participants, judgeId } = params;

  await prisma.hackathonJudge.createMany({
    data: [
      { hackathonId: hackathon1.id, judgeId },
      { hackathonId: hackathon2.id, judgeId },
    ],
  });

  const [sarah, miguel, nora, liam] = participants;

  const visionTeam = await prisma.team.create({
    data: {
      name: 'Visionary AI',
      invitationCode: '482193',
      captainId: sarah.id,
      hackathonId: hackathon1.id,
      isAccepted: true,
      members: {
        connect: [{ id: sarah.id }, { id: miguel.id }],
      },
      surveyResponses: {
        create: hackathon1.surveyQuestions.map((question) => ({
          questionId: question.id,
          userId: sarah.id,
          answer:
            question.order === 1
              ? '3 years building CV systems for drones.'
              : 'https://github.com/sarah-vision',
        })),
      },
    },
  });

  const smartCityTeam = await prisma.team.create({
    data: {
      name: 'Forecast Fanatics',
      invitationCode: '771204',
      captainId: nora.id,
      hackathonId: hackathon2.id,
      isAccepted: true,
      members: {
        connect: [{ id: nora.id }, { id: liam.id }],
      },
      surveyResponses: {
        create: hackathon2.surveyQuestions.map((question) => ({
          questionId: question.id,
          userId: nora.id,
          answer: 'Hybrid LSTM + transformer model with anomaly detection.',
        })),
      },
    },
  });

  await prisma.providedFile.createMany({
    data: [
      {
        hackathonId: hackathon1.id,
        title: 'Drone footage sample',
        name: 'footage-demo.mp4',
        fileUrl: '/uploads/provided/vision-sample.mp4',
        public: true,
      },
      {
        hackathonId: hackathon1.id,
        title: 'Private evaluation dataset',
        name: 'evaluation.zip',
        fileUrl: '/uploads/provided/vision-eval.zip',
        public: false,
      },
      {
        hackathonId: hackathon2.id,
        title: 'Energy readings (private)',
        name: 'smart-city-private.csv',
        fileUrl: '/uploads/provided/smart-city-private.csv',
        public: false,
      },
    ],
  });

  const weightsFormat = hackathon1.submissionFileFormats.find(
    (format) => format.name === 'Model weights'
  );
  const reportFormat = hackathon1.submissionFileFormats.find(
    (format) => format.name === 'Report'
  );
  const forecastFormat = hackathon2.submissionFileFormats[0];

  if (!weightsFormat || !forecastFormat) {
    throw new Error('Submission formats missing in seed data.');
  }

  await prisma.submission.create({
    data: {
      hackathonId: hackathon1.id,
      teamId: visionTeam.id,
      sendAt: new Date(),
      score: 92.5,
      scoreManual: true,
      scoreComment: 'Excellent precision on small objects.',
      files: {
        create: [
          {
            fileFormatId: weightsFormat.id,
            fileUrl: '/uploads/submissions/visionary-ai-model.zip',
          },
          ...(reportFormat
            ? [
                {
                  fileFormatId: reportFormat.id,
                  fileUrl: '/uploads/submissions/visionary-ai-report.pdf',
                },
              ]
            : []),
        ],
      },
    },
  });

  await prisma.submission.create({
    data: {
      hackathonId: hackathon2.id,
      teamId: smartCityTeam.id,
      sendAt: new Date(),
      score: 88.1,
      files: {
        create: [
          {
            fileFormatId: forecastFormat.id,
            fileUrl: '/uploads/submissions/forecast-fanatics.csv',
          },
        ],
      },
    },
  });
}

async function main() {
  console.log('Resetting database…');
  await resetDatabase();

  console.log('Seeding users…');
  const { admin, judge, participants } = await seedUsers();

  console.log('Seeding hackathons…');
  const hackathons = await seedHackathons(admin.id);

  console.log('Seeding teams, judges, submissions…');
  await seedTeamsAndSubmissions({
    hackathon1: hackathons.hackathon1,
    hackathon2: hackathons.hackathon2,
    participants,
    judgeId: judge.id,
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
