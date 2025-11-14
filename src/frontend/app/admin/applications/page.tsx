'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [adminComment, setAdminComment] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('username');
    const authToken = localStorage.getItem('authToken');
    
    if (!user || !authToken) {
      router.push('/login');
      return;
    }

    // In production, check if user has admin role
    setIsAuthenticated(true);

    // Load all applications
    const apps = JSON.parse(localStorage.getItem('applications') || '{}');
    const allApps = Object.values(apps);
    setApplications(allApps);
  }, [router]);

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const handleApprove = (appId: number) => {
    const apps = JSON.parse(localStorage.getItem('applications') || '{}');
    
    if (apps[appId]) {
      apps[appId] = {
        ...apps[appId],
        status: 'approved',
        adminDecision: 'approved',
        adminDecisionAt: new Date().toISOString(),
        adminComment: adminComment || null,
      };

      localStorage.setItem('applications', JSON.stringify(apps));
      setApplications(Object.values(apps));
      setSelectedApp(null);
      setAdminComment('');
    }
  };

  const handleReject = (appId: number) => {
    if (!adminComment.trim()) {
      alert('Proszę podać powód odrzucenia');
      return;
    }

    const apps = JSON.parse(localStorage.getItem('applications') || '{}');
    
    if (apps[appId]) {
      apps[appId] = {
        ...apps[appId],
        status: 'rejected',
        adminDecision: 'rejected',
        adminDecisionAt: new Date().toISOString(),
        adminComment: adminComment,
      };

      localStorage.setItem('applications', JSON.stringify(apps));
      setApplications(Object.values(apps));
      setSelectedApp(null);
      setAdminComment('');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending_approval').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-black mb-6">Panel Administratora - Zgłoszenia</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-600 mb-2">Wszystkie</p>
              <p className="text-4xl font-bold text-black">{stats.total}</p>
            </div>
            <div className="bg-white border border-yellow-200 rounded-lg p-6">
              <p className="text-gray-600 mb-2">Oczekujące</p>
              <p className="text-4xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white border border-green-200 rounded-lg p-6">
              <p className="text-gray-600 mb-2">Zaakceptowane</p>
              <p className="text-4xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="bg-white border border-red-200 rounded-lg p-6">
              <p className="text-gray-600 mb-2">Odrzucone</p>
              <p className="text-4xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex gap-2">
              {['all', 'pending_approval', 'approved', 'rejected'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === f
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' && 'Wszystkie'}
                  {f === 'pending_approval' && 'Oczekujące'}
                  {f === 'approved' && 'Zaakceptowane'}
                  {f === 'rejected' && 'Odrzucone'}
                </button>
              ))}
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApplications.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-gray-600">Brak zgłoszeń do wyświetlenia</p>
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-black mb-2">
                        {app.challengeTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>👤 {app.username}</span>
                        <span>📅 {new Date(app.createdAt).toLocaleDateString('pl-PL')}</span>
                        {app.participationType === 'team' && (
                          <span>👥 Zespół: {app.teamName} (kod: {app.teamCode})</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        app.status === 'pending_approval'
                          ? 'bg-yellow-100 text-yellow-800'
                          : app.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {app.status === 'pending_approval' && 'Oczekuje'}
                      {app.status === 'approved' && 'Zaakceptowane'}
                      {app.status === 'rejected' && 'Odrzucone'}
                    </span>
                  </div>

                  {app.surveyData && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-black mb-3">Odpowiedzi z ankiety:</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Doświadczenie:</span>{' '}
                          <span className="text-gray-900">{app.surveyData.experience}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Dostępność:</span>{' '}
                          <span className="text-gray-900">{app.surveyData.availability} godzin/tydzień</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Motywacja:</span>{' '}
                          <p className="text-gray-900 mt-1">{app.surveyData.motivation}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Umiejętności:</span>{' '}
                          <p className="text-gray-900 mt-1">{app.surveyData.skills}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {app.status === 'pending_approval' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedApp(app.id === selectedApp ? null : app.id)}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors"
                      >
                        {selectedApp === app.id ? 'Anuluj' : 'Podejmij decyzję'}
                      </button>
                    </div>
                  )}

                  {selectedApp === app.id && (
                    <div className="mt-4 p-4 border-2 border-primary rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Komentarz (wymagany dla odrzucenia)
                      </label>
                      <textarea
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        rows={3}
                        placeholder="Wpisz komentarz..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                        >
                          ✓ Zaakceptuj
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                        >
                          ✗ Odrzuć
                        </button>
                      </div>
                    </div>
                  )}

                  {app.adminComment && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Komentarz administratora:</p>
                      <p className="text-gray-900">{app.adminComment}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
