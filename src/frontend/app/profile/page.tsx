'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const [username, setUsername] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('username');
    const authToken = localStorage.getItem('authToken');
    
    if (!user || !authToken) {
      router.push('/login');
      return;
    }

    setUsername(user);
    setIsAuthenticated(true);

    // Load applications
    const apps = JSON.parse(localStorage.getItem('applications') || '{}');
    const userApps = Object.values(apps).filter((app: any) => app.username === user);
    setApplications(userApps);
  }, [router]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending_survey: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Wypełnij ankietę' },
      pending_approval: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Oczekuje na decyzję' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Zaakceptowane' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Odrzucone' },
    };

    const badge = badges[status] || badges.pending_survey;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    router.push('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black">{username}</h1>
                  <p className="text-gray-600">Uczestnik</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Wyloguj
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <Link
                  href="/profile?tab=overview"
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Przegląd
                </Link>
                <Link
                  href="/profile?tab=applications"
                  className={`px-6 py-4 font-medium transition-colors relative ${
                    activeTab === 'applications'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Moje zgłoszenia
                  {applications.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                      {applications.length}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile?tab=teams"
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'teams'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Zespoły
                </Link>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-4">Przegląd profilu</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-600 mb-2">Aktywne zgłoszenia</p>
                      <p className="text-4xl font-bold text-black">
                        {applications.filter(a => a.status === 'approved').length}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-600 mb-2">Oczekujące</p>
                      <p className="text-4xl font-bold text-black">
                        {applications.filter(a => a.status === 'pending_approval').length}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-600 mb-2">Wszystkie zgłoszenia</p>
                      <p className="text-4xl font-bold text-black">{applications.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'applications' && (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-6">Moje zgłoszenia do wyzwań</h2>
                  
                  {applications.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 mb-4">Nie masz jeszcze żadnych zgłoszeń</p>
                      <Link
                        href="/challenges"
                        className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors"
                      >
                        Przeglądaj wyzwania
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-black mb-2">
                                {app.challengeTitle}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>
                                  📅 {new Date(app.createdAt).toLocaleDateString('pl-PL')}
                                </span>
                                {app.participationType === 'team' && app.teamName && (
                                  <span>👥 Zespół: {app.teamName}</span>
                                )}
                                {app.participationType === 'solo' && (
                                  <span>🤝 Członek zespołu</span>
                                )}
                              </div>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>

                          {app.teamCode && app.participationType === 'team' && (
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-700">
                                    {app.joinMode === 'create' ? 'Kod Twojego zespołu:' : 'Kod zespołu:'}
                                  </p>
                                  <p className="text-2xl font-bold text-primary font-mono tracking-wider">
                                    {app.teamCode}
                                  </p>
                                  {app.joinMode === 'create' && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      Udostępnij ten kod członkom zespołu, aby mogli dołączyć
                                    </p>
                                  )}
                                  {app.joinMode === 'join' && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      Dołączyłeś do zespołu używając tego kodu
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(app.teamCode);
                                    alert('Kod skopiowany!');
                                  }}
                                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                                >
                                  Kopiuj
                                </button>
                              </div>
                            </div>
                          )}

                          {app.status === 'approved' && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                              <p className="text-green-800 font-medium">
                                ✓ Zgłoszenie zaakceptowane! Możesz teraz przesyłać rozwiązania.
                              </p>
                            </div>
                          )}

                          {app.status === 'rejected' && app.adminComment && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                              <p className="text-red-800 font-medium mb-2">Powód odrzucenia:</p>
                              <p className="text-red-700">{app.adminComment}</p>
                            </div>
                          )}

                          {app.surveyCompleted && app.surveyData && (
                            <details className="mb-4">
                              <summary className="cursor-pointer text-primary font-medium hover:text-primary-dark">
                                Zobacz wypełnioną ankietę
                              </summary>
                              <div className="mt-4 space-y-3 pl-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Doświadczenie:</p>
                                  <p className="text-gray-900">{app.surveyData.experience}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Motywacja:</p>
                                  <p className="text-gray-900">{app.surveyData.motivation}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Umiejętności:</p>
                                  <p className="text-gray-900">{app.surveyData.skills}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Dostępność:</p>
                                  <p className="text-gray-900">{app.surveyData.availability}</p>
                                </div>
                              </div>
                            </details>
                          )}

                          <div className="flex gap-3">
                            <Link
                              href={`/challenges/${app.challengeId}`}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                              Zobacz wyzwanie
                            </Link>
                            {app.status === 'pending_survey' && (
                              <Link
                                href={`/challenges/${app.challengeId}/survey?applicationId=${app.id}`}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors"
                              >
                                Wypełnij ankietę
                              </Link>
                            )}
                            {app.status === 'approved' && (
                              <Link
                                href={`/challenges/${app.challengeId}/submit`}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors"
                              >
                                Prześlij rozwiązanie
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'teams' && (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-4">Moje zespoły</h2>
                  <p className="text-gray-600">Funkcjonalność zarządzania zespołami będzie dostępna wkrótce.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
