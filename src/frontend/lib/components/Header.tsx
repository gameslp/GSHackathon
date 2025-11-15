'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

const Header = () => {
  const { user, loading, logout, isLoggingOut } = useAuth();
  const initials = useMemo(() => user?.username?.charAt(0).toUpperCase() ?? 'H', [user?.username]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-[#7297c5] rounded-lg">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-xl font-bold text-black">HackathonHub</span>
          </Link>
          
          {/* Navigation - Center */}
          <nav className="hidden md:flex items-center space-x-8 mx-auto">
            <Link 
              href="/challenges" 
              className="text-black hover:text-[#7297c5] font-medium transition-colors"
            >
              Challenges
            </Link>
            <Link 
              href="/learn" 
              className="text-black hover:text-[#7297c5] font-medium transition-colors"
            >
              Learn
            </Link>
            <Link 
              href="/community" 
              className="text-black hover:text-[#7297c5] font-medium transition-colors"
            >
              Community
            </Link>
          </nav>
          
          {/* User Section - Right */}
          <div className="flex items-center space-x-3 ml-auto">
            {loading ? (
              <div className="text-sm text-gray-500">Checking session...</div>
            ) : user ? (
              <>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-[#7297c5] border border-[#7297c5] rounded-lg hover:bg-[#7297c5] hover:text-white transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 px-3 py-2 text-black hover:text-[#7297c5] transition-colors"
                >
                  <div className="w-8 h-8 bg-[#7297c5] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {initials}
                  </div>
                  <span className="font-medium">{user.username}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-black hover:text-[#7297c5] font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-[#7297c5] text-white font-medium rounded-lg hover:bg-[#5a7ba3] transition-all duration-200"
                >
                  Join Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
