'use client';

import { useState, use, useEffect, useMemo, useCallback } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHackathon } from '@/lib/hooks/useHackathons';
import { useFileFormats } from '@/lib/hooks/useFileFormats';
import {
  useMyTeamSubmissions,
  useCreateSubmission,
  useSubmitSubmission,
  useSaveDraftSubmissionFiles,
} from '@/lib/hooks/useSubmissions';
import { useUploadSubmissionFile } from '@/lib/hooks/useHackathonFiles';

interface UploadedFile {
  fileFormatId: number;
  fileUrl: string;
  fileName: string;
}

const formatMaxSizeLabel = (kilobytes: number) => {
  if (kilobytes >= 1024) {
    return `${(kilobytes / 1024).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(kilobytes))} KB`;
};

export default function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const hackathonId = parseInt(resolvedParams.id);
  const { user } = useAuth();

  const { data: hackathon, isLoading: hackathonLoading } = useHackathon(hackathonId);
  const { data: fileFormats = [], isLoading: formatsLoading } = useFileFormats(hackathonId);
  const { data: mySubmissions = [] } = useMyTeamSubmissions(hackathonId, {
    enabled: !!hackathonId,
  });

  const createSubmissionMutation = useCreateSubmission();
  const submitSubmissionMutation = useSubmitSubmission();
  const uploadFileMutation = useUploadSubmissionFile();
  const saveDraftFilesMutation = useSaveDraftSubmissionFiles();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const draftSubmission = useMemo(
    () => mySubmissions.find((submission) => !submission.sendAt) ?? null,
    [mySubmissions]
  );

  const uploadedFileMap = useMemo(
    () => new Map(uploadedFiles.map((file) => [file.fileFormatId, file])),
    [uploadedFiles]
  );

  // Check submission limit
  const submittedCount = useMemo(() => mySubmissions.filter((s) => s.sendAt).length, [mySubmissions]);
  const submissionLimit = hackathon?.submissionLimit ?? 0;
  const canSubmit = !submissionLimit || submittedCount < submissionLimit;
  const persistDraftFiles = useCallback(
    (files: UploadedFile[]) => {
      if (!submissionId) return;

      saveDraftFilesMutation.mutate(
        {
          submissionId,
          hackathonId,
          files: files.map((file) => ({
            fileFormatId: file.fileFormatId,
            fileUrl: file.fileUrl,
          })),
        },
        {
          onError: (error) => {
            const message = error instanceof Error ? error.message : 'Failed to save draft files';
            setDraftSaveError(message);
          },
          onSuccess: () => setDraftSaveError(null),
        }
      );
    },
    [saveDraftFilesMutation, submissionId, hackathonId]
  );

  const updateFilesAndPersist = useCallback(
    (updater: (prev: UploadedFile[]) => UploadedFile[]) => {
      let nextState: UploadedFile[] = [];

      setUploadedFiles((prev) => {
        nextState = updater(prev);
        return nextState;
      });

      persistDraftFiles(nextState);
    },
    [persistDraftFiles]
  );

  const handleCreateSubmission = useCallback(async () => {
    if (!hackathonId) return;
    try {
      setGeneralError(null);
      const result = await createSubmissionMutation.mutateAsync(hackathonId);
      setSubmissionId(result.submissionId);
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Failed to create submission');
    }
  }, [hackathonId, createSubmissionMutation]);

  // Check if all obligatory files are uploaded
  const obligatoryFormats = fileFormats.filter((f) => f.obligatory);
  const allObligatoryUploaded = obligatoryFormats.every((format) =>
    uploadedFiles.some((file) => file.fileFormatId === format.id)
  );

  // Auto-create draft on page load
  useEffect(() => {
    if (draftSubmission?.id) {
      setSubmissionId(draftSubmission.id);
      setIsSubmitted(false);
      return;
    }

    if (!submissionId && canSubmit && !createSubmissionMutation.isPending) {
      handleCreateSubmission();
    }
  }, [draftSubmission, submissionId, canSubmit, createSubmissionMutation.isPending, handleCreateSubmission]);

  useEffect(() => {
    if (!draftSubmission) {
      setUploadedFiles((prev) => (prev.length ? [] : prev));
      return;
    }

    const normalizedFiles = (draftSubmission.files ?? []).map((file) => {
      const relatedFormat = fileFormats.find((format) => format.id === file.fileFormatId);
      return {
        fileFormatId: file.fileFormatId,
        fileUrl: file.fileUrl,
        fileName: relatedFormat?.name || file.fileUrl.split('/').pop() || 'File',
      };
    });

    setUploadedFiles((prev) => {
      if (
        prev.length === normalizedFiles.length &&
        prev.every((file) =>
          normalizedFiles.some(
            (serverFile) =>
              serverFile.fileFormatId === file.fileFormatId && serverFile.fileUrl === file.fileUrl
          )
        )
      ) {
        return prev;
      }
      return normalizedFiles;
    });
  }, [draftSubmission, fileFormats]);

  const draftReady = Boolean(submissionId);

  const disableFinalize =
    submitSubmissionMutation.isPending ||
    !allObligatoryUploaded ||
    !submissionId ||
    uploadedFiles.length === 0 ||
    !canSubmit;

  const finalizeHelperText = !canSubmit
    ? 'Submission limit reached.'
    : !submissionId
    ? 'Draft is being prepared...'
    : !allObligatoryUploaded
    ? 'Upload all required files to submit.'
    : uploadedFiles.length === 0
    ? 'Upload at least one file to submit.'
    : 'All set! Finalize when ready.';

  const handleFileChange = async (formatId: number, file: File | null) => {
    if (!submissionId) {
      setUploadErrors((prev) => ({
        ...prev,
        [formatId]: 'Draft is preparing. Please wait a moment and try again.',
      }));
      return;
    }

    const format = fileFormats.find((f) => f.id === formatId);
    if (!format) return;

    if (!file) {
      updateFilesAndPersist((prev) => prev.filter((f) => f.fileFormatId !== formatId));
      setUploadErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[formatId];
        return newErrors;
      });
      return;
    }

    // Validate file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== format.extension.toLowerCase()) {
      setUploadErrors((prev) => ({
        ...prev,
        [formatId]: `File must have ${format.extension} extension`,
      }));
      return;
    }

    // Validate file size
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > format.maxSizeKB) {
      setUploadErrors((prev) => ({
        ...prev,
        [formatId]: `File size exceeds ${format.maxSizeKB} KB limit`,
      }));
      return;
    }

    setUploadErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[formatId];
      return newErrors;
    });

    // Upload file
    try {
      const uploadedUrl = await uploadFileMutation.mutateAsync({
        hackathonId,
        file,
        formatId,
      });

      updateFilesAndPersist((prev) => {
        const filtered = prev.filter((f) => f.fileFormatId !== formatId);
        return [...filtered, { fileFormatId: formatId, fileUrl: uploadedUrl, fileName: file.name }];
      });
    } catch (error) {
      setUploadErrors((prev) => ({
        ...prev,
        [formatId]: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  };


  const handleFinalizeSubmission = async () => {
    if (!submissionId) {
      setGeneralError('No submission found. Please refresh the page.');
      return;
    }

    if (!allObligatoryUploaded) {
      setGeneralError('Please upload all required files before submitting.');
      return;
    }

    if (uploadedFiles.length === 0) {
      setGeneralError('Please upload at least one file before submitting.');
      return;
    }

    try {
      setGeneralError(null);
      await submitSubmissionMutation.mutateAsync({
        hackathonId,
        submissionId,
        files: uploadedFiles.map((f) => ({ fileFormatId: f.fileFormatId, fileUrl: f.fileUrl })),
      });
      setIsSubmitted(true);
      setSuccessMessage('Submission finalized successfully!');
      setUploadedFiles([]);
      setUploadErrors({});
      setDraftSaveError(null);
      setSubmissionId(null);
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Failed to submit');
    }
  };

  const handleNewSubmission = () => {
    // Reset state for new submission
    setUploadedFiles([]);
    setUploadErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setDraftSaveError(null);
    setSubmissionId(null);
    setIsSubmitted(false);
    // This will trigger the useEffect to create a new draft
  };

  if (hackathonLoading || formatsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Loading submission page...
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
            <p className="text-lg text-gray-700 mb-4">You must be signed in to submit.</p>
            <Button variant="primary" href="/login">
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-red-600">
            Hackathon not found
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black">{hackathon.title}</h1>
                <p className="text-gray-600 mt-1">Submit your solution</p>
                {submissionLimit > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Submissions: {submittedCount} / {submissionLimit}
                  </p>
                )}
              </div>
              <Button variant="outline" href={`/challenges/${hackathonId}`}>
                Back to Challenge
              </Button>
            </div>
          </div>

          {/* Submission limit reached */}
          {!canSubmit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900">Submission Limit Reached</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You have reached the maximum number of submissions ({submissionLimit}) for this hackathon.
              </p>
              <Button variant="outline" href={`/challenges/${hackathonId}`} className="mt-4">
                Back to Challenge
              </Button>
            </div>
          )}

          {draftSubmission && !isSubmitted && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-sm text-blue-800">
              <p className="font-semibold text-blue-900">Draft in progress</p>
              <p className="mt-1">
                You last saved this draft on{' '}
                {draftSubmission.createdAt
                  ? new Date(draftSubmission.createdAt).toLocaleString()
                  : 'an earlier session'}
                . Upload files and finalize whenever you’re ready.
              </p>
            </div>
          )}

          {/* Submission Status */}
          {isSubmitted && canSubmit && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Submission Complete!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your submission has been successfully submitted and is pending review.
                    </p>
                  </div>
                </div>
                {(!submissionLimit || submittedCount + 1 < submissionLimit) && (
                  <Button variant="primary" onClick={handleNewSubmission}>
                    Submit Another
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          {generalError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{generalError}</div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">{successMessage}</div>
          )}

          {/* File Upload Section */}
          {canSubmit && !isSubmitted && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">Upload Files</h2>
              {!draftReady && (
                <p className="text-sm text-gray-500 mb-4">
                  Preparing your draft submission. This usually takes a second.
                </p>
              )}
              {draftSaveError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  {draftSaveError}
                </div>
              )}
              {fileFormats.length === 0 ? (
                <p className="text-gray-600">No file format requirements specified for this hackathon.</p>
              ) : (
                <div className="space-y-6">
                  {fileFormats.map((format) => {
                    const uploadedFile = uploadedFileMap.get(format.id);
                    const error = uploadErrors[format.id];
                    const statusText = uploadedFile
                      ? `Uploaded ${uploadedFile.fileName}`
                      : 'Awaiting upload';

                  return (
                    <div key={format.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-black">{format.name}</h3>
                            {format.obligatory ? (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded">
                                Required
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded">
                                Optional
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Extension: {format.extension} • Max size: {formatMaxSizeLabel(format.maxSizeKB)}
                          </p>
                        </div>
                        <div className="text-sm">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              uploadedFile ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {uploadedFile ? 'Uploaded' : format.obligatory ? 'Pending' : 'Optional'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="file"
                            accept={format.extension}
                            onChange={(e) => handleFileChange(format.id, e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-600"
                            disabled={isSubmitted || !draftReady}
                          />
                          {uploadedFile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFileChange(format.id, null)}
                              className="px-3"
                              disabled={!draftReady}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <p className={`text-xs ${uploadedFile ? 'text-green-700' : 'text-gray-500'}`}>
                          {statusText}
                        </p>
                        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {/* Actions */}
          {canSubmit && !isSubmitted && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant="primary"
                  onClick={handleFinalizeSubmission}
                  disabled={disableFinalize}
                >
                  {submitSubmissionMutation.isPending ? 'Submitting...' : 'Finalize Submission'}
                </Button>
                <p className="text-sm text-gray-600">{finalizeHelperText}</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
