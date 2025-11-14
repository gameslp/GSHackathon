'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/lib/components/Button';
import Header from '@/lib/components/Header';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'username' | 'code'>('username');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('code');
    }, 500);
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Code must contain only digits');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (code === '123456') {
        localStorage.setItem('username', username);
        localStorage.setItem('authToken', 'demo-token-' + Date.now());
        window.dispatchEvent(new Event('auth-change'));
        router.push('/dashboard');
      } else {
        setError('Invalid code. Try 123456 for demo.');
      }
    }, 1000);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Link href="/" className="flex justify-center">
              <div className="flex items-center justify-center w-16 h-16 bg-[#7297c5] rounded-lg">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
            </Link>
            <h2 className="mt-6 text-center text-3xl font-bold text-black">Sign in to your account</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or <Link href="/signup" className="font-medium text-[#7297c5] hover:text-[#5a7ba3]">create a new account</Link>
            </p>
          </div>

          {step === 'username' ? (
            <form className="mt-8 space-y-6" onSubmit={handleUsernameSubmit}>
              <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input id="username" name="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#7297c5] focus:border-[#7297c5] sm:text-sm" placeholder="Enter your username" />
                </div>
                {error && <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
                <div className="mt-6">
                  <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>{loading ? 'Processing...' : 'Continue'}</Button>
                </div>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleCodeSubmit}>
              <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
                <div className="mb-4 text-sm text-gray-600">We've sent a 6-digit code to <strong>{username}</strong></div>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                  <input id="code" name="code" type="text" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#7297c5] focus:border-[#7297c5] sm:text-sm tracking-widest text-center text-2xl font-mono" placeholder="000000" autoComplete="one-time-code" />
                </div>
                {error && <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
                <div className="mt-4 text-center">
                  <button type="button" onClick={() => { setStep('username'); setCode(''); setError(''); }} className="text-sm text-[#7297c5] hover:text-[#5a7ba3] font-medium">← Change username</button>
                </div>
                <div className="mt-6">
                  <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading || code.length !== 6}>{loading ? 'Verifying...' : 'Verify & Sign In'}</Button>
                </div>
                <div className="mt-4 text-center text-sm text-gray-500">Demo: Use code <strong>123456</strong></div>
              </div>
            </form>
          )}

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-[#7297c5]">← Back to home</Link>
          </div>
        </div>
      </div>
    </>
  );
}
