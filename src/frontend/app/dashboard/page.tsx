'use client';

import { useMemo, useState } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useJudgeHackathons } from '@/lib/hooks/useHackathons';
import { useHackathonSubmissions, useScoreSubmission } from '@/lib/hooks/useSubmissions';

export default function JudgeDashboardPage() {
  const { user, loading } = useAuth();
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [scoreValue, setScoreValue] = useState('');
  const [scoreComment, setScoreComment] = useState('');
  const [scoreFeedback, setScoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const { data: submissions = [], isLoading: submissionsLoading } = useHackathonSubmissions(
    currentHackathonId ?? 0,
    { enabled: !!currentHackathonId }
  );

  const scoreSubmissionMutation = useScoreSubmission();

  const selectedSubmission = submissions.find((s) => s.id === selectedSubmissionId);

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionId) return;

    const score = parseFloat(scoreValue);
    if (isNaN(score) || score < 0) {
      setScoreFeedback({ type: 'error', message: 'Please enter a valid score' });
      return;
    }

    try {
      setScoreFeedback(null);
      await scoreSubmissionMutation.mutateAsync({
        submissionId: selectedSubmissionId,
        score,
        scoreComment: scoreComment || undefined,
      });
      setScoreFeedback({ type: 'success', message: 'Score submitted successfully' });
      setScoreValue('');
      setScoreComment('');
      setSelectedSubmissionId(null);
    } catch (error) {
      setScoreFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to score submission',
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <section className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-black mb-3">Assigned Hackathons</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {assignedHackathons.map((hackathon) => {
                  const isActive = hackathon.id === currentHackathonId;
                  return (
                    <button
                      key={hackathon.id}
                      onClick={() => {
                        setSelectedHackathonId(hackathon.id);
                        setSelectedSubmissionId(null);
                      }}
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

            <section className="lg:col-span-3 space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-black">
                      {assignedHackathons.find((hackathon) => hackathon.id === currentHackathonId)?.title ??
                        'Select a hackathon'}
                    </h2>
                    {currentHackathonId && (
                      <p className="text-sm text-gray-500">
                        Review and score all submissions.
                      </p>
                    )}
                  </div>
                </div>
                {!currentHackathonId ? (
                  <p className="text-sm text-gray-600">Choose a hackathon to view its submissions.</p>
                ) : submissionsLoading ? (
                  <p className="text-sm text-gray-600">Loading submissions...</p>
                ) : submissions.length === 0 ? (
                  <p className="text-sm text-gray-600">No submissions yet.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {submissions.map((submission) => (
                        <div
                          key={submission.id}
                          className={`border rounded-lg p-4 cursor-pointer ${
                            selectedSubmissionId === submission.id
                              ? 'border-primary bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedSubmissionId(submission.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-black">Team: {submission.team?.name ?? 'Unknown'}</p>
                              <p className="text-xs text-gray-500">
                                Submitted: {submission.sendAt ? new Date(submission.sendAt).toLocaleString() : 'Draft'}
                              </p>
                              {submission.files && submission.files.length > 0 && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {submission.files.length} file{submission.files.length !== 1 ? 's' : ''} attached
                                </p>
                              )}
                              {submission.score !== null && submission.score !== undefined && (
                                <p className="text-sm font-semibold text-green-700 mt-1">Score: {submission.score}</p>
                              )}
                            </div>
                            {submission.sendAt && (submission.score === null || submission.score === undefined) && (
                              <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                                Needs Scoring
                              </span>
                            )}
                            {submission.score !== null && submission.score !== undefined && (
                              <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                                Scored
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedSubmission && selectedSubmission.sendAt && (
                      <div className="border-t border-gray-200 pt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-black">Review Submission</h3>

                        {/* Submission Files */}
                        {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Submitted Files</p>
                            <div className="space-y-2">
                              {selectedSubmission.files.map((file) => (
                                <div key={file.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-black">{file.title || file.name}</p>
                                    <p className="text-xs text-gray-500">{file.name}</p>
                                  </div>
                                  <a
                                    href={file.url}
                                    download
                                    className="text-sm text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Download
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Current Score Info */}
                        {selectedSubmission.score !== null && selectedSubmission.score !== undefined && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-800">Current Score: {selectedSubmission.score}</p>
                            {selectedSubmission.scoreComment && (
                              <p className="text-xs text-green-700 mt-1">{selectedSubmission.scoreComment}</p>
                            )}
                            <p className="text-xs text-green-600 mt-1">
                              You can update the score by submitting a new one below.
                            </p>
                          </div>
                        )}

                        {scoreFeedback && (
                          <div
                            className={`p-3 rounded-lg border text-sm ${
                              scoreFeedback.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}
                          >
                            {scoreFeedback.message}
                          </div>
                        )}

                        <form onSubmit={handleScoreSubmit} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {selectedSubmission.score !== null && selectedSubmission.score !== undefined
                                ? 'Update Score'
                                : 'Score'}
                            </label>
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                              value={scoreValue}
                              onChange={(e) => setScoreValue(e.target.value)}
                              required
                              placeholder={selectedSubmission.score !== null && selectedSubmission.score !== undefined
                                ? `Current: ${selectedSubmission.score}`
                                : 'Enter score'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                            <textarea
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                              value={scoreComment}
                              onChange={(e) => setScoreComment(e.target.value)}
                              rows={3}
                              placeholder="Add feedback..."
                            />
                          </div>
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={scoreSubmissionMutation.isPending}
                          >
                            {scoreSubmissionMutation.isPending
                              ? 'Submitting...'
                              : selectedSubmission.score !== null && selectedSubmission.score !== undefined
                              ? 'Update Score'
                              : 'Submit Score'}
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
