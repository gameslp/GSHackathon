'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/lib/components/Button';
import Header from '@/lib/components/Header';
import { useLogin, isValidUsername, isValidTotpCode } from '@/lib/hooks/useAuthMutations';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'username' | 'code'>('username');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const defaultSuccessMessage = searchParams.get('registered') === 'true'
    ? 'Registration successful! Please log in with your credentials.'
    : '';
  const [successMessage, setSuccessMessage] = useState(defaultSuccessMessage);

  const loginMutation = useLogin();

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    if (!isValidUsername(username)) {
      setError('Please enter a valid username');
      return;
    }
    
    // Just move to next step - we verify everything together with the code
    setStep('code');
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isValidTotpCode(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    loginMutation.mutate(
      { username, token: code },
      {
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : 'Invalid credentials');
        },
      }
    );
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
                {successMessage && (
                  <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                    {successMessage}
                  </div>
                )}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input id="username" name="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#7297c5] focus:border-[#7297c5] sm:text-sm" placeholder="Enter your username" />
                </div>
                {error && <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
                <div className="mt-6">
                  <Button type="submit" variant="primary" size="lg" className="w-full">Continue</Button>
                </div>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleCodeSubmit}>
              <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
                <div className="mb-4 text-sm text-gray-600">Enter the 6-digit code from your authenticator app for <strong>{username}</strong></div>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                  <input id="code" name="code" type="text" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#7297c5] focus:border-[#7297c5] sm:text-sm tracking-widest text-center text-2xl font-mono" placeholder="000000" autoComplete="one-time-code" />
                </div>
                {error && <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
                <div className="mt-4 text-center">
                  <button type="button" onClick={() => { setStep('username'); setCode(''); setError(''); }} className="text-sm text-[#7297c5] hover:text-[#5a7ba3] font-medium">← Change username</button>
                </div>
                <div className="mt-6">
                  <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loginMutation.isPending || code.length !== 6}>{loginMutation.isPending ? 'Verifying...' : 'Verify & Sign In'}</Button>
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
