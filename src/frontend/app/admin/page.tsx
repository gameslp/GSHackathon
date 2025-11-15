'use client';

import { useMemo, useState } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHackathonSurvey } from '@/lib/hooks/useTeams';
import {
  useHackathons,
  useHackathon,
  useCreateHackathon,
  useUpdateHackathon,
  useDeleteHackathon,
} from '@/lib/hooks/useHackathons';
import {
  useHackathonTeams,
  useTeamDetail,
  useAcceptTeam,
  useRejectTeam,
  useCreateSurveyQuestion,
  useUpdateSurveyQuestion,
  useDeleteSurveyQuestion,
} from '@/lib/hooks/useAdmin';
import type { Hackathon } from '@/lib/api/client';

const HACKATHON_LIMIT = 5;
const TEAM_LIMIT = 6;

type HackathonFormState = {
  title: string;
  description: string;
  rules: string;
  type: Hackathon['type'];
  prize: string;
  teamMin: string;
  teamMax: string;
  registrationOpen: string;
  startDate: string;
  endDate: string;
};

type SurveyQuestionListItem = {
  id?: number;
  question?: string;
  order?: number;
};

const typeOptions: { value: Hackathon['type']; label: string }[] = [
  { value: 'CLASSIFICATION', label: 'Classification' },
  { value: 'REGRESSION', label: 'Regression' },
  { value: 'NLP', label: 'NLP' },
  { value: 'COMPUTER_VISION', label: 'Computer Vision' },
  { value: 'TIME_SERIES', label: 'Time Series' },
  { value: 'OTHER', label: 'Other' },
];

const emptyForm: HackathonFormState = {
  title: '',
  description: '',
  rules: '',
  type: 'CLASSIFICATION',
  prize: '',
  teamMin: '',
  teamMax: '',
  registrationOpen: '',
  startDate: '',
  endDate: '',
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const toIso = (value: string) => (value ? new Date(value).toISOString() : undefined);

export default function AdminDashboardPage() {
  const { user, loading, error } = useAuth();

  const [hackathonPage, setHackathonPage] = useState(1);
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<HackathonFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const hackathonQueryParams = useMemo(
    () => ({ query: { page: hackathonPage, limit: HACKATHON_LIMIT } }),
    [hackathonPage]
  );
  const { data: hackathonList, isLoading: hackathonLoading, error: hackathonError } =
    useHackathons(hackathonQueryParams);
  const hackathons = useMemo(() => hackathonList?.hackathons ?? [], [hackathonList]);
  const hackathonPagination = hackathonList?.pagination;

  const activeHackathonId = useMemo(() => {
    if (isCreating) return null;
    if (selectedHackathonId && hackathons.some((h) => h.id === selectedHackathonId)) {
      return selectedHackathonId;
    }
    return hackathons[0]?.id ?? null;
  }, [hackathons, selectedHackathonId, isCreating]);

  const {
    data: hackathonDetail,
    isLoading: hackathonDetailLoading,
  } = useHackathon(activeHackathonId ?? 0);

  const [teamPageByHackathon, setTeamPageByHackathon] = useState<Record<number, number>>({});
  const currentTeamPage = activeHackathonId ? teamPageByHackathon[activeHackathonId] ?? 1 : 1;

  const { data: teamsResp, isLoading: teamsLoading } = useHackathonTeams(activeHackathonId ?? 0, {
    query: { page: currentTeamPage, limit: TEAM_LIMIT },
  });
  const teams = useMemo(() => teamsResp?.teams ?? [], [teamsResp]);
  const teamPagination = teamsResp?.pagination;

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const activeTeamId = useMemo(() => {
    if (selectedTeamId && teams.some((team) => team.id === selectedTeamId)) {
      return selectedTeamId;
    }
    return teams[0]?.id ?? null;
  }, [selectedTeamId, teams]);

  const {
    data: teamDetailResp,
    isLoading: teamDetailLoading,
  } = useTeamDetail(activeTeamId ?? 0);
  const teamDetail = teamDetailResp?.team;
  const isHackathonSelected = Boolean(activeHackathonId);

  const createMutation = useCreateHackathon();
  const updateMutation = useUpdateHackathon();
  const deleteMutation = useDeleteHackathon();
  const acceptTeam = useAcceptTeam();
  const rejectTeam = useRejectTeam();
  const { data: surveyData, isLoading: surveyLoading } = useHackathonSurvey(activeHackathonId ?? 0);
  const surveyQuestions = useMemo(() => (activeHackathonId ? surveyData?.questions ?? [] : []), [surveyData, activeHackathonId]);
  const createSurveyQuestionMutation = useCreateSurveyQuestion();
  const updateSurveyQuestionMutation = useUpdateSurveyQuestion();
  const deleteSurveyQuestionMutation = useDeleteSurveyQuestion();
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionOrder, setNewQuestionOrder] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<{ id: number; text: string; order: string } | null>(null);
  const [surveyFeedback, setSurveyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      title: hackathonDetail.title ?? '',
      description: hackathonDetail.description ?? '',
      rules: hackathonDetail.rules ?? '',
      type: hackathonDetail.type ?? 'CLASSIFICATION',
      prize: hackathonDetail.prize?.toString() ?? '',
      teamMin: hackathonDetail.teamMin?.toString() ?? '',
      teamMax: hackathonDetail.teamMax?.toString() ?? '',
      registrationOpen: toDateTimeLocal(hackathonDetail.registrationOpen),
      startDate: toDateTimeLocal(hackathonDetail.startDate),
      endDate: toDateTimeLocal(hackathonDetail.endDate),
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

    if (!formState.title.trim() || !formState.description.trim() || !formState.rules.trim()) {
      setFormError('Title, description, and rules are required.');
      return null;
    }

    if ([prize, teamMin, teamMax].some((value) => Number.isNaN(value))) {
      setFormError('Prize and team sizes must be valid numbers.');
      return null;
    }

    return {
      title: formState.title.trim(),
      description: formState.description.trim(),
      rules: formState.rules.trim(),
      type: formState.type ?? 'CLASSIFICATION',
      prize,
      teamMin,
      teamMax,
      registrationOpen: toIso(formState.registrationOpen) ?? new Date().toISOString(),
      startDate: toIso(formState.startDate) ?? new Date().toISOString(),
      endDate: toIso(formState.endDate) ?? new Date().toISOString(),
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
            setFormSuccess('Hackathon created successfully.');
            resetForm();
          },
          onError: (mutationError) => {
            setFormError(mutationError instanceof Error ? mutationError.message : 'Failed to create hackathon');
          },
        }
      );
    } else if (activeHackathonId) {
      updateMutation.mutate(
        { id: activeHackathonId, data: payload },
        {
          onSuccess: () => {
            setFormSuccess('Hackathon updated successfully.');
            setIsEditing(false);
          },
          onError: (mutationError) => {
            setFormError(mutationError instanceof Error ? mutationError.message : 'Failed to update hackathon');
          },
        }
      );
    }
  };

  const handleDelete = (hackathon: Hackathon) => {
    if (!hackathon.id) return;
    if (!window.confirm(`Delete hackathon "${hackathon.title}"? This action cannot be undone.`)) {
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
        alert(mutationError instanceof Error ? mutationError.message : 'Failed to delete hackathon');
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
      setSurveyFeedback({ type: 'error', message: 'Question text is required.' });
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
          setSurveyFeedback({ type: 'success', message: 'Question added.' });
          setNewQuestionText('');
          setNewQuestionOrder('');
        },
        onError: (mutationError) => {
          setSurveyFeedback({
            type: 'error',
            message: mutationError instanceof Error ? mutationError.message : 'Failed to add question',
          });
        },
      }
    );
  };

  const startEditQuestion = (question: SurveyQuestionListItem) => {
    if (!question.id) return;
    setEditingQuestion({
      id: question.id,
      text: question.question ?? '',
      order: question.order !== undefined ? String(question.order) : '',
    });
    setSurveyFeedback(null);
  };

  const handleEditSurveyQuestion = (event: React.FormEvent<HTMLFormElement>) => {
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
      setSurveyFeedback({ type: 'error', message: 'Provide question text or order.' });
      return;
    }

    updateSurveyQuestionMutation.mutate(
      { questionId: editingQuestion.id, hackathonId: activeHackathonId, payload },
      {
        onSuccess: () => {
          setSurveyFeedback({ type: 'success', message: 'Question updated.' });
          setEditingQuestion(null);
        },
        onError: (mutationError) => {
          setSurveyFeedback({
            type: 'error',
            message: mutationError instanceof Error ? mutationError.message : 'Failed to update question',
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
          setSurveyFeedback({ type: 'success', message: 'Question deleted.' });
          if (editingQuestion?.id === questionId) {
            setEditingQuestion(null);
          }
        },
        onError: (mutationError) => {
          setSurveyFeedback({
            type: 'error',
            message: mutationError instanceof Error ? mutationError.message : 'Failed to delete question',
          });
        },
      }
    );
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
            <p className="text-lg text-gray-700 mb-4">You must be signed in as an admin.</p>
            <Button variant="primary" href="/login">
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-yellow-200 rounded-lg p-12 text-center">
            <p className="text-lg text-gray-700">You do not have access to the admin dashboard.</p>
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
              <p className="text-gray-600">Manage hackathons, teams, and submissions.</p>
            </div>
            <Button variant="outline" onClick={startCreate}>
              + New Hackathon
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <section className="bg-white border border-gray-200 rounded-lg p-4 xl:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-black">Hackathons</h2>
                {hackathonPagination && (
                  <span className="text-xs text-gray-500">
                    Page {hackathonPagination.page} / {hackathonPagination.totalPages}
                  </span>
                )}
              </div>
              {hackathons.length === 0 ? (
                <p className="text-sm text-gray-600">No hackathons created yet.</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {hackathons.map((hackathon) => {
                    const isActive = hackathon.id === activeHackathonId;
                    return (
                      <button
                        key={hackathon.id}
                        onClick={() => handleHackathonSelect(hackathon)}
                        className={`w-full text-left p-3 rounded-lg border ${
                          isActive ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-semibold text-black">{hackathon.title}</p>
                        <p className="text-xs text-gray-500">
                          {hackathon.type} • {hackathon.teamMin}-{hackathon.teamMax} members
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>
                            Starts:{' '}
                            {hackathon.startDate
                              ? new Date(hackathon.startDate).toLocaleDateString()
                              : 'TBD'}
                          </span>
                          <span>•</span>
                          <span>${hackathon.prize?.toLocaleString() ?? 0} prize</span>
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
                    onClick={() => setHackathonPage((prev) => Math.max(1, prev - 1))}
                    disabled={hackathonPagination.page <= 1}
                    className="text-primary disabled:text-gray-400"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (
                        hackathonPagination.totalPages &&
                        hackathonPagination.page < hackathonPagination.totalPages
                      ) {
                        setHackathonPage((prev) => prev + 1);
                      }
                    }}
                    disabled={
                      !!hackathonPagination.totalPages &&
                      hackathonPagination.page >= hackathonPagination.totalPages
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
                        {isCreating ? 'Create new hackathon' : 'Edit hackathon'}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formState.title}
                          onChange={(event) => handleChange('title', event.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={formState.type}
                          onChange={(event) =>
                            handleChange('type', event.target.value as Hackathon['type'])
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {typeOptions.map((option) => (
                            <option key={option.value} value={option.value ?? 'CLASSIFICATION'}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formState.description}
                        onChange={(event) => handleChange('description', event.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rules</label>
                      <textarea
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formState.rules}
                        onChange={(event) => handleChange('rules', event.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prize (USD)</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formState.prize}
                          onChange={(event) => handleChange('prize', event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team min size</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formState.teamMin}
                          onChange={(event) => handleChange('teamMin', event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team max size</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formState.teamMax}
                          onChange={(event) => handleChange('teamMax', event.target.value)}
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
                          onChange={(event) => handleChange('registrationOpen', event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                        <input
                          type="datetime-local"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formState.startDate}
                          onChange={(event) => handleChange('startDate', event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                        <input
                          type="datetime-local"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formState.endDate}
                          onChange={(event) => handleChange('endDate', event.target.value)}
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
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {isCreating
                          ? createMutation.isPending
                            ? 'Creating...'
                            : 'Create hackathon'
                          : updateMutation.isPending
                          ? 'Saving...'
                          : 'Save changes'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {hackathonDetailLoading ? (
                      <p className="text-gray-600">Loading hackathon details...</p>
                    ) : !hackathonDetail ? (
                      <p className="text-gray-600">Select a hackathon to view its details.</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-black">{hackathonDetail.title}</h2>
                            <p className="text-sm text-gray-500">{hackathonDetail.type}</p>
                          </div>
                          <Button variant="outline" onClick={startEdit}>
                            Edit details
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">Prize pool</p>
                            <p className="text-2xl font-bold text-black">
                              ${hackathonDetail.prize?.toLocaleString() ?? 0}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">Team size</p>
                            <p className="text-2xl font-bold text-black">
                              {hackathonDetail.teamMin} - {hackathonDetail.teamMax}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">Registration opens</p>
                            <p className="text-sm text-black">
                              {hackathonDetail.registrationOpen
                                ? new Date(hackathonDetail.registrationOpen).toLocaleString()
                                : 'TBD'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-700">
                          <div>
                            <p className="font-semibold text-black mb-1">Description</p>
                            <p>{hackathonDetail.description}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-black mb-1">Rules</p>
                            <p>{hackathonDetail.rules}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-black">Survey questions</h3>
                        <p className="text-sm text-gray-500">Configure questions users must answer when joining.</p>
                      </div>
                    </div>
                    {!isHackathonSelected ? (
                      <p className="text-sm text-gray-600">Select a hackathon to manage survey questions.</p>
                    ) : surveyLoading ? (
                      <p className="text-sm text-gray-600">Loading survey questions...</p>
                    ) : (
                      <div className="space-y-4">
                        {surveyFeedback && (
                          <div
                            className={`text-sm rounded-lg px-3 py-2 border ${
                              surveyFeedback.type === 'success'
                                ? 'text-green-700 bg-green-50 border-green-200'
                                : 'text-red-700 bg-red-50 border-red-200'
                            }`}
                          >
                            {surveyFeedback.message}
                          </div>
                        )}
                        {surveyQuestions.length === 0 ? (
                          <p className="text-sm text-gray-600">No questions defined yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {surveyQuestions.map((question) => (
                              <div
                                key={question.id}
                                className="border border-gray-200 rounded-lg px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                              >
                                <div>
                                  <p className="font-medium text-black">{question.question}</p>
                                  <p className="text-xs text-gray-500">Order: {question.order ?? '-'} | ID: {question.id}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => startEditQuestion(question)}>
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => question.id && handleDeleteSurveyQuestion(question.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {editingQuestion && (
                          <form className="border border-gray-200 rounded-lg p-4 space-y-3" onSubmit={handleEditSurveyQuestion}>
                            <p className="text-sm font-semibold text-black">Edit question</p>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Question</label>
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={editingQuestion.text}
                                onChange={(event) =>
                                  setEditingQuestion((prev) => prev && { ...prev, text: event.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                              <input
                                type="number"
                                min={1}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={editingQuestion.order}
                                onChange={(event) =>
                                  setEditingQuestion((prev) => prev && { ...prev, order: event.target.value })
                                }
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" variant="primary" size="sm" disabled={updateSurveyQuestionMutation.isPending}>
                                {updateSurveyQuestionMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingQuestion(null)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        )}

                        <form className="border border-gray-200 rounded-lg p-4 space-y-3" onSubmit={handleAddSurveyQuestion}>
                          <p className="text-sm font-semibold text-black">Add question</p>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Question</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                              value={newQuestionText}
                              onChange={(event) => setNewQuestionText(event.target.value)}
                              disabled={createSurveyQuestionMutation.isPending}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Order (optional)</label>
                            <input
                              type="number"
                              min={1}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                              value={newQuestionOrder}
                              onChange={(event) => setNewQuestionOrder(event.target.value)}
                              disabled={createSurveyQuestionMutation.isPending}
                            />
                          </div>
                          <Button type="submit" variant="primary" size="sm" disabled={createSurveyQuestionMutation.isPending}>
                            {createSurveyQuestionMutation.isPending ? 'Adding...' : 'Add question'}
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-black">Teams</h3>
                        <p className="text-sm text-gray-500">
                          Review and manage teams participating in this hackathon.
                        </p>
                      </div>
                      {teamPagination && (
                        <span className="text-xs text-gray-500">
                          Page {teamPagination.page} / {teamPagination.totalPages}
                        </span>
                      )}
                    </div>
                    {activeHackathonId === null ? (
                      <p className="text-gray-600 text-sm">Create or select a hackathon to view teams.</p>
                    ) : teamsLoading ? (
                      <p className="text-gray-600 text-sm">Loading teams...</p>
                    ) : teams.length === 0 ? (
                      <p className="text-gray-600 text-sm">No teams have registered yet.</p>
                    ) : (
                      <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                            {teams.map((team) => (
                              <div
                                key={team.id}
                                className={`p-4 cursor-pointer ${
                                  team.id === activeTeamId ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                                }`}
                                onClick={() => setSelectedTeamId(team.id ?? null)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-black">{team.name}</p>
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
                                  <span>{team.memberCount ?? team.members?.length ?? 0} members</span>
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
                                onClick={() => goToTeamPage(teamPagination.page - 1)}
                                disabled={teamPagination.page <= 1}
                                className="text-primary disabled:text-gray-400"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    teamPagination.totalPages &&
                                    teamPagination.page < teamPagination.totalPages
                                  ) {
                                    goToTeamPage(teamPagination.page + 1);
                                  }
                                }}
                                disabled={
                                  !!teamPagination.totalPages &&
                                  teamPagination.page >= teamPagination.totalPages
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
                            <p className="text-sm text-gray-600">Loading team details...</p>
                          ) : !teamDetail ? (
                            <p className="text-sm text-gray-600">Select a team to view its detail.</p>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-lg font-semibold text-black">{teamDetail.name}</h4>
                                <p className="text-xs font-mono text-gray-500">
                                  Invitation: {teamDetail.invitationCode}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Members</p>
                                <div className="space-y-2">
                                  {teamDetail.members?.map((member) => (
                                    <div
                                      key={member.id}
                                      className="border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                                    >
                                      <div>
                                        <p className="font-medium text-black">{member.username}</p>
                                        <p className="text-xs text-gray-500">
                                          {member.name ? `${member.name} ${member.surname ?? ''}` : 'Profile incomplete'}
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
                              {teamDetail.memberResponses && teamDetail.memberResponses.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-sm font-medium text-gray-700">Survey responses</p>
                                  {teamDetail.memberResponses.map((entry) => (
                                    <div key={entry.member?.id} className="border border-gray-200 rounded-lg p-3">
                                      <p className="font-semibold text-black">{entry.member?.username}</p>
                                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                                        {entry.surveyResponses?.map((response) => (
                                          <div key={response.questionId}>
                                            <p className="font-medium text-gray-800">{response.question}</p>
                                            <p className="text-gray-600 whitespace-pre-line">{response.answer}</p>
                                          </div>
                                        ))}
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
