'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import { getSurveyByHackathonId, submitSurveyResponse } from '@/lib/services/mockData';
import type { Survey, SurveyQuestion } from '@/types';

export default function SurveyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  
  const [application, setApplication] = useState<any>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (applicationId) {
      const applications = JSON.parse(localStorage.getItem('applications') || '{}');
      const app = applications[applicationId];
      if (app) {
        setApplication(app);
        
        // Load survey for this hackathon
        const surveyData = getSurveyByHackathonId(app.challengeId);
        setSurvey(surveyData);
        
        // Initialize form data
        const initialData: Record<string, string> = {};
        surveyData.questions.forEach((q: SurveyQuestion) => {
          initialData[q.id] = '';
        });
        setFormData(initialData);
      }
    }
  }, [applicationId]);

  const handleChange = (questionId: string, value: string) => {
    setFormData({
      ...formData,
      [questionId]: value,
    });
    // Clear error for this field
    if (errors[questionId]) {
      setErrors({
        ...errors,
        [questionId]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    survey?.questions.forEach((question) => {
      const value = formData[question.id];
      
      if (question.required) {
        if (!value || !value.trim()) {
          newErrors[question.id] = 'To pole jest wymagane';
        }
      }
      
      if (value && question.validation) {
        const val = question.validation;
        
        if (val.minLength && value.length < val.minLength) {
          newErrors[question.id] = `Minimalna długość: ${val.minLength} znaków`;
        }
        if (val.maxLength && value.length > val.maxLength) {
          newErrors[question.id] = `Maksymalna długość: ${val.maxLength} znaków`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationId) {
      alert('Brak ID aplikacji');
      return;
    }
    
    if (!validateForm()) {
      alert('Proszę poprawić błędy w formularzu');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Mock API call
      if (survey) {
        await submitSurveyResponse(survey.id, parseInt(applicationId), formData);
      }
      
      const applications = JSON.parse(localStorage.getItem('applications') || '{}');
      
      if (applications[applicationId]) {
        const app = applications[applicationId];
        
        // Handle team code based on join mode
        let finalTeamCode = app.teamCode; // If joining existing team, keep the code
        let finalTeamName = app.teamName;
        
        if (app.joinMode === 'create') {
          // Generate NEW team code for team creators
          finalTeamCode = Math.floor(100000 + Math.random() * 900000).toString();
        } else if (app.joinMode === 'join') {
          // For joiners, find the team name from existing team
          const existingTeam = Object.values(applications).find(
            (a: any) => a.teamCode === app.teamCode && a.joinMode === 'create'
          ) as any;
          
          if (existingTeam) {
            finalTeamName = existingTeam.teamName;
          }
        }
        
        applications[applicationId] = {
          ...app,
          surveyCompleted: true,
          surveyData: formData,
          surveySubmittedAt: new Date().toISOString(),
          status: 'pending_approval',
          teamCode: finalTeamCode,
          teamName: finalTeamName,
        };

        localStorage.setItem('applications', JSON.stringify(applications));
      }

      setIsSubmitting(false);
      router.push(`/profile?tab=applications`);
    } catch (error) {
      console.error('Error submitting survey:', error);
      setIsSubmitting(false);
      alert('Wystąpił błąd podczas wysyłania ankiety');
    }
  };

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <p className="text-center text-gray-600">Ładowanie...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">Ankieta rejestracyjna</h1>
          <p className="text-gray-600 mb-4">
            Wypełnij ankietę, aby dokończyć proces rejestracji do: <strong>{application.challengeTitle}</strong>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {application.joinMode === 'create' ? (
              <>
                <p className="text-sm text-gray-700">
                  <strong>Tworzysz zespół:</strong> {application.teamName}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ⚠️ Zespół i 6-cyfrowy kod zostaną utworzone dopiero po prawidłowym wypełnieniu ankiety i akceptacji przez administratora
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700">
                  <strong>Dołączasz do zespołu</strong> (kod: {application.teamCode})
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ⚠️ Zostaniesz dodany do zespołu dopiero po prawidłowym wypełnieniu ankiety i akceptacji przez administratora
                </p>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">Pytania ankietowe</h2>

          {!survey ? (
            <p className="text-gray-600">Ładowanie ankiety...</p>
          ) : (
            <div className="space-y-6">
              {survey.questions.map((question, index) => (
                <div key={question.id}>
                  <label htmlFor={question.id} className="block text-sm font-medium text-gray-700 mb-2">
                    {index + 1}. {question.question} {question.required && '*'}
                  </label>
                  {question.description && (
                    <p className="text-xs text-gray-500 mb-2">{question.description}</p>
                  )}

                  {question.type === 'text' && (
                    <input
                      type="text"
                      id={question.id}
                      value={formData[question.id] || ''}
                      onChange={(e) => handleChange(question.id, e.target.value)}
                      required={question.required}
                      placeholder={question.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  )}

                  {question.type === 'textarea' && (
                    <textarea
                      id={question.id}
                      value={formData[question.id] || ''}
                      onChange={(e) => handleChange(question.id, e.target.value)}
                      required={question.required}
                      placeholder={question.placeholder}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  )}

                  {errors[question.id] && (
                    <p className="mt-1 text-sm text-red-600">{errors[question.id]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Wysyłam...' : 'Wyślij zgłoszenie'}
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            * Pola wymagane. Po wysłaniu ankiety, Twoje zgłoszenie zostanie przekazane do weryfikacji administratorów.
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
