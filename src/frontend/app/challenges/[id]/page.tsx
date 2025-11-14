'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import DatasetDownloadModal from '@/lib/components/DatasetDownloadModal';
import { useHackathon } from '@/lib/hooks/useHackathons';
import { useHackathonSurvey, useMyTeam, useCreateTeam, useJoinTeam } from '@/lib/hooks/useTeams';
import { useAuth } from '@/lib/hooks/useAuth';
import type { HackathonResource } from '@/types';

interface PageProps {
  params: { id: string };
}

type SurveyQuestionDto = {
  id?: number;
  question?: string;
  order?: number;
};

type SurveyAnswerPayload = {
  questionId: number;
  answer: string;
};

type SurveyFormCallbacks = {
  onSuccess: () => void;
  onError: (message: string) => void;
};

const toDate = (value?: string) => (value ? new Date(value) : null);

const formatDate = (value?: string) => {
  if (!value) return 'TBA';
  return new Date(value).toLocaleString();
};

const buildSurveyKey = (questions: SurveyQuestionDto[]) =>
  questions.map((question) => String(question.id ?? question.order ?? '')).join('-');

const createResponseState = (questions: SurveyQuestionDto[]) =>
  questions.reduce<Record<number, string>>((acc, question) => {
    if (typeof question.id === 'number') {
      acc[question.id] = '';
    }
    return acc;
  }, {});

export default function ChallengePage({ params }: PageProps) {
  const hackathonId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const { data: hackathon, isLoading, error } = useHackathon(hackathonId);
  const { data: surveyData, isLoading: surveyLoading } = useHackathonSurvey(hackathonId);
  const surveyQuestions = useMemo(() => surveyData?.questions ?? [], [surveyData]);
  const surveyKey = useMemo(() => buildSurveyKey(surveyQuestions), [surveyQuestions]);

  const {
    data: myTeam,
    isLoading: myTeamLoading,
    error: myTeamError,
  } = useMyTeam(hackathonId, { enabled: Boolean(user) });

  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();

  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  const registrationWindow = useMemo(() => {
    if (!hackathon) {
      return { status: 'closed' as const, label: 'Registration closed' };
    }
    const registrationOpen = toDate(hackathon.registrationOpen);
    const startDate = toDate(hackathon.startDate);
    const current = new Date();

    if (registrationOpen && current < registrationOpen) {
      return { status: 'upcoming' as const, label: `Opens on ${registrationOpen.toLocaleString()}` };
    }
    if (startDate && current > startDate) {
      return { status: 'closed' as const, label: 'Registration ended' };
    }
    return { status: 'open' as const, label: 'Registration open' };
  }, [hackathon]);

  const statusBadge = useMemo(() => {
    if (!hackathon) return { label: 'Loading', className: 'bg-gray-100 text-gray-700' };
    const startDate = toDate(hackathon.startDate);
    const endDate = toDate(hackathon.endDate);
    const current = new Date();

    let label = 'Active';
    let className = 'bg-green-100 text-green-800';

    if (startDate && startDate > current) {
      label = 'Upcoming';
      className = 'bg-yellow-100 text-yellow-800';
    } else if (endDate && endDate < current) {
      label = 'Completed';
      className = 'bg-gray-200 text-gray-700';
    }

    return { label, className };
  }, [hackathon]);

  const requireAuth = () => {
    router.push('/login');
  };

  const handleCreateTeamSubmit = (
    teamName: string,
    responses: SurveyAnswerPayload[],
    callbacks: SurveyFormCallbacks
  ) => {
    createTeam.mutate(
      {
        body: {
          hackathonId,
          teamName,
          surveyResponses: responses,
        },
      },
      {
        onSuccess: () => {
          setGlobalMessage('Team created! Share the invitation code below.');
          callbacks.onSuccess();
        },
        onError: (mutationError) => {
          const message = mutationError instanceof Error ? mutationError.message : 'Failed to create team';
          callbacks.onError(message);
        },
      }
    );
  };

  const handleJoinTeamSubmit = (
    invitationCode: string,
    responses: SurveyAnswerPayload[],
    callbacks: SurveyFormCallbacks
  ) => {
    joinTeam.mutate(
      {
        body: {
          invitationCode,
          surveyResponses: responses,
        },
      },
      {
        onSuccess: () => {
          setGlobalMessage('Successfully joined your team!');
          callbacks.onSuccess();
        },
        onError: (mutationError) => {
          const message = mutationError instanceof Error ? mutationError.message : 'Failed to join team';
          callbacks.onError(message);
        },
      }
    );
  };

  const datasetResources: HackathonResource[] = useMemo(() => {
    if (!hackathon?.resources) return [];
    return (hackathon.resources as HackathonResource[]).map((resource) => ({
      ...resource,
      hackathonId: resource.hackathonId ?? hackathon.id!,
    }));
  }, [hackathon]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Loading hackathon...
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-lg p-12 text-center text-red-600">
            {(error as Error).message}
          </div>
        ) : !hackathon ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Hackathon not found.
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                      {hackathon.type?.replace('_', ' ') || 'Category'}
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold text-black">{hackathon.title}</h1>
                  <p className="text-gray-600 mt-3">{hackathon.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Prize pool</p>
                  <p className="text-3xl font-bold text-black">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }).format(hackathon.prize ?? 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Registration window</p>
                  <p className="text-gray-800 font-medium">{registrationWindow.label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Opens: {formatDate(hackathon.registrationOpen)} <br />
                    Starts: {formatDate(hackathon.startDate)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Team size</p>
                  <p className="text-gray-800 font-medium">
                    {hackathon.teamMin} - {hackathon.teamMax} members
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {hackathon.teams?.length ?? 0} teams registered
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Resources</p>
                  <p className="text-gray-800 font-medium">
                    {datasetResources.length} dataset file{datasetResources.length === 1 ? '' : 's'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowDatasetModal(true)}
                    disabled={datasetResources.length === 0}
                  >
                    Download resources
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-black mb-4">Team management</h2>
                {globalMessage && (
                  <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                    {globalMessage}
                  </div>
                )}
                {!user ? (
                  <div className="text-gray-600">
                    <p className="mb-4">Sign in to create or join a team for this hackathon.</p>
                    <Button variant="primary" onClick={requireAuth}>
                      Sign In
                    </Button>
                  </div>
                ) : myTeamLoading ? (
                  <p className="text-gray-600">Checking your team...</p>
                ) : myTeamError ? (
                  <p className="text-red-600">{(myTeamError as Error).message}</p>
                ) : myTeam ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">Invitation code</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-mono text-2xl text-blue-900">{myTeam.invitationCode}</span>
                        <button
                          className="text-xs text-blue-700 underline"
                          onClick={() => {
                            if (myTeam.invitationCode) {
                              void navigator.clipboard.writeText(myTeam.invitationCode);
                            }
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-black mb-2">Members</h3>
                      <div className="space-y-2">
                        {myTeam.members?.map((member) => (
                          <div
                            key={member.id}
                            className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-black">{member.username}</p>
                              <p className="text-sm text-gray-500">
                                {member.name ? `${member.name} ${member.surname ?? ''}` : 'Profile incomplete'}
                              </p>
                            </div>
                            {member.id === myTeam.captainId && (
                              <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                                Captain
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    You are not part of a team yet. Use the forms to create a new team or join with an invitation code.
                  </p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-8">
                {!user && (
                  <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-4">
                    Sign in to access the registration forms.
                  </div>
                )}
                {user && !myTeam && (
                  <>
                    <CreateTeamForm
                      key={`create-${surveyKey}`}
                      surveyQuestions={surveyQuestions}
                      surveyLoading={surveyLoading}
                      isRegistrationOpen={registrationWindow.status === 'open'}
                      isSubmitting={createTeam.isPending}
                      onSubmit={handleCreateTeamSubmit}
                    />
                    <div className="border-t border-gray-200 pt-6">
                      <JoinTeamForm
                        key={`join-${surveyKey}`}
                        surveyQuestions={surveyQuestions}
                        surveyLoading={surveyLoading}
                        isRegistrationOpen={registrationWindow.status === 'open'}
                        isSubmitting={joinTeam.isPending}
                        onSubmit={handleJoinTeamSubmit}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {hackathon && (
        <DatasetDownloadModal
          isOpen={showDatasetModal}
          onClose={() => setShowDatasetModal(false)}
          resources={datasetResources}
          challengeTitle={hackathon.title}
        />
      )}
      <Footer />
    </div>
  );
}

interface CreateTeamFormProps {
  surveyQuestions: SurveyQuestionDto[];
  surveyLoading: boolean;
  isRegistrationOpen: boolean;
  isSubmitting: boolean;
  onSubmit: (
    teamName: string,
    responses: SurveyAnswerPayload[],
    callbacks: SurveyFormCallbacks
  ) => void;
}

function CreateTeamForm({
  surveyQuestions,
  surveyLoading,
  isRegistrationOpen,
  isSubmitting,
  onSubmit,
}: CreateTeamFormProps) {
  const [teamName, setTeamName] = useState('');
  const [responses, setResponses] = useState<Record<number, string>>(() => createResponseState(surveyQuestions));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isRegistrationOpen) {
      setError('Registration is closed for this hackathon.');
      return;
    }

    if (!teamName.trim()) {
      setError('Team name is required.');
      return;
    }

    const answers = surveyQuestions
      .filter((question) => typeof question.id === 'number')
      .map((question) => ({
        questionId: question.id as number,
        answer: responses[question.id as number] || '',
      }));

    if (answers.length > 0 && answers.some((answer) => !answer.answer.trim())) {
      setError('Please answer all survey questions.');
      return;
    }

    onSubmit(teamName.trim(), answers, {
      onSuccess: () => {
        setTeamName('');
        setResponses(createResponseState(surveyQuestions));
        setError(null);
      },
      onError: (message) => setError(message),
    });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-black mb-4">Create a team</h3>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team name</label>
          <input
            type="text"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. Data Wizards"
          />
        </div>
        {surveyQuestions.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Survey questions</p>
            {surveyLoading ? (
              <p className="text-gray-500 text-sm">Loading survey...</p>
            ) : (
              surveyQuestions.map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{question.question}</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    value={responses[question.id as number] || ''}
                    onChange={(event) =>
                      setResponses((prev) => ({
                        ...prev,
                        [question.id as number]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))
            )}
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}
        <Button type="submit" variant="primary" disabled={isSubmitting || !isRegistrationOpen}>
          {isSubmitting ? 'Creating...' : 'Create team'}
        </Button>
      </form>
    </div>
  );
}

interface JoinTeamFormProps {
  surveyQuestions: SurveyQuestionDto[];
  surveyLoading: boolean;
  isRegistrationOpen: boolean;
  isSubmitting: boolean;
  onSubmit: (
    invitationCode: string,
    responses: SurveyAnswerPayload[],
    callbacks: SurveyFormCallbacks
  ) => void;
}

function JoinTeamForm({
  surveyQuestions,
  surveyLoading,
  isRegistrationOpen,
  isSubmitting,
  onSubmit,
}: JoinTeamFormProps) {
  const [invitationCode, setInvitationCode] = useState('');
  const [responses, setResponses] = useState<Record<number, string>>(() => createResponseState(surveyQuestions));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isRegistrationOpen) {
      setError('Registration is closed for this hackathon.');
      return;
    }

    if (!/^\d{6}$/.test(invitationCode.trim())) {
      setError('Enter a valid 6-digit invitation code.');
      return;
    }

    const answers = surveyQuestions
      .filter((question) => typeof question.id === 'number')
      .map((question) => ({
        questionId: question.id as number,
        answer: responses[question.id as number] || '',
      }));

    if (answers.length > 0 && answers.some((answer) => !answer.answer.trim())) {
      setError('Please answer all survey questions.');
      return;
    }

    onSubmit(invitationCode.trim(), answers, {
      onSuccess: () => {
        setInvitationCode('');
        setResponses(createResponseState(surveyQuestions));
        setError(null);
      },
      onError: (message) => setError(message),
    });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-black mb-4">Join via invitation</h3>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invitation code</label>
          <input
            type="text"
            maxLength={6}
            value={invitationCode}
            onChange={(event) => setInvitationCode(event.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center tracking-widest"
            placeholder="123456"
          />
        </div>
        {surveyQuestions.length > 0 && (
          <div className="space-y-4">
            {surveyLoading ? (
              <p className="text-gray-500 text-sm">Loading survey...</p>
            ) : (
              surveyQuestions.map((question) => (
                <div key={`join-${question.id}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{question.question}</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    value={responses[question.id as number] || ''}
                    onChange={(event) =>
                      setResponses((prev) => ({
                        ...prev,
                        [question.id as number]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))
            )}
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}
        <Button type="submit" variant="secondary" disabled={isSubmitting || !isRegistrationOpen}>
          {isSubmitting ? 'Joining...' : 'Join team'}
        </Button>
      </form>
    </div>
  );
}
