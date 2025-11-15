'use client';

import { use, useMemo, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import DatasetDownloadModal from '@/lib/components/DatasetDownloadModal';
import { useHackathon } from '@/lib/hooks/useHackathons';
import { useHackathonSurvey, useMyTeam, useCreateTeam, useJoinTeam } from '@/lib/hooks/useTeams';
import { useProvidedFiles } from '@/lib/hooks/useHackathonFiles';
import { useAuth } from '@/lib/hooks/useAuth';
import type { HackathonResource } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

type SurveyAnswer = {
  questionId: number;
  answer: string;
};

type JoinStep = 'mode' | 'details' | 'survey';
type JoinMode = 'create' | 'join';

export default function ChallengePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const hackathonId = Number(resolvedParams.id);

  if (Number.isNaN(hackathonId) || hackathonId <= 0) {
    notFound();
  }

  return <ChallengePageContent hackathonId={hackathonId} />;
}

function ChallengePageContent({ hackathonId }: { hackathonId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: hackathon, isLoading, error } = useHackathon(hackathonId);
  const { data: surveyData, isLoading: surveyLoading } = useHackathonSurvey(hackathonId);
  const surveyQuestions = useMemo(() => surveyData?.questions ?? [], [surveyData]);

  const {
    data: myTeam,
    isLoading: myTeamLoading,
    error: myTeamError,
  } = useMyTeam(hackathonId, { enabled: Boolean(user) });
  const canViewProvidedFiles = Boolean(myTeam?.isAccepted);
  const {
    data: providedFiles = [],
    isLoading: providedFilesLoading,
    error: providedFilesError,
  } = useProvidedFiles(hackathonId, {
    enabled: Boolean(user && canViewProvidedFiles),
  });

  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinStep, setJoinStep] = useState<JoinStep>('mode');
  const [joinMode, setJoinMode] = useState<JoinMode | null>(null);
  const [createTeamName, setCreateTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createResponses, setCreateResponses] = useState<Record<number, string>>({});
  const [joinResponses, setJoinResponses] = useState<Record<number, string>>({});
  const [detailError, setDetailError] = useState<string | null>(null);
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  const registrationStatus = useMemo(() => {
    if (!hackathon) {
      return { label: 'Unknown', status: 'closed' as const };
    }
    const regOpen = hackathon.registrationOpen ? new Date(hackathon.registrationOpen) : null;
    const regClose = hackathon.registrationClose ? new Date(hackathon.registrationClose) : null;
    const start = hackathon.startDate ? new Date(hackathon.startDate) : null;
    const now = new Date();

    if (regOpen && now < regOpen) {
      return { label: `Opens on ${regOpen.toLocaleString()}`, status: 'upcoming' as const };
    }
    if (regClose && now > regClose) {
      return { label: 'Registration closed', status: 'closed' as const };
    }
    if (start && now > start) {
      return { label: 'Registration closed', status: 'closed' as const };
    }
    return { label: 'Registration open', status: 'open' as const };
  }, [hackathon]);

  const statusBadge = useMemo(() => {
    if (!hackathon) return { label: 'Loading', className: 'bg-gray-100 text-gray-700' };
    const start = hackathon.startDate ? new Date(hackathon.startDate) : null;
    const end = hackathon.endDate ? new Date(hackathon.endDate) : null;
    const now = new Date();

    if (start && start > now) {
      return { label: 'Upcoming', className: 'bg-yellow-100 text-yellow-800' };
    }
    if (end && end < now) {
      return { label: 'Completed', className: 'bg-gray-200 text-gray-700' };
    }
    return { label: 'Active', className: 'bg-green-100 text-green-800' };
  }, [hackathon]);

  const datasetResources: HackathonResource[] = useMemo(() => {
    if (!hackathon?.resources) return [];
    return (hackathon.resources as HackathonResource[]).map((resource) => ({
      ...resource,
      hackathonId: resource.hackathonId ?? hackathon.id!,
    }));
  }, [hackathon]);

  const initializeSurveyResponses = () => {
    const defaults: Record<number, string> = {};
    surveyQuestions.forEach((question) => {
      if (typeof question.id === 'number') {
        defaults[question.id] = '';
      }
    });
    setCreateResponses(defaults);
    setJoinResponses(defaults);
  };

  const validateSurveyAnswers = (responses: Record<number, string>) => {
    if (!surveyQuestions.length) return true;
    return surveyQuestions.every((question) => {
      if (typeof question.id !== 'number') return true;
      return Boolean(responses[question.id]?.trim());
    });
  };

  const buildSurveyPayload = (responses: Record<number, string>): SurveyAnswer[] =>
    surveyQuestions
      .filter((question) => typeof question.id === 'number')
      .map((question) => ({
        questionId: question.id as number,
        answer: responses[question.id as number] || '',
      }));

  const openJoinModal = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    initializeSurveyResponses();
    setShowJoinModal(true);
    setJoinStep('mode');
    setJoinMode(null);
    setCreateTeamName('');
    setJoinCode('');
    setDetailError(null);
    setSurveyError(null);
  };

  const closeJoinModal = () => {
    setShowJoinModal(false);
    setJoinStep('mode');
    setJoinMode(null);
    setDetailError(null);
    setSurveyError(null);
  };

  const handleDetailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDetailError(null);

    if (registrationStatus.status !== 'open') {
      setDetailError('Registration is closed for this hackathon.');
      return;
    }

    if (joinMode === 'create') {
      if (!createTeamName.trim()) {
        setDetailError('Team name is required.');
        return;
      }
    } else if (joinMode === 'join') {
      if (!/^[0-9]{6}$/.test(joinCode.trim())) {
        setDetailError('Enter a valid 6-digit invitation code.');
        return;
      }
    }

    setJoinStep('survey');
    setSurveyError(null);
  };

  const handleSurveySubmit = () => {
    setSurveyError(null);
    setGlobalMessage(null);

    if (registrationStatus.status !== 'open') {
      setSurveyError('Registration is closed for this hackathon.');
      return;
    }

    if (joinMode === 'create') {
      if (!validateSurveyAnswers(createResponses)) {
        setSurveyError('Please answer all survey questions.');
        return;
      }

      createTeam.mutate(
        {
          body: {
            hackathonId,
            teamName: createTeamName.trim(),
            surveyResponses: buildSurveyPayload(createResponses),
          },
        },
        {
          onSuccess: () => {
            setGlobalMessage('Team created! Share your invitation code with teammates.');
            closeJoinModal();
          },
          onError: (mutationError) => {
            setSurveyError(
              mutationError instanceof Error ? mutationError.message : 'Failed to create team'
            );
          },
        }
      );
    } else if (joinMode === 'join') {
      if (!validateSurveyAnswers(joinResponses)) {
        setSurveyError('Please answer all survey questions.');
        return;
      }

      joinTeam.mutate(
        {
          body: {
            invitationCode: joinCode.trim(),
            surveyResponses: buildSurveyPayload(joinResponses),
          },
        },
        {
          onSuccess: () => {
            setGlobalMessage('Successfully joined the team!');
            closeJoinModal();
          },
          onError: (mutationError) => {
            setSurveyError(
              mutationError instanceof Error ? mutationError.message : 'Failed to join team'
            );
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <p className="text-center text-gray-600">Loading challenge...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !hackathon) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 space-y-8">
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                  {hackathon.type?.replace('_', ' ') ?? 'Category'}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-black mb-4">{hackathon.title}</h1>
              <p className="text-gray-600 mb-4">{hackathon.description}</p>
              <p className="text-sm text-gray-500">{registrationStatus.label}</p>
            </div>
            <div className="text-right space-y-2">
              <p className="text-sm text-gray-500">Prize pool</p>
              <p className="text-3xl font-bold text-black">${hackathon.prize?.toLocaleString() ?? 0}</p>
              <Button variant="outline" onClick={() => setShowDatasetModal(true)} disabled={datasetResources.length === 0}>
                Download resources
              </Button>
            </div>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 text-sm text-gray-600">
          <div>
            <p className="font-semibold text-black">Team size</p>
            <p>
              {hackathon.teamMin} - {hackathon.teamMax} members
            </p>
          </div>
          <div>
            <p className="font-semibold text-black">Registration opens</p>
            <p>{hackathon.registrationOpen ? new Date(hackathon.registrationOpen).toLocaleString() : 'TBD'}</p>
          </div>
          <div>
            <p className="font-semibold text-black">Starts</p>
            <p>{hackathon.startDate ? new Date(hackathon.startDate).toLocaleString() : 'TBD'}</p>
          </div>
          <div>
            <p className="font-semibold text-black">Ends</p>
            <p>{hackathon.endDate ? new Date(hackathon.endDate).toLocaleString() : 'TBD'}</p>
          </div>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-black">Registration closes</p>
              <p>{hackathon.registrationClose ? new Date(hackathon.registrationClose).toLocaleString() : 'TBD'}</p>
            </div>
            <div>
              <p className="font-semibold text-black">Submission limit</p>
              <p>{hackathon.submissionLimit ?? 'Unlimited'}</p>
            </div>
            <div>
              <p className="font-semibold text-black">Submission timeout (s)</p>
              <p>{hackathon.submissionTimeout ?? 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold text-black">Thread limit / RAM</p>
              <p>
                {hackathon.threadLimit ?? 'N/A'} threads / {hackathon.ramLimit ?? 'N/A'} GB
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-black">Team status</h2>
              {registrationStatus.status === 'open' && !myTeam && (
                <Button variant="primary" onClick={openJoinModal}>
                  {user ? 'Join Hackathon' : 'Sign in to join'}
                </Button>
              )}
            </div>
            {myTeamLoading ? (
              <p className="text-gray-600 text-sm">Checking your team...</p>
            ) : myTeamError ? (
              <p className="text-red-600 text-sm">
                {(myTeamError as Error).message ?? 'Failed to load team info'}
              </p>
            ) : myTeam ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Invitation code</p>
                    <p className="text-2xl font-mono">{myTeam.invitationCode}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      myTeam.isAccepted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {myTeam.isAccepted ? 'Accepted' : 'Pending approval'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-black">Members</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(myTeam.members?.length ?? 0)}/{hackathon.teamMax} spots filled
                  </p>
                  <div className="space-y-2 mt-2">
                    {myTeam.members?.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-black">{member.username}</p>
                          <p className="text-xs text-gray-500">
                            {member.name ? `${member.name} ${member.surname ?? ''}` : 'Profile incomplete'}
                          </p>
                        </div>
                        {member.id === myTeam.captainId && (
                          <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-50 rounded-full">
                            Captain
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">
                Click &quot;Join Hackathon&quot; to create a team or join with an invitation code.
              </p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            {!user && (
              <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
                Sign in to create or join a team.
              </div>
            )}
            {globalMessage && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                {globalMessage}
              </div>
            )}
          </div>
        </div>

        {myTeam && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black">Hackathon files</h2>
                <p className="text-sm text-gray-500">
                  Organizers can share benchmarks and data with accepted teams.
                </p>
              </div>
            </div>
            {!myTeam.isAccepted ? (
              <p className="text-sm text-gray-600">
                Files will be unlocked once your team is accepted to this hackathon.
              </p>
            ) : providedFilesLoading ? (
              <p className="text-sm text-gray-600">Loading provided files...</p>
            ) : providedFilesError ? (
              <p className="text-sm text-red-600">
                {(providedFilesError as Error).message ?? 'Failed to load provided files'}
              </p>
            ) : providedFiles.length === 0 ? (
              <p className="text-sm text-gray-600">Organizers have not published any files yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {providedFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-semibold text-black">{file.title}</p>
                      <p className="text-xs text-gray-500">
                        Updated {new Date(file.updatedAt ?? file.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <a
                      href={`${API_BASE_URL}${file.fileUrl}`}
                      className="text-sm font-semibold text-primary hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
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

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-black">Join {hackathon?.title}</h3>
                <p className="text-sm text-gray-500">
                  {joinStep === 'mode'
                    ? 'Choose how you want to participate.'
                    : joinStep === 'details'
                    ? joinMode === 'create'
                      ? 'Provide team details before continuing.'
                      : 'Enter the team invitation code.'
                    : 'Answer the survey questions to finish.'}
                </p>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={closeJoinModal}>
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {joinStep === 'mode' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    className="border border-gray-200 rounded-lg p-4 text-left hover:border-primary"
                    onClick={() => {
                      setJoinMode('create');
                      setJoinStep('details');
                      setDetailError(null);
                    }}
                  >
                    <h4 className="text-lg font-semibold text-black mb-2">Create team</h4>
                    <p className="text-sm text-gray-600">Start a team and invite others with a code.</p>
                  </button>
                  <button
                    className="border border-gray-200 rounded-lg p-4 text-left hover:border-primary"
                    onClick={() => {
                      setJoinMode('join');
                      setJoinStep('details');
                      setDetailError(null);
                    }}
                  >
                    <h4 className="text-lg font-semibold text-black mb-2">Join team</h4>
                    <p className="text-sm text-gray-600">Use the 6-digit code from your team captain.</p>
                  </button>
                </div>
              )}

              {joinStep === 'details' && joinMode && (
                <form className="space-y-4" onSubmit={handleDetailSubmit}>
                  {joinMode === 'create' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Team name</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={createTeamName}
                        onChange={(event) => setCreateTeamName(event.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invitation code</label>
                      <input
                        type="text"
                        maxLength={6}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                        value={joinCode}
                        onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  )}
                  {detailError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      {detailError}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Button type="submit" variant="primary">
                      Continue
                    </Button>
                    <button type="button" className="text-sm text-gray-500" onClick={() => setJoinStep('mode')}>
                      Back
                    </button>
                  </div>
                </form>
              )}

              {joinStep === 'survey' && joinMode && (
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSurveySubmit();
                  }}
                >
                  {surveyQuestions.length === 0 ? (
                    <p className="text-sm text-gray-600">No survey questions for this hackathon.</p>
                  ) : surveyLoading ? (
                    <p className="text-sm text-gray-600">Loading survey questions...</p>
                  ) : (
                    surveyQuestions.map((question) => (
                      <div key={`survey-${question.id}`}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {question.question}
                        </label>
                        <textarea
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={(joinMode === 'create' ? createResponses : joinResponses)[question.id as number] || ''}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (joinMode === 'create') {
                              setCreateResponses((prev) => ({ ...prev, [question.id as number]: value }));
                            } else {
                              setJoinResponses((prev) => ({ ...prev, [question.id as number]: value }));
                            }
                          }}
                        />
                      </div>
                    ))
                  )}
                  {surveyError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      {surveyError}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={createTeam.isPending || joinTeam.isPending}
                    >
                      {joinMode === 'create'
                        ? createTeam.isPending
                          ? 'Submitting...'
                          : 'Create team'
                        : joinTeam.isPending
                        ? 'Submitting...'
                        : 'Join team'}
                    </Button>
                    <button type="button" className="text-sm text-gray-500" onClick={() => setJoinStep('details')}>
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
