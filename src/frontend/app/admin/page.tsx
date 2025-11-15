"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type ReactNode, type FormEvent } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import AIAssistance from '@/lib/components/AIAssistance';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHackathonSurvey } from '@/lib/hooks/useTeams';
import {
  useHackathons,
  useHackathon,
  useCreateHackathon,
  useUpdateHackathon,
  useDeleteHackathon,
  useHackathonAutoTesting,
  useUploadAutoReviewScript,
  useDeleteAutoReviewScript,
} from '@/lib/hooks/useHackathons';
import {
  useHackathonTeams,
  useTeamDetail,
  useAcceptTeam,
  useRejectTeam,
  useCreateSurveyQuestion,
  useUpdateSurveyQuestion,
  useDeleteSurveyQuestion,
  useAdminUsers,
  useUpdateUserRole,
  useDeleteUser,
  useJudgeUsersList,
  useAssignJudgeToHackathon,
  useRemoveJudgeFromHackathon,
} from '@/lib/hooks/useAdmin';
import {
  useHackathonSubmissions,
  useSubmission,
  useScoreSubmission,
} from '@/lib/hooks/useSubmissions';
import {
  useUploadHackathonResource,
  useDeleteHackathonResource,
  useProvidedFiles,
  useUploadProvidedFile,
  useDeleteProvidedFile,
  useToggleProvidedFileVisibility,
  useUploadHackathonThumbnail,
} from "@/lib/hooks/useHackathonFiles";
import {
  useFileFormats,
  useCreateFileFormat,
  useUpdateFileFormat,
  useDeleteFileFormat,
} from "@/lib/hooks/useFileFormats";
import type { Hackathon } from "@/lib/api/client";

const HACKATHON_LIMIT = 5;
const TEAM_LIMIT = 6;
const USER_LIMIT = 10;

type HackathonFormState = {
  title: string;
  description: string;
  rules: string;
  type: Hackathon["type"];
  prize: string;
  teamMin: string;
  teamMax: string;
  registrationOpen: string;
  registrationClose: string;
  startDate: string;
  endDate: string;
  threadLimit: string;
  ramLimit: string;
  submissionTimeout: string;
  submissionLimit: string;
};

type SurveyQuestionListItem = {
  id?: number;
  question?: string;
  order?: number;
};

type HackathonJudgeAssignment = {
  id: number;
  judge?: {
    id: number;
    username: string;
    name?: string | null;
    surname?: string | null;
    email?: string | null;
  };
};

const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "JUDGE", label: "Judge" },
  { value: "PARTICIPANT", label: "Participant" },
] as const;

const typeOptions: { value: Hackathon["type"]; label: string }[] = [
  { value: "CLASSIFICATION", label: "Classification" },
  { value: "REGRESSION", label: "Regression" },
  { value: "NLP", label: "NLP" },
  { value: "COMPUTER_VISION", label: "Computer Vision" },
  { value: "TIME_SERIES", label: "Time Series" },
  { value: "OTHER", label: "Other" },
];

const emptyForm: HackathonFormState = {
  title: "",
  description: "",
  rules: "",
  type: "CLASSIFICATION",
  prize: "",
  teamMin: "",
  teamMax: "",
  registrationOpen: "",
  registrationClose: "",
  startDate: "",
  endDate: "",
  threadLimit: "",
  ramLimit: "",
  submissionTimeout: "",
  submissionLimit: "",
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const toIso = (value: string) =>
  value ? new Date(value).toISOString() : undefined;

export default function AdminDashboardPage() {
  const { user, loading, error } = useAuth();

  const [activeTab, setActiveTab] = useState<"hackathons" | "users">(
    "hackathons"
  );
  const [hackathonPage, setHackathonPage] = useState(1);
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<HackathonFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [userPage, setUserPage] = useState(1);
  const [roleChangeUserId, setRoleChangeUserId] = useState<number | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [selectedJudgeId, setSelectedJudgeId] = useState("");
  const [removingJudgeId, setRemovingJudgeId] = useState<number | null>(null);
  const [judgeFeedback, setJudgeFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceFileKey, setResourceFileKey] = useState(0);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [providedTitle, setProvidedTitle] = useState("");
  const [providedFileName, setProvidedFileName] = useState("");
  const [providedFile, setProvidedFile] = useState<File | null>(null);
  const [providedFileKey, setProvidedFileKey] = useState(0);
  const [providedPublic, setProvidedPublic] = useState(false);
  const [providedError, setProvidedError] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailInputKey, setThumbnailInputKey] = useState(0);
  const [thumbnailFeedback, setThumbnailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [selectedSubmissionReviewId, setSelectedSubmissionReviewId] = useState<number | null>(null);
  const [manualScoreValue, setManualScoreValue] = useState('');
  const [manualScoreComment, setManualScoreComment] = useState('');
  const [manualReviewFeedback, setManualReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [autoScriptFile, setAutoScriptFile] = useState<File | null>(null);
  const [autoScriptInputKey, setAutoScriptInputKey] = useState(0);
  const [autoScriptFeedback, setAutoScriptFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // File format management state
  const [formatFormData, setFormatFormData] = useState({
    name: "",
    description: "",
    extension: "",
    maxSizeKB: "",
    obligatory: false,
  });
  const [editingFormatId, setEditingFormatId] = useState<number | null>(null);
  const [formatFeedback, setFormatFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const getAssetUrl = (url?: string | null) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  };

  const hackathonQueryParams = useMemo(
    () => ({ query: { page: hackathonPage, limit: HACKATHON_LIMIT } }),
    [hackathonPage]
  );
  const {
    data: hackathonList,
    isLoading: hackathonLoading,
    error: hackathonError,
  } = useHackathons(hackathonQueryParams);
  const hackathons = useMemo(
    () => hackathonList?.hackathons ?? [],
    [hackathonList]
  );
  const hackathonPagination = hackathonList?.pagination;
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({
    query: { page: userPage, limit: USER_LIMIT },
  });
  const users = useMemo(() => usersData?.users ?? [], [usersData]);
  const userPagination = usersData?.pagination;
  const updateUserRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  const activeHackathonId = useMemo(() => {
    if (isCreating) return null;
    if (
      selectedHackathonId &&
      hackathons.some((h) => h.id === selectedHackathonId)
    ) {
      return selectedHackathonId;
    }
    return hackathons[0]?.id ?? null;
  }, [hackathons, selectedHackathonId, isCreating]);

  const { data: hackathonDetail, isLoading: hackathonDetailLoading } =
    useHackathon(activeHackathonId ?? 0);

  const [teamPageByHackathon, setTeamPageByHackathon] = useState<
    Record<number, number>
  >({});
  const currentTeamPage = activeHackathonId
    ? teamPageByHackathon[activeHackathonId] ?? 1
    : 1;

  const { data: teamsResp, isLoading: teamsLoading } = useHackathonTeams(
    activeHackathonId ?? 0,
    {
      query: { page: currentTeamPage, limit: TEAM_LIMIT },
    }
  );
  const teams = useMemo(() => teamsResp?.teams ?? [], [teamsResp]);
  const teamPagination = teamsResp?.pagination;

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const activeTeamId = useMemo(() => {
    if (selectedTeamId && teams.some((team) => team.id === selectedTeamId)) {
      return selectedTeamId;
    }
    return teams[0]?.id ?? null;
  }, [selectedTeamId, teams]);

  const { data: teamDetailResp, isLoading: teamDetailLoading } = useTeamDetail(
    activeTeamId ?? 0
  );
  const teamDetail = teamDetailResp?.team;
  const hasSurveyResponses = useMemo(() => {
    return (
      teamDetail?.memberResponses?.some(
        (entry) => entry.surveyResponses && entry.surveyResponses.length > 0
      ) ?? false
    );
  }, [teamDetail?.memberResponses]);
  const isHackathonSelected = Boolean(activeHackathonId);
  const createMutation = useCreateHackathon();
  const updateMutation = useUpdateHackathon();
  const autoReviewToggleMutation = useUpdateHackathon();
  const deleteMutation = useDeleteHackathon();
  const acceptTeam = useAcceptTeam();
  const rejectTeam = useRejectTeam();
  const { data: surveyData, isLoading: surveyLoading } = useHackathonSurvey(
    activeHackathonId ?? 0
  );
  const surveyQuestions = useMemo(
    () => (activeHackathonId ? surveyData?.questions ?? [] : []),
    [surveyData, activeHackathonId]
  );
  const createSurveyQuestionMutation = useCreateSurveyQuestion();
  const updateSurveyQuestionMutation = useUpdateSurveyQuestion();
  const deleteSurveyQuestionMutation = useDeleteSurveyQuestion();
  const { data: judgeOptions = [], isLoading: judgesLoading } =
    useJudgeUsersList();
  const assignJudgeMutation = useAssignJudgeToHackathon();
  const removeJudgeMutation = useRemoveJudgeFromHackathon();
  const uploadThumbnailMutation = useUploadHackathonThumbnail();
  const assignedJudges = useMemo(() => {
    const detailWithJudges = hackathonDetail as
      | (Hackathon & { judgeAssignments?: HackathonJudgeAssignment[] })
      | null;
    return detailWithJudges?.judgeAssignments ?? [];
  }, [hackathonDetail]);
  const availableJudges = useMemo(() => {
    return judgeOptions.filter(
      (judge) =>
        !assignedJudges.some((assignment) => assignment.judge?.id === judge.id)
    );
  }, [judgeOptions, assignedJudges]);
  const uploadResource = useUploadHackathonResource();
  const deleteResource = useDeleteHackathonResource();
  const {
    data: providedFiles = [],
    isLoading: providedFilesLoading,
    error: providedFilesError,
  } = useProvidedFiles(activeHackathonId ?? undefined, {
    enabled: Boolean(activeHackathonId),
  });
  const uploadProvided = useUploadProvidedFile();
  const deleteProvided = useDeleteProvidedFile();
  const toggleProvided = useToggleProvidedFileVisibility();
  const uploadAutoScriptMutation = useUploadAutoReviewScript();
  const deleteAutoScriptMutation = useDeleteAutoReviewScript();
  const scoreSubmissionMutation = useScoreSubmission();

  // File format hooks
  const { data: fileFormats = [], isLoading: formatsLoading } = useFileFormats(
    activeHackathonId ?? 0,
    {
      enabled: Boolean(activeHackathonId),
    }
  );
  const createFormatMutation = useCreateFileFormat();
  const updateFormatMutation = useUpdateFileFormat();
  const deleteFormatMutation = useDeleteFileFormat();

  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionOrder, setNewQuestionOrder] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<{ id: number; text: string; order: string } | null>(null);
  const [surveyFeedback, setSurveyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const {
    data: autoTestingData,
    isLoading: autoTestingLoading,
    error: autoTestingError,
  } = useHackathonAutoTesting(activeHackathonId ?? 0, { enabled: Boolean(activeHackathonId) });
  const {
    data: hackathonSubmissions = [],
    isLoading: hackathonSubmissionsLoading,
    error: hackathonSubmissionsError,
  } = useHackathonSubmissions(activeHackathonId ?? 0, { enabled: Boolean(activeHackathonId) });
  const finalizedSubmissions = useMemo(
    () => hackathonSubmissions.filter((submission) => Boolean(submission.sendAt)),
    [hackathonSubmissions]
  );
  const {
    data: reviewSubmissionDetail,
    isLoading: reviewSubmissionLoading,
  } = useSubmission(selectedSubmissionReviewId ?? 0, {
    enabled: Boolean(selectedSubmissionReviewId),
  });
  const autoTesting = autoTestingData;


  const resetForm = () => {
    setIsCreating(false);
    setIsEditing(false);
    setFormState(emptyForm);
    setFormError(null);
    setFormSuccess(null);
    setSelectedTeamId(null);
  };

  const startCreate = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedHackathonId(null);
    setFormState(emptyForm);
    setSelectedTeamId(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const startEdit = () => {
    if (!hackathonDetail) return;
    setIsEditing(true);
    setIsCreating(false);
    setFormState({
      title: hackathonDetail.title ?? "",
      description: hackathonDetail.description ?? "",
      rules: hackathonDetail.rules ?? "",
      type: hackathonDetail.type ?? "CLASSIFICATION",
      prize: hackathonDetail.prize?.toString() ?? "",
      teamMin: hackathonDetail.teamMin?.toString() ?? "",
      teamMax: hackathonDetail.teamMax?.toString() ?? "",
      registrationOpen: toDateTimeLocal(hackathonDetail.registrationOpen),
      registrationClose: toDateTimeLocal(hackathonDetail.registrationClose),
      startDate: toDateTimeLocal(hackathonDetail.startDate),
      endDate: toDateTimeLocal(hackathonDetail.endDate),
      threadLimit: hackathonDetail.threadLimit?.toString() ?? "",
      ramLimit: hackathonDetail.ramLimit?.toString() ?? "",
      submissionTimeout: hackathonDetail.submissionTimeout?.toString() ?? "",
      submissionLimit: hackathonDetail.submissionLimit?.toString() ?? "",
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleHackathonSelect = (hackathon: Hackathon) => {
    setSelectedHackathonId(hackathon.id ?? null);
    setIsCreating(false);
    setIsEditing(false);
    setSelectedTeamId(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleChange = (field: keyof HackathonFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const prize = Number(formState.prize);
    const teamMin = Number(formState.teamMin);
    const teamMax = Number(formState.teamMax);
    const threadLimit = formState.threadLimit
      ? Number(formState.threadLimit)
      : undefined;
    const ramLimit = formState.ramLimit
      ? Number(formState.ramLimit)
      : undefined;
    const submissionTimeout = formState.submissionTimeout
      ? Number(formState.submissionTimeout)
      : undefined;
    const submissionLimit = formState.submissionLimit
      ? Number(formState.submissionLimit)
      : undefined;

    if (
      !formState.title.trim() ||
      !formState.description.trim() ||
      !formState.rules.trim()
    ) {
      setFormError("Title, description, and rules are required.");
      return null;
    }

    if ([prize, teamMin, teamMax].some((value) => Number.isNaN(value))) {
      setFormError("Prize and team sizes must be valid numbers.");
      return null;
    }

    const numericExtras = [
      threadLimit,
      ramLimit,
      submissionTimeout,
      submissionLimit,
    ];
    if (
      numericExtras.some((value) => value !== undefined && Number.isNaN(value))
    ) {
      setFormError("Performance limits must be valid numbers.");
      return null;
    }

    return {
      title: formState.title.trim(),
      description: formState.description.trim(),
      rules: formState.rules.trim(),
      type: formState.type ?? "CLASSIFICATION",
      prize,
      teamMin,
      teamMax,
      registrationOpen:
        toIso(formState.registrationOpen) ?? new Date().toISOString(),
      registrationClose:
        toIso(formState.registrationClose) ??
        toIso(formState.startDate) ??
        new Date().toISOString(),
      startDate: toIso(formState.startDate) ?? new Date().toISOString(),
      endDate: toIso(formState.endDate) ?? new Date().toISOString(),
      threadLimit,
      ramLimit,
      submissionTimeout,
      submissionLimit,
    };
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const payload = buildPayload();
    if (!payload) return;

    if (isCreating) {
      createMutation.mutate(
        { body: payload },
        {
          onSuccess: () => {
            setFormSuccess("Hackathon created successfully.");
            resetForm();
          },
          onError: (mutationError) => {
            setFormError(
              mutationError instanceof Error
                ? mutationError.message
                : "Failed to create hackathon"
            );
          },
        }
      );
    } else if (activeHackathonId) {
      updateMutation.mutate(
        { id: activeHackathonId, data: payload },
        {
          onSuccess: () => {
            setFormSuccess("Hackathon updated successfully.");
            setIsEditing(false);
          },
          onError: (mutationError) => {
            setFormError(
              mutationError instanceof Error
                ? mutationError.message
                : "Failed to update hackathon"
            );
          },
        }
      );
    }
  };

  const handleDelete = (hackathon: Hackathon) => {
    if (!hackathon.id) return;
    if (
      !window.confirm(
        `Delete hackathon "${hackathon.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    deleteMutation.mutate(hackathon.id, {
      onSuccess: () => {
        if (hackathon.id === activeHackathonId) {
          resetForm();
          setSelectedHackathonId(null);
        }
      },
      onError: (mutationError) => {
        alert(
          mutationError instanceof Error
            ? mutationError.message
            : "Failed to delete hackathon"
        );
      },
    });
  };

  const handleAcceptTeam = (teamId: number) => {
    if (!activeHackathonId) return;
    acceptTeam.mutate({ teamId, hackathonId: activeHackathonId });
  };

  const handleRejectTeam = (teamId: number) => {
    if (!activeHackathonId) return;
    rejectTeam.mutate({ teamId, hackathonId: activeHackathonId });
  };

  const goToTeamPage = (nextPage: number) => {
    if (!activeHackathonId) return;
    setTeamPageByHackathon((prev) => ({
      ...prev,
      [activeHackathonId]: Math.max(1, nextPage),
    }));
    setSelectedTeamId(null);
  };

  const handleAddSurveyQuestion = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeHackathonId) return;

    const question = newQuestionText.trim();
    if (!question) {
      setSurveyFeedback({
        type: "error",
        message: "Question text is required.",
      });
      return;
    }

    setSurveyFeedback(null);
    createSurveyQuestionMutation.mutate(
      {
        hackathonId: activeHackathonId,
        question,
        order: newQuestionOrder ? Number(newQuestionOrder) : undefined,
      },
      {
        onSuccess: () => {
          setSurveyFeedback({ type: "success", message: "Question added." });
          setNewQuestionText("");
          setNewQuestionOrder("");
        },
        onError: (mutationError) => {
          setSurveyFeedback({
            type: "error",
            message:
              mutationError instanceof Error
                ? mutationError.message
                : "Failed to add question",
          });
        },
      }
    );
  };

  const startEditQuestion = (question: SurveyQuestionListItem) => {
    if (!question.id) return;
    setEditingQuestion({
      id: question.id,
      text: question.question ?? "",
      order: question.order !== undefined ? String(question.order) : "",
    });
    setSurveyFeedback(null);
  };

  const handleEditSurveyQuestion = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!editingQuestion || !activeHackathonId) return;

    const payload: { question?: string; order?: number } = {};
    if (editingQuestion.text.trim()) {
      payload.question = editingQuestion.text.trim();
    }
    if (editingQuestion.order) {
      payload.order = Number(editingQuestion.order);
    }

    if (!payload.question && payload.order === undefined) {
      setSurveyFeedback({
        type: "error",
        message: "Provide question text or order.",
      });
      return;
    }

    updateSurveyQuestionMutation.mutate(
      {
        questionId: editingQuestion.id,
        hackathonId: activeHackathonId,
        payload,
      },
      {
        onSuccess: () => {
          setSurveyFeedback({ type: "success", message: "Question updated." });
          setEditingQuestion(null);
        },
        onError: (mutationError) => {
          setSurveyFeedback({
            type: "error",
            message:
              mutationError instanceof Error
                ? mutationError.message
                : "Failed to update question",
          });
        },
      }
    );
  };

  const handleDeleteSurveyQuestion = (questionId: number) => {
    if (!activeHackathonId) return;
    deleteSurveyQuestionMutation.mutate(
      { questionId, hackathonId: activeHackathonId },
      {
        onSuccess: () => {
          setSurveyFeedback({ type: "success", message: "Question deleted." });
          if (editingQuestion?.id === questionId) {
            setEditingQuestion(null);
          }
        },
        onError: (mutationError) => {
          setSurveyFeedback({
            type: "error",
            message:
              mutationError instanceof Error
                ? mutationError.message
                : "Failed to delete question",
          });
        },
      }
    );
  };

  // File format handlers
  const handleFormatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHackathonId) return;

    const maxSizeKB = parseInt(formatFormData.maxSizeKB);
    if (isNaN(maxSizeKB) || maxSizeKB <= 0) {
      setFormatFeedback({
        type: "error",
        message: "Please enter a valid file size",
      });
      return;
    }

    if (!formatFormData.extension.startsWith(".")) {
      setFormatFeedback({
        type: "error",
        message: "Extension must start with a dot (e.g., .csv)",
      });
      return;
    }

    try {
      setFormatFeedback(null);

      if (editingFormatId) {
        await updateFormatMutation.mutateAsync({
          formatId: editingFormatId,
          hackathonId: activeHackathonId,
          data: {
            name: formatFormData.name,
            description: formatFormData.description,
            extension: formatFormData.extension,
            maxSizeKB,
            obligatory: formatFormData.obligatory,
          },
        });
        setFormatFeedback({
          type: "success",
          message: "File format updated successfully",
        });
        setEditingFormatId(null);
      } else {
        await createFormatMutation.mutateAsync({
          hackathonId: activeHackathonId,
          data: {
            name: formatFormData.name,
            description: formatFormData.description,
            extension: formatFormData.extension,
            maxSizeKB,
            obligatory: formatFormData.obligatory,
          },
        });
        setFormatFeedback({
          type: "success",
          message: "File format created successfully",
        });
      }

      setFormatFormData({
        name: "",
        description: "",
        extension: "",
        maxSizeKB: "",
        obligatory: false,
      });
    } catch (error) {
      setFormatFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to save file format",
      });
    }
  };

  const handleDeleteFormat = async (formatId: number) => {
    if (!activeHackathonId) return;
    if (!confirm("Are you sure you want to delete this file format?")) return;

    try {
      setFormatFeedback(null);
      await deleteFormatMutation.mutateAsync({
        formatId,
        hackathonId: activeHackathonId,
      });
      setFormatFeedback({
        type: "success",
        message: "File format deleted successfully",
      });
    } catch (error) {
      setFormatFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete file format",
      });
    }
  };

  const startEditFormat = (format: (typeof fileFormats)[0]) => {
    setEditingFormatId(format.id);
    setFormatFormData({
      name: format.name,
      description: format.description,
      extension: format.extension,
      maxSizeKB: String(format.maxSizeKB),
      obligatory: format.obligatory,
    });
  };

  const handleRoleChange = (
    userId: number,
    role: "ADMIN" | "JUDGE" | "PARTICIPANT"
  ) => {
    setRoleChangeUserId(userId);
    updateUserRoleMutation.mutate(
      { userId, role },
      {
        onSettled: () => {
          setRoleChangeUserId(null);
        },
      }
    );
  };

  const handleDeleteUserAccount = (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    setDeleteUserId(userId);
    deleteUserMutation.mutate(userId, {
      onSettled: () => setDeleteUserId(null),
    });
  };

  const handleAssignJudge = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeHackathonId) {
      setJudgeFeedback({
        type: "error",
        message: "Select a hackathon to assign judges.",
      });
      return;
    }
    if (!selectedJudgeId) {
      setJudgeFeedback({ type: "error", message: "Choose a judge to assign." });
      return;
    }
    setJudgeFeedback(null);
    assignJudgeMutation.mutate(
      { hackathonId: activeHackathonId, judgeId: Number(selectedJudgeId) },
      {
        onSuccess: () => {
          setSelectedJudgeId("");
          setJudgeFeedback({
            type: "success",
            message: "Judge assigned successfully.",
          });
        },
        onError: (mutationError) => {
          setJudgeFeedback({
            type: "error",
            message:
              mutationError instanceof Error
                ? mutationError.message
                : "Failed to assign judge",
          });
        },
      }
    );
  };

  const handleRemoveJudge = (judgeId: number) => {
    if (!activeHackathonId) return;
    setJudgeFeedback(null);
    setRemovingJudgeId(judgeId);
    removeJudgeMutation.mutate(
      { hackathonId: activeHackathonId, judgeId },
      {
        onSuccess: () => {
          setJudgeFeedback({ type: "success", message: "Judge removed." });
        },
        onSettled: () => {
          setRemovingJudgeId(null);
        },
        onError: (mutationError) => {
          setJudgeFeedback({
            type: "error",
            message:
              mutationError instanceof Error
                ? mutationError.message
                : "Failed to remove judge",
          });
        },
      }
    );
  };

  const handleResourceUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeHackathonId) {
      setResourceError("Select a hackathon to upload files.");
      return;
    }
    if (!resourceFile) {
      setResourceError("Choose a file to upload.");
      return;
    }
    setResourceError(null);
    uploadResource.mutate(
      {
        hackathonId: activeHackathonId,
        title: resourceTitle.trim() || resourceFile.name,
        file: resourceFile,
      },
      {
        onSuccess: () => {
          setResourceTitle("");
          setResourceFile(null);
          setResourceFileKey((key) => key + 1);
        },
        onError: (mutationError) => {
          setResourceError(
            mutationError instanceof Error
              ? mutationError.message
              : "Failed to upload resource"
          );
        },
      }
    );
  };

  const handleResourceDelete = (resourceId: number) => {
    if (!activeHackathonId) {
      setResourceError("Select a hackathon to manage resources.");
      return;
    }
    setResourceError(null);
    deleteResource.mutate(
      { hackathonId: activeHackathonId, resourceId },
      {
        onError: (mutationError) => {
          setResourceError(
            mutationError instanceof Error
              ? mutationError.message
              : "Failed to delete resource"
          );
        },
      }
    );
  };

  const handleProvidedUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeHackathonId) {
      setProvidedError("Select a hackathon to upload files.");
      return;
    }
    if (!providedFile) {
      setProvidedError("Choose a file to upload.");
      return;
    }
    if (!providedFileName.trim()) {
      setProvidedError("Enter a file name (e.g., train.csv, test.csv).");
      return;
    }
    setProvidedError(null);
    uploadProvided.mutate(
      {
        hackathonId: activeHackathonId,
        title: providedTitle.trim(),
        file: providedFile,
        name: providedFileName.trim(),
        isPublic: providedPublic,
      },
      {
        onSuccess: () => {
          setProvidedTitle("");
          setProvidedFileName("");
          setProvidedFile(null);
          setProvidedFileKey((key) => key + 1);
          setProvidedPublic(false);
        },
        onError: (mutationError) => {
          setProvidedError(
            mutationError instanceof Error
              ? mutationError.message
              : "Failed to upload file"
          );
        },
      }
    );
  };

  const handleProvidedDelete = (fileId: number) => {
    if (!activeHackathonId) {
      setProvidedError("Select a hackathon to manage files.");
      return;
    }
    setProvidedError(null);
    deleteProvided.mutate(
      { hackathonId: activeHackathonId, fileId },
      {
        onError: (mutationError) => {
          setProvidedError(
            mutationError instanceof Error
              ? mutationError.message
              : "Failed to delete file"
          );
        },
      }
    );
  };

  const handleThumbnailUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeHackathonId) {
      setThumbnailFeedback({
        type: "error",
        message: "Select a hackathon first.",
      });
      return;
    }
    if (!thumbnailFile) {
      setThumbnailFeedback({
        type: "error",
        message: "Choose an image to upload.",
      });
      return;
    }
    setThumbnailFeedback(null);
    uploadThumbnailMutation.mutate(
      { hackathonId: activeHackathonId, file: thumbnailFile },
      {
        onSuccess: () => {
          setThumbnailFeedback({
            type: "success",
            message: "Thumbnail updated.",
          });
          setThumbnailFile(null);
          setThumbnailInputKey((key) => key + 1);
        },
        onError: (mutationError) => {
          setThumbnailFeedback({
            type: "error",
            message:
              mutationError instanceof Error
                ? mutationError.message
                : "Failed to update thumbnail",
          });
        },
      }
    );
  };

  const handleProvidedToggle = (fileId: number) => {
    if (!activeHackathonId) {
      setProvidedError("Select a hackathon to manage files.");
      return;
    }
    setProvidedError(null);
    toggleProvided.mutate(
      { hackathonId: activeHackathonId, fileId },
      {
        onError: (mutationError) => {
          setProvidedError(
            mutationError instanceof Error
              ? mutationError.message
              : "Failed to update visibility"
          );
        },
      }
    );
  };

  const handleManualScoreSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSubmissionReviewId) {
      setManualReviewFeedback({ type: 'error', message: 'Select a submission to review.' });
      return;
    }

    const parsedScore = parseFloat(manualScoreValue);
    if (Number.isNaN(parsedScore) || parsedScore < 0) {
      setManualReviewFeedback({ type: 'error', message: 'Enter a valid non-negative score.' });
      return;
    }

    try {
      setManualReviewFeedback(null);
      await scoreSubmissionMutation.mutateAsync({
        submissionId: selectedSubmissionReviewId,
        score: parsedScore,
        scoreComment: manualScoreComment || undefined,
      });
      setManualReviewFeedback({ type: 'success', message: 'Review submitted successfully.' });
      setManualScoreValue('');
      setManualScoreComment('');
      setSelectedSubmissionReviewId(null);
    } catch (error) {
      setManualReviewFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit review.',
      });
    }
  };

  const handleAutoScriptUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeHackathonId) return;

    if (!autoScriptFile) {
      setAutoScriptFeedback({ type: 'error', message: 'Select a Python script to upload.' });
      return;
    }

    try {
      setAutoScriptFeedback(null);
      await uploadAutoScriptMutation.mutateAsync({
        hackathonId: activeHackathonId,
        file: autoScriptFile,
      });
      setAutoScriptFeedback({ type: 'success', message: 'Auto review script uploaded successfully.' });
      setAutoScriptFile(null);
      setAutoScriptInputKey((key) => key + 1);
    } catch (error) {
      setAutoScriptFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload script.',
      });
    }
  };

  const handleAutoScriptDelete = async () => {
    if (!activeHackathonId || !autoTesting?.script) return;
    if (!confirm('Remove the current auto review script? This will disable auto scoring.')) return;

    try {
      setAutoScriptFeedback(null);
      await deleteAutoScriptMutation.mutateAsync(activeHackathonId);
      setAutoScriptFeedback({ type: 'success', message: 'Auto review script removed.' });
    } catch (error) {
      setAutoScriptFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to remove script.',
      });
    }
  };

  const handleAutoScoringToggle = async (enable: boolean) => {
    if (!activeHackathonId) return;

    try {
      setAutoScriptFeedback(null);
      await autoReviewToggleMutation.mutateAsync({
        id: activeHackathonId,
        data: { autoScoringEnabled: enable },
      });
      setAutoScriptFeedback({
        type: 'success',
        message: enable ? 'Auto review enabled.' : 'Auto review disabled.',
      });
    } catch (error) {
      setAutoScriptFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update auto review settings.',
      });
    }
  };

  if (loading || hackathonLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Loading admin dashboard...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || hackathonError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-red-200 rounded-lg p-12 text-center text-red-600">
            {(error || hackathonError) as string}
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
            <p className="text-lg text-gray-700 mb-4">
              You must be signed in as an admin.
            </p>
            <Button variant="primary" href="/login">
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-yellow-200 rounded-lg p-12 text-center">
            <p className="text-lg text-gray-700">
              You do not have access to the admin dashboard.
            </p>
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
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
              <p className="text-gray-600">
                Manage hackathons, teams, and submissions.
              </p>
            </div>
            {activeTab === "hackathons" && (
              <Button variant="outline" onClick={startCreate}>
                + New Hackathon
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {["hackathons", "users"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "hackathons" | "users")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                  activeTab === tab
                    ? "bg-primary text-white border-primary"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab === "hackathons"
                  ? "Hackathon management"
                  : "User management"}
              </button>
            ))}
          </div>

          {activeTab === "hackathons" ? (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <section className="bg-white border border-gray-200 rounded-lg p-4 xl:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-black">
                    Hackathons
                  </h2>
                  {hackathonPagination && (
                    <span className="text-xs text-gray-500">
                      Page {hackathonPagination.page} /{" "}
                      {hackathonPagination.totalPages}
                    </span>
                  )}
                </div>
                {hackathons.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    No hackathons created yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {hackathons.map((hackathon) => {
                      const isActive = hackathon.id === activeHackathonId;
                      return (
                        <button
                          key={hackathon.id}
                          onClick={() => handleHackathonSelect(hackathon)}
                          className={`w-full text-left p-3 rounded-lg border ${
                            isActive
                              ? "border-primary bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <p className="font-semibold text-black">
                            {hackathon.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hackathon.type} • {hackathon.teamMin}-
                            {hackathon.teamMax} members
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>
                              Starts:{" "}
                              {hackathon.startDate
                                ? new Date(
                                    hackathon.startDate
                                  ).toLocaleDateString()
                                : "TBD"}
                            </span>
                            <span>•</span>
                            <span>
                              ${hackathon.prize?.toLocaleString() ?? 0} prize
                            </span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(hackathon);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {hackathonPagination && (
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <button
                      onClick={() =>
                        setHackathonPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={hackathonPagination.page <= 1}
                      className="text-primary disabled:text-gray-400"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        if (
                          hackathonPagination.totalPages &&
                          hackathonPagination.page <
                            hackathonPagination.totalPages
                        ) {
                          setHackathonPage((prev) => prev + 1);
                        }
                      }}
                      disabled={
                        !!hackathonPagination.totalPages &&
                        hackathonPagination.page >=
                          hackathonPagination.totalPages
                      }
                      className="text-primary disabled:text-gray-400"
                    >
                      Next
                    </button>
                  </div>
                )}
              </section>

              <section className="xl:col-span-3 space-y-6">
                {isCreating || isEditing ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-black">
                          {isCreating
                            ? "Create new hackathon"
                            : "Edit hackathon"}
                        </h2>
                        <p className="text-sm text-gray-500">
                          Provide the key details for the hackathon.
                        </p>
                      </div>
                      {formSuccess && (
                        <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-1">
                          {formSuccess}
                        </span>
                      )}
                    </div>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.title}
                            onChange={(event) =>
                              handleChange("title", event.target.value)
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={formState.type}
                            onChange={(event) =>
                              handleChange(
                                "type",
                                event.target.value as Hackathon["type"]
                              )
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {typeOptions.map((option) => (
                              <option
                                key={option.value}
                                value={option.value ?? "CLASSIFICATION"}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formState.description}
                          onChange={(event) =>
                            handleChange("description", event.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rules
                        </label>
                        <textarea
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formState.rules}
                          onChange={(event) =>
                            handleChange("rules", event.target.value)
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prize (USD)
                          </label>
                          <input
                            type="number"
                            min={0}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.prize}
                            onChange={(event) =>
                              handleChange("prize", event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Team min size
                          </label>
                          <input
                            type="number"
                            min={1}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.teamMin}
                            onChange={(event) =>
                              handleChange("teamMin", event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Team max size
                          </label>
                          <input
                            type="number"
                            min={1}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.teamMax}
                            onChange={(event) =>
                              handleChange("teamMax", event.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Registration opens
                          </label>
                          <input
                            type="datetime-local"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.registrationOpen}
                            onChange={(event) =>
                              handleChange(
                                "registrationOpen",
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start date
                          </label>
                          <input
                            type="datetime-local"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.startDate}
                            onChange={(event) =>
                              handleChange("startDate", event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End date
                          </label>
                          <input
                            type="datetime-local"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.endDate}
                            onChange={(event) =>
                              handleChange("endDate", event.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Registration closes
                          </label>
                          <input
                            type="datetime-local"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.registrationClose}
                            onChange={(event) =>
                              handleChange(
                                "registrationClose",
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Submission timeout (s)
                          </label>
                          <input
                            type="number"
                            min={0}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.submissionTimeout}
                            onChange={(event) =>
                              handleChange(
                                "submissionTimeout",
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Submission limit
                          </label>
                          <input
                            type="number"
                            min={0}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.submissionLimit}
                            onChange={(event) =>
                              handleChange(
                                "submissionLimit",
                                event.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thread limit
                          </label>
                          <input
                            type="number"
                            min={0}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.threadLimit}
                            onChange={(event) =>
                              handleChange("threadLimit", event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            RAM limit (GB)
                          </label>
                          <input
                            type="number"
                            min={0}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formState.ramLimit}
                            onChange={(event) =>
                              handleChange("ramLimit", event.target.value)
                            }
                          />
                        </div>
                      </div>

                      {formError && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                          {formError}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={
                            createMutation.isPending || updateMutation.isPending
                          }
                        >
                          {isCreating
                            ? createMutation.isPending
                              ? "Creating..."
                              : "Create hackathon"
                            : updateMutation.isPending
                            ? "Saving..."
                            : "Save changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={resetForm}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      {hackathonDetailLoading ? (
                        <p className="text-gray-600">
                          Loading hackathon details...
                        </p>
                      ) : !hackathonDetail ? (
                        <p className="text-gray-600">
                          Select a hackathon to view its details.
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h2 className="text-2xl font-bold text-black">
                                {hackathonDetail.title}
                              </h2>
                              <p className="text-sm text-gray-500">
                                {hackathonDetail.type}
                              </p>
                            </div>
                            <Button variant="outline" onClick={startEdit}>
                              Edit details
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500">
                                Prize pool
                              </p>
                              <p className="text-2xl font-bold text-black">
                                ${hackathonDetail.prize?.toLocaleString() ?? 0}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500">Team size</p>
                              <p className="text-2xl font-bold text-black">
                                {hackathonDetail.teamMin} -{" "}
                                {hackathonDetail.teamMax}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500">Start date</p>
                              <p className="text-2xl font-bold text-black">
                                {hackathonDetail.startDate
                                  ? new Date(
                                      hackathonDetail.startDate
                                    ).toLocaleString()
                                  : "TBD"}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500">End date</p>
                              <p className="text-2xl font-bold text-black">
                                {hackathonDetail.endDate
                                  ? new Date(hackathonDetail.endDate).toLocaleString()
                                  : "TBD"}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500">
                                Registration opens
                              </p>
                              <p className="text-2xl font-bold text-black">
                                {hackathonDetail.registrationOpen
                                  ? new Date(
                                      hackathonDetail.registrationOpen
                                    ).toLocaleString()
                                  : "TBD"}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500">
                                Registration closes
                              </p>
                              <p className="text-2xl font-bold text-black">
                                {hackathonDetail.registrationClose
                                  ? new Date(
                                      hackathonDetail.registrationClose
                                    ).toLocaleString()
                                  : "TBD"}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500">
                                Submission limit
                              </p>
                              <p className="text-2xl font-bold text-black">
                                {hackathonDetail.submissionLimit ?? "Unlimited"}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500">
                                Submission timeout (s)
                              </p>
                              <p className="text-2xl font-bold text-black">
                                {hackathonDetail.submissionTimeout ?? "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500">
                                Thread limit
                              </p>
                              <p className="text-2xl font-bold text-black">
                                {hackathonDetail.threadLimit ?? "N/A"}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500">
                                RAM limit (GB)
                              </p>
                              <p className="text-2xl font-bold text-black">
                                {hackathonDetail.ramLimit ?? "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500 mb-2">
                                Description
                              </p>
                              <p className="text-sm text-gray-700 whitespace-pre-line">
                                {hackathonDetail.description}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs text-gray-500 mb-2">
                                Rules
                              </p>
                              <p className="text-sm text-gray-700 whitespace-pre-line">
                                {hackathonDetail.rules}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-black">
                            Thumbnail image
                          </h3>
                          <p className="text-sm text-gray-500">
                            Upload a hero image to represent this hackathon.
                          </p>
                        </div>
                        {thumbnailFeedback && (
                          <span
                            className={`text-sm px-3 py-1 rounded-md border ${
                              thumbnailFeedback.type === "success"
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-red-50 border-red-200 text-red-700"
                            }`}
                          >
                            {thumbnailFeedback.message}
                          </span>
                        )}
                      </div>
                      {!isHackathonSelected ? (
                        <p className="text-sm text-gray-600">
                          Select a hackathon to manage thumbnails.
                        </p>
                      ) : (
                        <>
                          <div className="w-full aspect-video bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                            {hackathonDetail?.thumbnailUrl ? (
                              <img
                                src={
                                  getAssetUrl(hackathonDetail.thumbnailUrl) ?? ""
                                }
                                alt={`${hackathonDetail.title} thumbnail`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <p className="text-sm text-gray-600">
                                No thumbnail uploaded yet.
                              </p>
                            )}
                          </div>
                          <form
                            className="space-y-3"
                            onSubmit={handleThumbnailUpload}
                          >
                            <div>
                              {/* The label is now styled as a button */}
                              <label
                                htmlFor="thumbnail-upload-input"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                              >
                                Select image
                              </label>
                              {/* The file input is visually hidden */}
                              <input
                                id="thumbnail-upload-input"
                                key={thumbnailInputKey}
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event) =>
                                  setThumbnailFile(
                                    event.target.files?.[0] ?? null
                                  )
                                }
                              />
                              {thumbnailFile && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Selected: **{thumbnailFile.name}**
                                </p>
                              )}
                            </div>
                            <Button
                              type="submit"
                              variant="primary"
                              size="sm"
                              disabled={
                                uploadThumbnailMutation.isPending ||
                                !thumbnailFile
                              }
                            >
                              {uploadThumbnailMutation.isPending
                                ? "Uploading..."
                                : "Upload thumbnail"}
                            </Button>
                          </form>
                        </>
                      )}
                    </div>

                    <CollapsibleSection
                      title="Assigned judges"
                      description="Assign judges to review teams and submissions."
                    >
                      {judgeFeedback && (
                        <span
                          className={`text-sm px-3 py-1 rounded-md border ${
                            judgeFeedback.type === "success"
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          {judgeFeedback.message}
                        </span>
                      )}
                      {!isHackathonSelected ? (
                        <p className="text-sm text-gray-600">
                          Select a hackathon to manage assigned judges.
                        </p>
                      ) : judgesLoading ? (
                        <p className="text-sm text-gray-600">
                          Loading judges...
                        </p>
                      ) : (
                        <>
                          {assignedJudges.length === 0 ? (
                            <p className="text-sm text-gray-600">
                              {availableJudges.length > 0
                                ? "No judges assigned yet."
                                : "No judges assigned, and none are available."}
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {assignedJudges.map((assignment) => {
                                const judge = assignment.judge;
                                const initials =
                                  judge?.username?.slice(0, 2).toUpperCase() ||
                                  judge?.name?.[0]?.toUpperCase() ||
                                  "?";
                                return (
                                  <div
                                    key={assignment.id}
                                    className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-lg">
                                        {initials}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-black flex items-center gap-2">
                                          {judge?.username ?? "Unknown judge"}
                                          <span className="px-2 py-0.5 text-2xs bg-white border border-blue-100 text-blue-700 rounded-full">
                                            Judge
                                          </span>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {judge?.email ?? "No email provided"}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label={`Remove judge ${
                                        judge?.username ?? "Unknown judge"
                                      }`}
                                      onClick={() =>
                                        judge?.id &&
                                        handleRemoveJudge(judge.id)
                                      }
                                      disabled={
                                        !judge?.id ||
                                        (removingJudgeId === judge.id &&
                                          removeJudgeMutation.isPending)
                                      }
                                    >
                                      {removingJudgeId === judge?.id &&
                                      removeJudgeMutation.isPending
                                        ? "Removing..."
                                        : "Remove"}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Formularz wyświetlany tylko, gdy są dostępni sędziowie */}
                          {availableJudges.length > 0 && (
                            <form
                              className="border border-gray-200 rounded-lg p-4 space-y-3 relative z-10"
                              onSubmit={handleAssignJudge}
                            >
                              <div>
                                <label
                                  htmlFor="assign-judge-select"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Assign judge
                                </label>
                                <select
                                  id="assign-judge-select"
                                  value={selectedJudgeId}
                                  onChange={(event) =>
                                    setSelectedJudgeId(event.target.value)
                                  }
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 relative z-20"
                                >
                                  <option value="">Select judge</option>
                                  {availableJudges.map((judge) => (
                                    <option key={judge.id} value={judge.id}>
                                      {judge.username}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={
                                  assignJudgeMutation.isPending ||
                                  !selectedJudgeId
                                }
                              >
                                {assignJudgeMutation.isPending
                                  ? "Assigning..."
                                  : "Assign judge"}
                              </Button>
                            </form>
                          )}
                        </>
                      )}
                    </CollapsibleSection>
                  <CollapsibleSection
                    title="Manual reviews"
                    description="Score submissions from teams and leave feedback."
                    defaultOpen={false}
                  >
                    {!isHackathonSelected ? (
                      <p className="text-sm text-gray-600">Select a hackathon to review submissions.</p>
                    ) : hackathonSubmissionsLoading ? (
                      <p className="text-sm text-gray-600">Loading submissions...</p>
                    ) : hackathonSubmissionsError ? (
                      <p className="text-sm text-red-600">
                        {(hackathonSubmissionsError as Error).message ?? 'Failed to load submissions.'}
                      </p>
                    ) : finalizedSubmissions.length === 0 ? (
                      <p className="text-sm text-gray-600">No submissions have been finalized yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                          {finalizedSubmissions.map((submission) => {
                            const isSelected = submission.id === selectedSubmissionReviewId;
                            const teamName = submission.team?.name ?? `Team #${submission.teamId}`;
                            return (
                              <button
                                key={submission.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSubmissionReviewId(submission.id);
                                  setManualReviewFeedback(null);
                                  setManualScoreValue(
                                    submission.score !== null && submission.score !== undefined
                                      ? submission.score.toString()
                                      : ''
                                  );
                                  setManualScoreComment(submission.scoreComment ?? '');
                                }}
                                className={`w-full text-left border rounded-lg p-4 transition ${
                                  isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <p className="font-semibold text-black">{teamName}</p>
                                <p className="text-xs text-gray-500">
                                  Submitted:{' '}
                                  {submission.sendAt ? new Date(submission.sendAt).toLocaleString() : 'Draft'}
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
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                      Manual
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                          {!selectedSubmissionReviewId ? (
                            <p className="text-sm text-gray-600">Select a submission to start reviewing.</p>
                          ) : reviewSubmissionLoading ? (
                            <p className="text-sm text-gray-600">Loading submission details...</p>
                          ) : !reviewSubmissionDetail ? (
                            <p className="text-sm text-red-600">Unable to load the selected submission.</p>
                          ) : (
                            <>
                              <div className="space-y-1 text-sm text-gray-700">
                                <p className="font-semibold text-black">
                                  {reviewSubmissionDetail.team?.name ?? `Team #${reviewSubmissionDetail.teamId}`}
                                </p>
                                <p>
                                  Submitted:{' '}
                                  {reviewSubmissionDetail.sendAt
                                    ? new Date(reviewSubmissionDetail.sendAt).toLocaleString()
                                    : 'Draft'}
                                </p>
                                <p>
                                  Current status:{' '}
                                  {reviewSubmissionDetail.score !== null &&
                                  reviewSubmissionDetail.score !== undefined
                                    ? `Scored (${reviewSubmissionDetail.score})`
                                    : 'Awaiting review'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">Files</p>
                                {reviewSubmissionDetail.files && reviewSubmissionDetail.files.length > 0 ? (
                                  <ul className="space-y-1 text-sm">
                                    {reviewSubmissionDetail.files.map((file) => {
                                      const label =
                                        file.fileFormat?.name ??
                                        file.fileUrl?.split('/').pop() ??
                                        'File';
                                      const href = file.fileUrl?.startsWith('http')
                                        ? file.fileUrl
                                        : `${API_BASE_URL}${file.fileUrl}`;
                                      return (
                                        <li key={file.id} className="flex items-center justify-between gap-3">
                                          <span>{label}</span>
                                          <a
                                            href={href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary hover:underline text-xs"
                                          >
                                            Download
                                          </a>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-500">No files uploaded.</p>
                                )}
                              </div>
                              {reviewSubmissionDetail.files && 
                               reviewSubmissionDetail.files.some(file => 
                                 file.fileUrl?.toLowerCase().endsWith('.py')
                               ) && (
                                <AIAssistance
                                  submissionId={reviewSubmissionDetail.id}
                                  pythonFiles={reviewSubmissionDetail.files
                                    .filter(file => file.fileUrl?.toLowerCase().endsWith('.py'))
                                    .map(file => file.fileUrl?.split('/').pop() ?? 'unknown.py')}
                                />
                              )}
                              {manualReviewFeedback && (
                                <div
                                  className={`text-sm rounded-lg px-3 py-2 border ${
                                    manualReviewFeedback.type === 'success'
                                      ? 'text-green-700 bg-green-50 border-green-200'
                                      : 'text-red-700 bg-red-50 border-red-200'
                                  }`}
                                >
                                  {manualReviewFeedback.message}
                                </div>
                              )}
                              {!reviewSubmissionDetail.sendAt ? (
                                <p className="text-sm text-gray-600">
                                  Draft submissions cannot be reviewed. Ask the team to finalize their upload.
                                </p>
                              ) : (
                                <form className="space-y-3" onSubmit={handleManualScoreSubmit}>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                      value={manualScoreValue}
                                      onChange={(event) => setManualScoreValue(event.target.value)}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                                    <textarea
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                      rows={3}
                                      value={manualScoreComment}
                                      onChange={(event) => setManualScoreComment(event.target.value)}
                                      placeholder="Share feedback for the team (optional)."
                                    />
                                  </div>
                                  <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={scoreSubmissionMutation.isPending}
                                  >
                                    {scoreSubmissionMutation.isPending ? 'Saving...' : 'Save review'}
                                  </Button>
                                </form>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </CollapsibleSection>

                    <CollapsibleSection
                      title="Public resources"
                      description="Files visible to everyone on the challenge page."
                      defaultOpen={false}
                    >
                      {!isHackathonSelected ? (
                        <p className="text-sm text-gray-600">
                          Select a hackathon to manage resources.
                        </p>
                      ) : hackathonDetail?.resources &&
                        hackathonDetail.resources.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                          {hackathonDetail.resources.map((resource) => (
                            <li
                              key={resource.id}
                              className="flex flex-wrap items-center justify-between gap-3 py-3"
                            >
                              <div>
                                <p className="font-semibold text-black">
                                  {resource.title}
                                </p>
                                <a
                                  href={`${API_BASE_URL}${resource.url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  {resource.url}
                                </a>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleResourceDelete(resource.id)
                                }
                              >
                                Delete
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">
                          No resources uploaded yet.
                        </p>
                      )}
                      <form
                        className="border border-gray-200 rounded-lg p-4 space-y-3"
                        onSubmit={handleResourceUpload}
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={resourceTitle}
                            onChange={(event) =>
                              setResourceTitle(event.target.value)
                            }
                            placeholder="Dataset documentation"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            File
                          </label>
                          <label
                            htmlFor="resource-file-input"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                          >
                            Select file
                          </label>
                          <input
                            id="resource-file-input"
                            key={resourceFileKey}
                            type="file"
                            className="sr-only"
                            onChange={(event) =>
                              setResourceFile(event.target.files?.[0] ?? null)
                            }
                          />
                          {resourceFile && (
                            <p className="text-xs text-gray-500 mt-1">
                              Selected: <strong>{resourceFile.name}</strong>
                            </p>
                          )}
                        </div>
                        {resourceError && (
                          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {resourceError}
                          </div>
                        )}
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={uploadResource.isPending}
                        >
                          {uploadResource.isPending
                            ? "Uploading..."
                            : "Upload resource"}
                        </Button>
                      </form>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Participant files"
                      description="Files visible only to accepted teams when marked as public."
                      defaultOpen={false}
                    >
                      {!isHackathonSelected ? (
                        <p className="text-sm text-gray-600">
                          Select a hackathon to manage files.
                        </p>
                      ) : providedFilesLoading ? (
                        <p className="text-sm text-gray-600">
                          Loading files...
                        </p>
                      ) : providedFilesError ? (
                        <p className="text-sm text-red-600">
                          {providedFilesError instanceof Error
                            ? providedFilesError.message || "Failed to load files"
                            : "Failed to load files"}
                        </p>
                      ) : providedFiles.length === 0 ? (
                        <p className="text-sm text-gray-600">
                          No files uploaded yet.
                        </p>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {providedFiles.map((file) => (
                            <li
                              key={file.id}
                              className="py-3 flex flex-wrap items-center gap-3 justify-between text-sm"
                            >
                              <div>
                                <p className="font-semibold text-black">
                                  {file.title}
                                </p>
                                <p className="text-sm text-black mt-0.5">
                                  File name: <span className="font-semibold">{file.name}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {file.public
                                    ? "Visible to teams"
                                    : "Hidden from teams"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProvidedToggle(file.id)}
                                >
                                  {file.public ? "Hide" : "Publish"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleProvidedDelete(file.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <form
                        className="border border-gray-200 rounded-lg p-4 space-y-3"
                        onSubmit={handleProvidedUpload}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                              value={providedTitle}
                              onChange={(event) =>
                                setProvidedTitle(event.target.value)
                              }
                              placeholder="Baseline notebook"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              File Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                              value={providedFileName}
                              onChange={(event) =>
                                setProvidedFileName(event.target.value)
                              }
                              placeholder="train.csv"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Name as it will appear to participants
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Visibility
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={providedPublic}
                                onChange={(event) =>
                                  setProvidedPublic(event.target.checked)
                                }
                              />
                              <span className="text-sm text-gray-600">
                                Published to accepted teams
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            File
                          </label>
                          <label
                            htmlFor="provided-file-input"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                          >
                            Select file
                          </label>
                          <input
                            id="provided-file-input"
                            key={providedFileKey}
                            type="file"
                            className="sr-only"
                            onChange={(event) =>
                              setProvidedFile(event.target.files?.[0] ?? null)
                            }
                          />
                          {providedFile && (
                            <p className="text-xs text-gray-500 mt-1">
                              Selected: <strong>{providedFile.name}</strong>
                            </p>
                          )}
                        </div>
                        {providedError && (
                          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {providedError}
                          </div>
                        )}
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={uploadProvided.isPending}
                        >
                          {uploadProvided.isPending
                            ? "Uploading..."
                            : "Upload file"}
                        </Button>
                      </form>
                    </CollapsibleSection>
                    <CollapsibleSection
                    title="Auto review"
                    description="Upload and manage the automated grading script."
                    defaultOpen={false}
                  >
                    {!isHackathonSelected ? (
                      <p className="text-sm text-gray-600">Select a hackathon to configure auto review.</p>
                    ) : autoTestingLoading ? (
                      <p className="text-sm text-gray-600">Loading auto review settings...</p>
                    ) : autoTestingError ? (
                      <p className="text-sm text-red-600">
                        {(autoTestingError as Error).message ?? 'Failed to load auto review settings.'}
                      </p>
                    ) : (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2">How Auto Review Works</h4>
                          <div className="text-sm text-blue-800 space-y-2">
                            <p>
                              The auto review system runs your custom <code className="font-mono bg-blue-100 px-1 rounded">test-auto.py</code> script
                              in a secure sandboxed environment after each team submission. The script automatically evaluates submissions
                              and assigns scores based on your criteria.
                            </p>

                            <div className="mt-3">
                              <p className="font-semibold mb-1">Script Environment:</p>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><span className="font-medium">Python 3.11</span> with libraries: <code className="font-mono bg-blue-100 px-1 rounded text-xs">numpy</code>, <code className="font-mono bg-blue-100 px-1 rounded text-xs">pandas</code>, <code className="font-mono bg-blue-100 px-1 rounded text-xs">scikit-learn</code></li>
                                <li><span className="font-medium">Hackathon files:</span> All your provided files are available in <code className="font-mono bg-blue-100 px-1 rounded">/problem</code> directory</li>
                                <li><span className="font-medium">Submission files:</span> Team's submitted files are available in <code className="font-mono bg-blue-100 px-1 rounded">/submission</code> directory</li>
                                <li><span className="font-medium">Output:</span> Write results to <code className="font-mono bg-blue-100 px-1 rounded">/output</code> directory</li>
                              </ul>
                            </div>

                            <div className="mt-3">
                              <p className="font-semibold mb-1">Script Requirements:</p>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Must be named <code className="font-mono bg-blue-100 px-1 rounded">test-auto.py</code></li>
                                <li>Must output a numeric score (double between 0 and 100) (the script's responsibility to calculate and report)</li>
                                <li>Should not print to stdout anything else than solution score, stdout can be seen for participants</li>
                                <li>Should handle errors gracefully (missing files, invalid formats, etc.)</li>
                                <li>Runs with limited resources and timeout for security</li>
                              </ul>
                            </div>

                            <p className="mt-3 text-xs italic">
                              Example: Your script could load ground truth from <code className="font-mono bg-blue-100 px-1 rounded">/problem/test_labels.csv</code>,
                              read predictions from <code className="font-mono bg-blue-100 px-1 rounded">/submission/predictions.csv</code>,
                              and calculate accuracy score.
                            </p>
                          </div>
                        </div>

                        {autoScriptFeedback && (
                          <div
                            className={`text-sm rounded-lg px-3 py-2 border ${
                              autoScriptFeedback.type === 'success'
                                ? 'text-green-700 bg-green-50 border-green-200'
                                : 'text-red-700 bg-red-50 border-red-200'
                            }`}
                          >
                            {autoScriptFeedback.message}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-4 border border-gray-200 rounded-lg p-4">
                          <div>
                            <p className="text-sm font-semibold text-black">Status</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                                  autoTesting?.autoScoringAvailable
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                Script {autoTesting?.autoScoringAvailable ? 'uploaded' : 'missing'}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                                  autoTesting?.autoScoringEnabled
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}
                              >
                                Auto review {autoTesting?.autoScoringEnabled ? 'enabled' : 'disabled'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAutoScoringToggle(true)}
                              disabled={
                                !autoTesting?.autoScoringAvailable ||
                                autoTesting?.autoScoringEnabled ||
                                autoReviewToggleMutation.isPending
                              }
                            >
                              {autoReviewToggleMutation.isPending ? 'Saving...' : 'Enable auto review'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAutoScoringToggle(false)}
                              disabled={!autoTesting?.autoScoringEnabled || autoReviewToggleMutation.isPending}
                            >
                              Disable auto review
                            </Button>
                          </div>
                        </div>
                        {autoTesting?.script ? (
                          <div className="border border-gray-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-black">{autoTesting.script.title}</p>
                              <p className="text-xs text-gray-500">
                                Uploaded {new Date(autoTesting.script.uploadedAt).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">Runs as /problem/test-auto.py</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleAutoScriptDelete}
                              disabled={deleteAutoScriptMutation.isPending}
                            >
                              {deleteAutoScriptMutation.isPending ? 'Removing...' : 'Remove script'}
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">No script uploaded</p>
                            <p className="text-sm text-gray-600">
                              Upload a <code className="font-mono text-xs bg-gray-200 px-1 rounded">test-auto.py</code> script to enable automatic scoring.
                              Your script will run in an isolated Python environment after each team submission.
                            </p>
                          </div>
                        )}
                        <form className="border border-gray-200 rounded-lg p-4 space-y-3" onSubmit={handleAutoScriptUpload}>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Upload script (.py)
                            </label>
                            <input
                              key={autoScriptInputKey}
                              type="file"
                              accept=".py"
                              className="w-full text-sm text-gray-600"
                              onChange={(event) => setAutoScriptFile(event.target.files?.[0] ?? null)}
                            />
                            {autoScriptFile && (
                              <p className="text-xs text-gray-500 mt-1">Selected: {autoScriptFile.name}</p>
                            )}
                          </div>
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={uploadAutoScriptMutation.isPending}
                          >
                            {uploadAutoScriptMutation.isPending
                              ? 'Uploading...'
                              : autoTesting?.script
                              ? 'Replace script'
                              : 'Upload script'}
                          </Button>
                          <p className="text-xs text-gray-500">
                            The tester receives all uploaded submission files in <code className="font-mono">/submission</code>{' '}
                            and private provided files in <code className="font-mono">/problem</code>.
                          </p>
                        </form>
                      </>
                    )}
                  </CollapsibleSection>
                  <CollapsibleSection
                      title="Survey questions"
                      description="Configure questions users must answer when joining."
                      defaultOpen={false}
                    >
                      {!isHackathonSelected ? (
                        <p className="text-sm text-gray-600">
                          Select a hackathon to manage survey questions.
                        </p>
                      ) : surveyLoading ? (
                        <p className="text-sm text-gray-600">
                          Loading survey questions...
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {surveyFeedback && (
                            <div
                              className={`text-sm rounded-lg px-3 py-2 border ${
                                surveyFeedback.type === "success"
                                  ? "text-green-700 bg-green-50 border-green-200"
                                  : "text-red-700 bg-red-50 border-red-200"
                              }`}
                            >
                              {surveyFeedback.message}
                            </div>
                          )}
                          {surveyQuestions.length === 0 ? (
                            <p className="text-sm text-gray-600">
                              No questions defined yet.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {surveyQuestions.map((question) => (
                                <div
                                  key={question.id}
                                  className="border border-gray-200 rounded-lg px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                                >
                                  <div>
                                    <p className="font-medium text-black">
                                      {question.question}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Order: {question.order ?? "-"} | ID:{" "}
                                      {question.id}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        startEditQuestion(question)
                                      }
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        question.id &&
                                        handleDeleteSurveyQuestion(question.id)
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {editingQuestion && (
                            <form
                              className="border border-gray-200 rounded-lg p-4 space-y-3"
                              onSubmit={handleEditSurveyQuestion}
                            >
                              <p className="text-sm font-semibold text-black">
                                Edit question
                              </p>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Question
                                </label>
                                <input
                                  type="text"
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                  value={editingQuestion.text}
                                  onChange={(event) =>
                                    setEditingQuestion(
                                      (prev) =>
                                        prev && {
                                          ...prev,
                                          text: event.target.value,
                                        }
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Order
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                  value={editingQuestion.order}
                                  onChange={(event) =>
                                    setEditingQuestion(
                                      (prev) =>
                                        prev && {
                                          ...prev,
                                          order: event.target.value,
                                        }
                                    )
                                  }
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="submit"
                                  variant="primary"
                                  size="sm"
                                  disabled={
                                    updateSurveyQuestionMutation.isPending
                                  }
                                >
                                  {updateSurveyQuestionMutation.isPending
                                    ? "Saving..."
                                    : "Save"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingQuestion(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          )}

                          <form
                            className="border border-gray-200 rounded-lg p-4 space-y-3"
                            onSubmit={handleAddSurveyQuestion}
                          >
                            <p className="text-sm font-semibold text-black">
                              Add question
                            </p>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Question
                              </label>
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={newQuestionText}
                                onChange={(event) =>
                                  setNewQuestionText(event.target.value)
                                }
                                disabled={
                                  createSurveyQuestionMutation.isPending
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Order (optional)
                              </label>
                              <input
                                type="number"
                                min={1}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={newQuestionOrder}
                                onChange={(event) =>
                                  setNewQuestionOrder(event.target.value)
                                }
                                disabled={
                                  createSurveyQuestionMutation.isPending
                                }
                              />
                            </div>
                            <Button
                              type="submit"
                              variant="primary"
                              size="sm"
                              disabled={createSurveyQuestionMutation.isPending}
                            >
                              {createSurveyQuestionMutation.isPending
                                ? "Adding..."
                                : "Add question"}
                            </Button>
                          </form>
                        </div>
                      )}
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Submission file formats"
                      description="Define required and optional file format requirements for submissions."
                      defaultOpen={false}
                    >
                      {!isHackathonSelected ? (
                        <p className="text-sm text-gray-600">
                          Select a hackathon to manage file formats.
                        </p>
                      ) : formatsLoading ? (
                        <p className="text-sm text-gray-600">
                          Loading file formats...
                        </p>
                      ) : (
                        <div>
                          {formatFeedback && (
                            <div
                              className={`mb-4 p-3 rounded-lg border text-sm ${
                                formatFeedback.type === "success"
                                  ? "bg-green-50 border-green-200 text-green-700"
                                  : "bg-red-50 border-red-200 text-red-700"
                              }`}
                            >
                              {formatFeedback.message}
                            </div>
                          )}

                          {fileFormats.length === 0 ? (
                            <p className="text-sm text-gray-600 mb-4">
                              No file format requirements defined yet.
                            </p>
                          ) : (
                            <div className="space-y-3 mb-4">
                              {fileFormats.map((format) => (
                                <div
                                  key={format.id}
                                  className="border border-gray-200 rounded-lg p-4"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-black">
                                          {format.name}
                                        </h3>
                                        {format.obligatory && (
                                          <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded">
                                            Required
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {format.description}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {format.extension} • Max{" "}
                                        {Math.round(format.maxSizeKB / 1024)} MB
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => startEditFormat(format)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteFormat(format.id)
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <form
                            onSubmit={handleFormatSubmit}
                            className="border border-gray-200 rounded-lg p-4 space-y-3"
                          >
                            <p className="text-sm font-semibold text-black">
                              {editingFormatId
                                ? "Edit File Format"
                                : "Add New File Format"}
                            </p>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Name
                              </label>
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formatFormData.name}
                                onChange={(e) =>
                                  setFormatFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                required
                                placeholder="e.g., Predictions File"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formatFormData.description}
                                onChange={(e) =>
                                  setFormatFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                required
                                rows={2}
                                placeholder="Describe what this file should contain (minimum 10 characters)"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Extension
                                </label>
                                <input
                                  type="text"
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  value={formatFormData.extension}
                                  onChange={(e) =>
                                    setFormatFormData((prev) => ({
                                      ...prev,
                                      extension: e.target.value,
                                    }))
                                  }
                                  required
                                  placeholder=".csv"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Max Size (KB)
                                </label>
                                <input
                                  type="number"
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  value={formatFormData.maxSizeKB}
                                  onChange={(e) =>
                                    setFormatFormData((prev) => ({
                                      ...prev,
                                      maxSizeKB: e.target.value,
                                    }))
                                  }
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
                                onChange={(e) =>
                                  setFormatFormData((prev) => ({
                                    ...prev,
                                    obligatory: e.target.checked,
                                  }))
                                }
                              />
                              <label
                                htmlFor="obligatory"
                                className="text-sm text-gray-700"
                              >
                                Required file (participants must upload this to
                                submit)
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={
                                  createFormatMutation.isPending ||
                                  updateFormatMutation.isPending
                                }
                              >
                                {editingFormatId
                                  ? "Update Format"
                                  : "Add Format"}
                              </Button>
                              {editingFormatId && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingFormatId(null);
                                    setFormatFormData({
                                      name: "",
                                      description: "",
                                      extension: "",
                                      maxSizeKB: "",
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
                      )}
                    </CollapsibleSection>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-black">
                            Teams
                          </h3>
                          <p className="text-sm text-gray-500">
                            Review and manage teams participating in this
                            hackathon.
                          </p>
                        </div>
                        {teamPagination && (
                          <span className="text-xs text-gray-500">
                            Page {teamPagination.page} /{" "}
                            {teamPagination.totalPages}
                          </span>
                        )}
                      </div>
                      {activeHackathonId === null ? (
                        <p className="text-gray-600 text-sm">
                          Create or select a hackathon to view teams.
                        </p>
                      ) : teamsLoading ? (
                        <p className="text-gray-600 text-sm">
                          Loading teams...
                        </p>
                      ) : teams.length === 0 ? (
                        <p className="text-gray-600 text-sm">
                          No teams have registered yet.
                        </p>
                      ) : (
                        <div className="flex flex-col lg:flex-row gap-4">
                          <div className="flex-1">
                            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                              {teams.map((team) => (
                                <div
                                  key={team.id}
                                  className={`p-4 cursor-pointer ${
                                    team.id === activeTeamId
                                      ? "bg-blue-50"
                                      : "bg-white hover:bg-gray-50"
                                  }`}
                                  onClick={() =>
                                    setSelectedTeamId(team.id ?? null)
                                  }
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-black">
                                        {team.name}
                                      </p>
                                      <p className="text-xs text-gray-500 font-mono">
                                        Code: {team.invitationCode}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      {team.isAccepted ? (
                                        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-50 rounded-full">
                                          Accepted
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-50 rounded-full">
                                          Pending
                                        </span>
                                      )}
                                      {team.captainId === user.id && (
                                        <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-50 rounded-full">
                                          Captain
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
                                    <span>
                                      {team.memberCount ??
                                        team.members?.length ??
                                        0}{" "}
                                      members
                                    </span>
                                    {!team.isAccepted && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleAcceptTeam(team.id!);
                                          }}
                                        >
                                          Accept
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleRejectTeam(team.id!);
                                          }}
                                        >
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {teamPagination && (
                              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                                <button
                                  onClick={() =>
                                    goToTeamPage(teamPagination.page - 1)
                                  }
                                  disabled={teamPagination.page <= 1}
                                  className="text-primary disabled:text-gray-400"
                                >
                                  Previous
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      teamPagination.totalPages &&
                                      teamPagination.page <
                                        teamPagination.totalPages
                                    ) {
                                      goToTeamPage(teamPagination.page + 1);
                                    }
                                  }}
                                  disabled={
                                    !!teamPagination.totalPages &&
                                    teamPagination.page >=
                                      teamPagination.totalPages
                                  }
                                  className="text-primary disabled:text-gray-400"
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 border border-gray-200 rounded-lg p-4">
                            {teamDetailLoading ? (
                              <p className="text-sm text-gray-600">
                                Loading team details...
                              </p>
                            ) : !teamDetail ? (
                              <p className="text-sm text-gray-600">
                                Select a team to view its detail.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-lg font-semibold text-black">
                                    {teamDetail.name}
                                  </h4>
                                  <p className="text-xs font-mono text-gray-500">
                                    Invitation: {teamDetail.invitationCode}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-gray-700">
                                    Members
                                  </p>
                                  <div className="space-y-2">
                                    {teamDetail.members?.map((member) => (
                                      <div
                                        key={member.id}
                                        className="border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                                      >
                                        <div>
                                          <p className="font-medium text-black">
                                            {member.username}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {member.name
                                              ? `${member.name} ${
                                                  member.surname ?? ""
                                                }`
                                              : "Profile incomplete"}
                                          </p>
                                        </div>
                                        {member.id === teamDetail.captainId && (
                                          <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-50 rounded-full">
                                            Captain
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {hasSurveyResponses && (
                                  <div className="space-y-3">
                                    <p className="text-sm font-medium text-gray-700">
                                      Survey responses
                                    </p>
                                    {teamDetail.memberResponses.map((entry) => (
                                      <div
                                        key={entry.member?.id}
                                        className="border border-gray-200 rounded-lg p-3"
                                      >
                                        <p className="font-semibold text-black">
                                          {entry.member?.username}
                                        </p>
                                        <div className="mt-2 space-y-2 text-sm text-gray-700">
                                          {entry.surveyResponses?.map(
                                            (response) => (
                                              <div key={response.questionId}>
                                                <p className="font-medium text-gray-800">
                                                  {response.question}
                                                </p>
                                                <p className="text-gray-600 whitespace-pre-line">
                                                  {response.answer}
                                                </p>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    User management
                  </h2>
                  <p className="text-gray-600">
                    Review registered users, manage roles, or remove accounts.
                  </p>
                </div>
                {userPagination && (
                  <span className="text-sm text-gray-500">
                    Page {userPagination.page} / {userPagination.totalPages}
                  </span>
                )}
              </div>
              {usersLoading ? (
                <p className="text-sm text-gray-600">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-600">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-gray-600">
                        <th className="px-4 py-3 font-semibold">Username</th>
                        <th className="px-4 py-3 font-semibold">Role</th>
                        <th className="px-4 py-3 font-semibold">2FA</th>
                        <th className="px-4 py-3 font-semibold">Created</th>
                        <th className="px-4 py-3 font-semibold text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.filter((account) => account.id !== user.id).map((account) => {
                        const isRoleUpdating =
                          roleChangeUserId === account.id &&
                          updateUserRoleMutation.isPending;
                        const isRemoving =
                          deleteUserId === account.id &&
                          deleteUserMutation.isPending;
                        return (
                          <tr key={account.id}>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-black">
                                {account.username}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {account.id}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={account.role}
                                onChange={(event) =>
                                  handleRoleChange(
                                    account.id!,
                                    event.target.value as
                                      | "ADMIN"
                                      | "JUDGE"
                                      | "PARTICIPANT"
                                  )
                                }
                                disabled={isRoleUpdating}
                              >
                                {roleOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  account.totpConfirmed
                                    ? "bg-green-50 text-green-800"
                                    : "bg-yellow-50 text-yellow-800"
                                }`}
                              >
                                {account.totpConfirmed ? "Enabled" : "Pending"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {account.createdAt
                                ? new Date(
                                    account.createdAt
                                  ).toLocaleDateString()
                                : "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteUserAccount(account.id!)
                                }
                                disabled={isRemoving}
                              >
                                {isRemoving ? "Removing..." : "Delete"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {userPagination && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <button
                    onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                    disabled={userPagination.page <= 1}
                    className="text-primary disabled:text-gray-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (
                        userPagination.totalPages &&
                        userPagination.page < userPagination.totalPages
                      ) {
                        setUserPage((prev) => prev + 1);
                      }
                    }}
                    disabled={
                      !!userPagination.totalPages &&
                      userPagination.page >= userPagination.totalPages
                    }
                    className="text-primary disabled:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-black">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-sm font-semibold text-[#7297c5] hover:underline"
        >
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>
      {isOpen && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
}
