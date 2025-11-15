'use client';

import { useState } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHackathons } from '@/lib/hooks/useHackathons';
import { useHackathonSubmissions, useScoreSubmission } from '@/lib/hooks/useSubmissions';
import {
  useFileFormats,
  useCreateFileFormat,
  useUpdateFileFormat,
  useDeleteFileFormat,
} from '@/lib/hooks/useFileFormats';
export default function AdminSubmissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [scoreValue, setScoreValue] = useState('');
  const [scoreComment, setScoreComment] = useState('');
  const [scoreFeedback, setScoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // File format management state
  const [formatFormData, setFormatFormData] = useState({
    name: '',
    description: '',
    extension: '',
    maxSizeKB: '',
    obligatory: false,
  });
  const [editingFormatId, setEditingFormatId] = useState<number | null>(null);
  const [formatFeedback, setFormatFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: hackathonsData, isLoading: hackathonsLoading } = useHackathons({ query: { page: 1, limit: 100 } });
  const hackathons = hackathonsData?.hackathons ?? [];

  const { data: submissions = [], isLoading: submissionsLoading } = useHackathonSubmissions(
    selectedHackathonId ?? 0,
    { enabled: !!selectedHackathonId }
  );

  const { data: fileFormats = [], isLoading: formatsLoading } = useFileFormats(selectedHackathonId ?? 0, {
    enabled: !!selectedHackathonId,
  });

  const scoreSubmissionMutation = useScoreSubmission();
  const createFormatMutation = useCreateFileFormat();
  const updateFormatMutation = useUpdateFileFormat();
  const deleteFormatMutation = useDeleteFileFormat();

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

  const handleFormatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHackathonId) return;

    const maxSizeKB = parseInt(formatFormData.maxSizeKB);
    if (isNaN(maxSizeKB) || maxSizeKB <= 0) {
      setFormatFeedback({ type: 'error', message: 'Please enter a valid file size' });
      return;
    }

    if (!formatFormData.extension.startsWith('.')) {
      setFormatFeedback({ type: 'error', message: 'Extension must start with a dot (e.g., .csv)' });
      return;
    }

    try {
      setFormatFeedback(null);

      if (editingFormatId) {
        await updateFormatMutation.mutateAsync({
          formatId: editingFormatId,
          hackathonId: selectedHackathonId,
          data: {
            name: formatFormData.name,
            description: formatFormData.description,
            extension: formatFormData.extension,
            maxSizeKB,
            obligatory: formatFormData.obligatory,
          },
        });
        setFormatFeedback({ type: 'success', message: 'File format updated successfully' });
        setEditingFormatId(null);
      } else {
        await createFormatMutation.mutateAsync({
          hackathonId: selectedHackathonId,
          data: {
            name: formatFormData.name,
            description: formatFormData.description,
            extension: formatFormData.extension,
            maxSizeKB,
            obligatory: formatFormData.obligatory,
          },
        });
        setFormatFeedback({ type: 'success', message: 'File format created successfully' });
      }

      setFormatFormData({
        name: '',
        description: '',
        extension: '',
        maxSizeKB: '',
        obligatory: false,
      });
    } catch (error) {
      setFormatFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save file format',
      });
    }
  };

  const handleDeleteFormat = async (formatId: number) => {
    if (!selectedHackathonId) return;
    if (!confirm('Are you sure you want to delete this file format?')) return;

    try {
      setFormatFeedback(null);
      await deleteFormatMutation.mutateAsync({ formatId, hackathonId: selectedHackathonId });
      setFormatFeedback({ type: 'success', message: 'File format deleted successfully' });
    } catch (error) {
      setFormatFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete file format',
      });
    }
  };

  const startEditFormat = (format: typeof fileFormats[0]) => {
    setEditingFormatId(format.id);
    setFormatFormData({
      name: format.name,
      description: format.description,
      extension: format.extension,
      maxSizeKB: String(format.maxSizeKB),
      obligatory: format.obligatory,
    });
  };

  if (authLoading || hackathonsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Loading...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'JUDGE')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-yellow-200 rounded-lg p-12 text-center">
            <p className="text-lg text-gray-700">You do not have access to this page.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Submissions & File Formats</h1>
              <p className="text-gray-600">Manage submissions and file format requirements</p>
            </div>
            <Button variant="outline" href="/admin">
              Back to Admin
            </Button>
          </div>

          {/* Hackathon Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Hackathon</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedHackathonId ?? ''}
              onChange={(e) => setSelectedHackathonId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">-- Select a hackathon --</option>
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>

          {selectedHackathonId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Formats Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-black mb-4">File Format Requirements</h2>

                {formatFeedback && (
                  <div
                    className={`mb-4 p-3 rounded-lg border text-sm ${
                      formatFeedback.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {formatFeedback.message}
                  </div>
                )}

                {formatsLoading ? (
                  <p className="text-gray-600">Loading formats...</p>
                ) : fileFormats.length === 0 ? (
                  <p className="text-gray-600 mb-4">No file format requirements defined yet.</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {fileFormats.map((format) => (
                      <div key={format.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-black">{format.name}</h3>
                              {format.obligatory && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format.extension} • Max {Math.round(format.maxSizeKB / 1024)} MB
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => startEditFormat(format)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteFormat(format.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleFormatSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-black">
                    {editingFormatId ? 'Edit File Format' : 'Add New File Format'}
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formatFormData.name}
                      onChange={(e) => setFormatFormData((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="e.g., Training Data"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formatFormData.description}
                      onChange={(e) => setFormatFormData((prev) => ({ ...prev, description: e.target.value }))}
                      required
                      rows={2}
                      placeholder="Describe what this file should contain"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Extension</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formatFormData.extension}
                        onChange={(e) => setFormatFormData((prev) => ({ ...prev, extension: e.target.value }))}
                        required
                        placeholder=".csv"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Size (KB)</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formatFormData.maxSizeKB}
                        onChange={(e) => setFormatFormData((prev) => ({ ...prev, maxSizeKB: e.target.value }))}
                        required
                        min="1"
                        placeholder="51200"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="obligatory"
                      checked={formatFormData.obligatory}
                      onChange={(e) => setFormatFormData((prev) => ({ ...prev, obligatory: e.target.checked }))}
                    />
                    <label htmlFor="obligatory" className="text-sm text-gray-700">
                      Required file
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={createFormatMutation.isPending || updateFormatMutation.isPending}
                    >
                      {editingFormatId ? 'Update Format' : 'Add Format'}
                    </Button>
                    {editingFormatId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingFormatId(null);
                          setFormatFormData({
                            name: '',
                            description: '',
                            extension: '',
                            maxSizeKB: '',
                            obligatory: false,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>

              {/* Submissions Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-black mb-4">Submissions</h2>

                {submissionsLoading ? (
                  <p className="text-gray-600">Loading submissions...</p>
                ) : submissions.length === 0 ? (
                  <p className="text-gray-600">No submissions yet.</p>
                ) : (
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
                          <div>
                            <p className="font-semibold text-black">Team: {submission.team?.name ?? 'Unknown'}</p>
                            <p className="text-xs text-gray-500">
                              Submitted: {submission.sendAt ? new Date(submission.sendAt).toLocaleString() : 'Draft'}
                            </p>
                            {submission.score !== null && submission.score !== undefined && (
                              <p className="text-sm font-semibold text-green-700 mt-1">Score: {submission.score}</p>
                            )}
                          </div>
                          {submission.sendAt && !submission.score && (
                            <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                              Needs Scoring
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedSubmission && selectedSubmission.sendAt && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-black mb-3">Score Submission</h3>

                    {scoreFeedback && (
                      <div
                        className={`mb-4 p-3 rounded-lg border text-sm ${
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={scoreValue}
                          onChange={(e) => setScoreValue(e.target.value)}
                          required
                          placeholder="Enter score"
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
                        {scoreSubmissionMutation.isPending ? 'Submitting...' : 'Submit Score'}
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
