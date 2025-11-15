'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Button from '@/lib/components/Button';
import Header from '@/lib/components/Header';
import Image from 'next/image';
import { 
  useRegisterStart, 
  useRegisterConfirm, 
  generateTotpQrCodeUrl,
  isValidUsername,
  isValidTotpCode 
} from '@/lib/hooks/useAuthMutations';

export default function SignUpPage() {
  const [step, setStep] = useState<'username' | 'qrcode' | 'verify'>('username');
  const [username, setUsername] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const registerStartMutation = useRegisterStart();
  const registerConfirmMutation = useRegisterConfirm();

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!isValidUsername(username)) {
      setError('Username must be at least 3 characters and contain only letters, numbers, hyphens, and underscores');
      return;
    }

    registerStartMutation.mutate(
      username,
      {
        onSuccess: (data) => {
          if (data && data.totpSecret) {
            setTotpToken(data.totpSecret);
            setQrCodeUrl(generateTotpQrCodeUrl(username, data.totpSecret));
            setStep('qrcode');
          }
        },
        onError: (mutationError: unknown) => {
          const message = mutationError instanceof Error ? mutationError.message : 'Failed to start registration';
          setError(message);
        },
      }
    );
  };

  const handleContinueToVerify = () => {
    setStep('verify');
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isValidTotpCode(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    registerConfirmMutation.mutate(
      { username, token: code },
      {
        onError: (mutationError: unknown) => {
          const message = mutationError instanceof Error ? mutationError.message : 'Invalid verification code';
          setError(message);
        },
      }
    );
  };

  const handleBackToUsername = () => {
    setStep('username');
    setCode('');
    setQrCodeUrl('');
    setTotpToken('');
    setError('');
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
            <h2 className="mt-6 text-center text-3xl font-bold text-black">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-[#7297c5] hover:text-[#5a7ba3]">
                Sign in
              </Link>
            </p>
          </div>

          {step === 'username' ? (
            <form className="mt-8 space-y-6" onSubmit={handleUsernameSubmit}>
              <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6 space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#7297c5] focus:border-[#7297c5] sm:text-sm"
                    placeholder="Choose a username"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={registerStartMutation.isPending}
                  >
                    {registerStartMutation.isPending ? 'Generating QR Code...' : 'Continue'}
                  </Button>
                </div>
              </div>
            </form>
          ) : step === 'qrcode' ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-black mb-4 text-center">
                  Set Up Two-Factor Authentication
                </h3>
                
                <div className="mb-4 text-sm text-gray-600 text-center">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </div>

                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                    {qrCodeUrl && (
                      <Image
                        src={qrCodeUrl}
                        alt="TOTP QR Code"
                        width={250}
                        height={250}
                        priority
                        unoptimized
                      />
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-xs text-gray-500 text-center mb-2">
                    Or enter this code manually:
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <code className="text-sm font-mono text-black">{totpToken}</code>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleContinueToVerify}
                  >
                    I&rsquo;ve Scanned the QR Code
                  </Button>
                  
                  <button
                    type="button"
                    onClick={handleBackToUsername}
                    className="w-full text-sm text-[#7297c5] hover:text-[#5a7ba3] font-medium"
                  >
                    ← Start Over
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleCodeSubmit}>
              <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-black mb-4 text-center">
                  Verify Your Authentication
                </h3>
                
                <div className="mb-4 text-sm text-gray-600 text-center">
                  Enter the 6-digit code from your authenticator app
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#7297c5] focus:border-[#7297c5] sm:text-sm tracking-widest text-center text-2xl font-mono"
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </div>

                {error && (
                  <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setStep('qrcode')}
                    className="text-sm text-[#7297c5] hover:text-[#5a7ba3] font-medium"
                  >
                    ← Back to QR Code
                  </button>
                </div>

                <div className="mt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={registerConfirmMutation.isPending || code.length !== 6}
                  >
                    {registerConfirmMutation.isPending ? 'Verifying...' : 'Complete Registration'}
                  </Button>
                </div>

                <div className="mt-4 text-center text-sm text-gray-500">
                  Enter the current code from your authenticator app
                </div>
              </div>
            </form>
          )}

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-[#7297c5]">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
