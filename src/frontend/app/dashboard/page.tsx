'use client';

import { FormEvent, useMemo, useState } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useJudgeHackathons } from '@/lib/hooks/useJudges';
import { useHackathonTeams, useTeamDetail } from '@/lib/hooks/useAdmin';
import {
  useHackathonSubmissions,
  useSubmission,
  useScoreSubmission,
  type Submission,
} from '@/lib/hooks/useSubmissions';

const TEAM_LIMIT = 6;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type HackathonSummary = {
  id: number;
  title?: string | null;
  startDate?: string | null;
};

type HackathonTeam = {
  id: number;
  name: string;
  invitationCode: string;
  memberCount?: number | null;
  members?: { id: number; username: string }[];
};

type TeamDetailData = {
  id: number;
  name: string;
  invitationCode: string;
  isAccepted: boolean;
  memberResponses?: {
    member: { id: number; username: string };
    surveyResponses?: { questionId: number; question: string; answer: string }[];
  }[];
};

type TeamPagination = {
  page?: number;
  totalPages?: number;
};

type ReviewFeedback = { type: 'success' | 'error'; message: string } | null;

export default function JudgeDashboardPage() {
  const { user, loading } = useAuth();
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamPageByHackathon, setTeamPageByHackathon] = useState<Record<number, number>>({});
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [reviewScoreValue, setReviewScoreValue] = useState('');
  const [reviewCommentValue, setReviewCommentValue] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<ReviewFeedback>(null);

  const {
    data: assignedHackathons = [],
    isLoading: assignedLoading,
    error: assignedError,
  } = useJudgeHackathons({ enabled: Boolean(user && user.role === 'JUDGE') });

  const currentHackathonId = useMemo(() => {
    if (selectedHackathonId && assignedHackathons.some((hackathon) => hackathon.id === selectedHackathonId)) {
      return selectedHackathonId;
    }
    return assignedHackathons[0]?.id ?? null;
  }, [assignedHackathons, selectedHackathonId]);

  const currentTeamPage = currentHackathonId ? teamPageByHackathon[currentHackathonId] ?? 1 : 1;

  const { data: teamsData, isLoading: teamsLoading } = useHackathonTeams(currentHackathonId ?? 0, {
    query: { page: currentTeamPage, limit: TEAM_LIMIT },
  });
  const teams = useMemo(() => teamsData?.teams ?? [], [teamsData]);
  const teamPagination = teamsData?.pagination;

  const currentTeamId = useMemo(() => {
    if (selectedTeamId && teams.some((team) => team.id === selectedTeamId)) {
      return selectedTeamId;
    }
    return teams[0]?.id ?? null;
  }, [teams, selectedTeamId]);

  const updateTeamPage = (nextPage: number) => {
    if (!currentHackathonId) return;
    setTeamPageByHackathon((prev) => ({
      ...prev,
      [currentHackathonId]: nextPage,
    }));
  };

  const { data: teamDetailResp, isLoading: teamDetailLoading } = useTeamDetail(currentTeamId ?? 0);
  const teamDetail = teamDetailResp?.team as TeamDetailData | undefined;

  const {
    data: hackathonSubmissions = [],
    isLoading: hackathonSubmissionsLoading,
    error: hackathonSubmissionsError,
  } = useHackathonSubmissions(currentHackathonId ?? 0, {
    enabled: Boolean(user?.role === 'JUDGE' && currentHackathonId),
  });
  const finalizedSubmissions = useMemo(
    () => hackathonSubmissions.filter((submission) => Boolean(submission.sendAt)),
    [hackathonSubmissions]
  );
  const submissionsForView = useMemo(() => {
    if (!currentTeamId) return finalizedSubmissions;
    return finalizedSubmissions.filter((submission) => submission.teamId === currentTeamId);
  }, [finalizedSubmissions, currentTeamId]);

  const activeSubmissionId =
    selectedSubmissionId && submissionsForView.some((submission) => submission.id === selectedSubmissionId)
      ? selectedSubmissionId
      : submissionsForView[0]?.id ?? null;

  const {
    data: selectedSubmission,
    isLoading: selectedSubmissionLoading,
  } = useSubmission(activeSubmissionId ?? 0, { enabled: Boolean(activeSubmissionId) });
  const detailSubmission = activeSubmissionId
    ? selectedSubmission ?? submissionsForView.find((submission) => submission.id === activeSubmissionId)
    : null;
  const scoreSubmissionMutation = useScoreSubmission();
  const hackathonTitle =
    assignedHackathons.find((hackathon) => hackathon.id === currentHackathonId)?.title ?? null;
  const submissionsError =
    hackathonSubmissionsError instanceof Error ? hackathonSubmissionsError : undefined;

  const resetSubmissionState = () => {
    setSelectedSubmissionId(null);
    setReviewScoreValue('');
    setReviewCommentValue('');
    setReviewFeedback(null);
  };

  const handleHackathonSelect = (hackathonId: number) => {
    setSelectedHackathonId(hackathonId);
    setTeamPageByHackathon((prev) => ({
      ...prev,
      [hackathonId]: 1,
    }));
    setSelectedTeamId(null);
    resetSubmissionState();
  };

  const handleTeamSelect = (teamId: number | null) => {
    setSelectedTeamId(teamId);
    resetSubmissionState();
  };

  const handleSubmissionSelect = (submission: Submission) => {
    setSelectedSubmissionId(submission.id);
    setReviewFeedback(null);
    setReviewScoreValue(
      submission.score !== null && submission.score !== undefined ? submission.score.toString() : ''
    );
    setReviewCommentValue(submission.scoreComment ?? '');
  };

  const handleJudgeReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeSubmissionId) {
      setReviewFeedback({ type: 'error', message: 'Select a submission to review.' });
      return;
    }

    const parsedScore = parseFloat(reviewScoreValue);
    if (Number.isNaN(parsedScore) || parsedScore < 0) {
      setReviewFeedback({ type: 'error', message: 'Enter a valid non-negative score.' });
      return;
    }

    try {
      setReviewFeedback(null);
      await scoreSubmissionMutation.mutateAsync({
        submissionId: activeSubmissionId,
        score: parsedScore,
        scoreComment: reviewCommentValue || undefined,
      });
      setReviewFeedback({ type: 'success', message: 'Review saved successfully.' });
    } catch (error) {
      setReviewFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit review.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Loading your dashboard...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-lg text-gray-700 mb-4">Sign in to access the judge dashboard.</p>
            <Button variant="primary" href="/login">
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user.role !== 'JUDGE') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-yellow-200 rounded-lg p-12 text-center text-gray-700">
            Only judges can access this dashboard.
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black">Judge Dashboard</h1>
            <p className="text-gray-600">Review teams for hackathons you’ve been assigned to.</p>
          </div>
        </div>

        {assignedLoading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">
            Loading your hackathons...
          </div>
        ) : assignedError ? (
          <div className="bg-white border border-red-200 rounded-lg p-8 text-red-700">
            {(assignedError as Error).message ?? 'Failed to load hackathons'}
          </div>
        ) : assignedHackathons.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">
            You have not been assigned to any hackathons yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            <HackathonSidebar
              hackathons={assignedHackathons}
              currentHackathonId={currentHackathonId}
              onSelect={handleHackathonSelect}
            />

            <div className="space-y-6">
              <TeamPanel
                hackathonTitle={hackathonTitle}
                currentHackathonId={currentHackathonId}
                teamsLoading={teamsLoading}
                teams={teams}
                teamPagination={teamPagination}
                currentTeamPage={currentTeamPage}
                onChangePage={updateTeamPage}
                currentTeamId={currentTeamId}
                onSelectTeam={handleTeamSelect}
                teamDetailLoading={teamDetailLoading}
                teamDetail={teamDetail}
              />

              <SubmissionsPanel
                currentHackathonId={currentHackathonId}
                hackathonTitle={hackathonTitle}
                submissions={submissionsForView}
                activeSubmissionId={activeSubmissionId}
                onSelectSubmission={handleSubmissionSelect}
                detailSubmission={detailSubmission ?? null}
                selectedSubmissionLoading={selectedSubmissionLoading}
                reviewScoreValue={reviewScoreValue}
                reviewCommentValue={reviewCommentValue}
                setReviewScoreValue={setReviewScoreValue}
                setReviewCommentValue={setReviewCommentValue}
                reviewFeedback={reviewFeedback}
                onSubmitReview={handleJudgeReviewSubmit}
                isSaving={scoreSubmissionMutation.isPending}
                submissionsLoading={hackathonSubmissionsLoading}
                submissionsError={submissionsError}
                currentTeamId={currentTeamId}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function HackathonSidebar({
  hackathons,
  currentHackathonId,
  onSelect,
}: {
  hackathons: HackathonSummary[];
  currentHackathonId: number | null;
  onSelect: (hackathonId: number) => void;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 h-full lg:sticky top-24 self-start">
      <h2 className="text-lg font-semibold text-black mb-3">Assigned hackathons</h2>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
        {hackathons.map((hackathon) => {
          const isActive = hackathon.id === currentHackathonId;
          return (
            <button
              key={hackathon.id}
              onClick={() => onSelect(hackathon.id)}
              className={`w-full text-left p-3 rounded-lg border ${
                isActive ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <p className="font-semibold text-black">{hackathon.title}</p>
              {hackathon.startDate && (
                <p className="text-xs text-gray-500">
                  Starts {new Date(hackathon.startDate).toLocaleDateString()}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TeamPanel({
  hackathonTitle,
  currentHackathonId,
  teamsLoading,
  teams,
  teamPagination,
  currentTeamPage,
  onChangePage,
  onSelectTeam,
  currentTeamId,
  teamDetailLoading,
  teamDetail,
}: {
  hackathonTitle: string | null;
  currentHackathonId: number | null;
  teamsLoading: boolean;
  teams: HackathonTeam[];
  teamPagination?: TeamPagination;
  currentTeamPage: number;
  onChangePage: (page: number) => void;
  onSelectTeam: (teamId: number | null) => void;
  currentTeamId: number | null;
  teamDetailLoading: boolean;
  teamDetail?: TeamDetailData | null;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">{hackathonTitle ?? 'Select a hackathon'}</h2>
          {currentHackathonId && (
            <p className="text-sm text-gray-500">Review teams and their survey responses.</p>
          )}
        </div>
      </div>

      {!currentHackathonId ? (
        <p className="text-sm text-gray-600">Choose a hackathon to view its teams.</p>
      ) : teamsLoading ? (
        <p className="text-sm text-gray-600">Loading teams...</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-gray-600">No teams have registered yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => onSelectTeam(team.id ?? null)}
                className={`w-full text-left p-4 ${
                  currentTeamId === team.id ? 'bg-blue-50 border-l-4 border-primary' : 'hover:bg-gray-50'
                }`}
              >
                <p className="font-semibold text-black">{team.name}</p>
                <p className="text-xs text-gray-500 font-mono">Code: {team.invitationCode}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Members: {team.memberCount ?? team.members?.length ?? 0}
                </p>
              </button>
            ))}
            {teamPagination && currentHackathonId && (
              <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
                <button
                  onClick={() => onChangePage(Math.max(1, currentTeamPage - 1))}
                  disabled={teamPagination.page !== undefined && teamPagination.page <= 1}
                  className="text-primary disabled:text-gray-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (teamPagination.totalPages && teamPagination.page && teamPagination.page < teamPagination.totalPages) {
                      onChangePage(currentTeamPage + 1);
                    }
                  }}
                  disabled={
                    !!teamPagination.totalPages &&
                    !!teamPagination.page &&
                    teamPagination.page >= teamPagination.totalPages
                  }
                  className="text-primary disabled:text-gray-300"
                >
                  Next
                </button>
              </div>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            {teamDetailLoading ? (
              <p className="text-sm text-gray-600">Loading team details...</p>
            ) : !teamDetail ? (
              <p className="text-sm text-gray-600">Select a team to view their submission details.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-black">{teamDetail.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">
                    Invitation code: {teamDetail.invitationCode}
                  </p>
                  <span
                    className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      teamDetail.isAccepted ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
                    }`}
                  >
                    {teamDetail.isAccepted ? 'Accepted' : 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-black mb-2">Members & survey answers</p>
                  <ul className="space-y-2">
                    {teamDetail.memberResponses?.map((entry) => (
                      <li key={entry.member.id} className="border border-gray-200 rounded-lg px-3 py-2">
                        <p className="font-medium text-black">{entry.member.username}</p>
                        <ul className="mt-2 space-y-1 text-xs text-gray-600">
                          {entry.surveyResponses?.map((response) => (
                            <li key={response.questionId}>
                              <span className="font-semibold">{response.question}:</span> {response.answer}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionsPanel({
  currentHackathonId,
  hackathonTitle,
  submissions,
  activeSubmissionId,
  onSelectSubmission,
  detailSubmission,
  selectedSubmissionLoading,
  reviewScoreValue,
  reviewCommentValue,
  setReviewScoreValue,
  setReviewCommentValue,
  reviewFeedback,
  onSubmitReview,
  isSaving,
  submissionsLoading,
  submissionsError,
  currentTeamId,
}: {
  currentHackathonId: number | null;
  hackathonTitle: string | null;
  submissions: Submission[];
  activeSubmissionId: number | null;
  onSelectSubmission: (submission: Submission) => void;
  detailSubmission: Submission | null;
  selectedSubmissionLoading: boolean;
  reviewScoreValue: string;
  reviewCommentValue: string;
  setReviewScoreValue: (value: string) => void;
  setReviewCommentValue: (value: string) => void;
  reviewFeedback: ReviewFeedback;
  onSubmitReview: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  isSaving: boolean;
  submissionsLoading: boolean;
  submissionsError?: Error | undefined;
  currentTeamId: number | null;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-black">Submissions & manual reviews</h2>
          <p className="text-sm text-gray-500">
            {hackathonTitle ? `Submissions for ${hackathonTitle}.` : 'Select a hackathon to review submissions.'}
          </p>
        </div>
      </div>

      {!currentHackathonId ? (
        <p className="text-sm text-gray-600">Select a hackathon to review its submissions.</p>
      ) : submissionsLoading ? (
        <p className="text-sm text-gray-600">Loading submissions…</p>
      ) : submissionsError ? (
        <p className="text-sm text-red-600">{submissionsError.message ?? 'Failed to load submissions.'}</p>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-gray-600">
          {currentTeamId
            ? 'No finalized submissions for this team yet.'
            : 'No finalized submissions yet. Teams need to submit before you can review them.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {submissions.map((submission) => {
              const isSelected = submission.id === activeSubmissionId;
              const teamName = submission.team?.name ?? `Team #${submission.teamId}`;
              return (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => onSelectSubmission(submission)}
                  className={`w-full text-left border rounded-lg p-4 transition ${
                    isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-black">{teamName}</p>
                  <p className="text-xs text-gray-500">
                    Submitted: {submission.sendAt ? new Date(submission.sendAt).toLocaleString() : 'Draft'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    {submission.score !== null && submission.score !== undefined ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold">
                        Scored ({submission.score})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
                        Needs review
                      </span>
                    )}
                    {submission.scoreManual && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Manual</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            {!activeSubmissionId ? (
              <p className="text-sm text-gray-600">Select a submission to view its details.</p>
            ) : selectedSubmissionLoading ? (
              <p className="text-sm text-gray-600">Loading submission details…</p>
            ) : !detailSubmission ? (
              <p className="text-sm text-red-600">Unable to load the selected submission.</p>
            ) : (
              <>
                <div className="space-y-1 text-sm text-gray-700">
                  <p className="font-semibold text-black">
                    {detailSubmission.team?.name ?? `Team #${detailSubmission.teamId}`}
                  </p>
                  <p>
                    Submitted: {detailSubmission.sendAt ? new Date(detailSubmission.sendAt).toLocaleString() : 'Draft'}
                  </p>
                  <p>
                    Current score:{' '}
                    {detailSubmission.score !== null && detailSubmission.score !== undefined
                      ? detailSubmission.score
                      : 'Not reviewed'}
                  </p>
                  {detailSubmission.scoreComment && (
                    <p className="text-xs text-gray-500">Comment: {detailSubmission.scoreComment}</p>
                  )}
                  {detailSubmission.scoreManual && (
                    <p className="text-xs text-blue-600 font-semibold">Marked as manual review</p>
                  )}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-black">Files</p>
                  {detailSubmission.files && detailSubmission.files.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {detailSubmission.files.map((file) => {
                        const downloadUrl = file.fileUrl.startsWith('http')
                          ? file.fileUrl
                          : `${API_BASE_URL}${file.fileUrl}`;
                        return (
                          <li
                            key={file.id}
                            className="flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white"
                          >
                            <div>
                              <p className="font-medium text-black">{file.fileFormat?.name ?? 'Attachment'}</p>
                              <p className="text-xs text-gray-500">
                                {file.fileFormat?.extension} • {file.fileFormat?.description}
                              </p>
                            </div>
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                              Download
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">No files attached.</p>
                  )}
                </div>
                {reviewFeedback && (
                  <div
                    className={`text-sm rounded-md border px-3 py-2 ${
                      reviewFeedback.type === 'success'
                        ? 'text-green-700 bg-green-50 border-green-200'
                        : 'text-red-700 bg-red-50 border-red-200'
                    }`}
                  >
                    {reviewFeedback.message}
                  </div>
                )}
                {!detailSubmission.sendAt ? (
                  <p className="text-sm text-gray-600">
                    Draft submissions cannot be reviewed. Ask the team to finalize.
                  </p>
                ) : (
                  <form className="space-y-3" onSubmit={onSubmitReview}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={reviewScoreValue}
                        onChange={(event) => setReviewScoreValue(event.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                      <textarea
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={reviewCommentValue}
                        onChange={(event) => setReviewCommentValue(event.target.value)}
                        placeholder="Share feedback with the team (optional)"
                      />
                    </div>
                    <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save review'}
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
