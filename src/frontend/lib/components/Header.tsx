'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const Header = () => {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('username');
      const authToken = localStorage.getItem('authToken');
      if (user && authToken) {
        setIsAuthenticated(true);
        setUsername(user);
      } else {
        setIsAuthenticated(false);
        setUsername('');
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth-change', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-change', checkAuth);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUsername('');
    window.dispatchEvent(new Event('auth-change'));
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-[#7297c5] rounded-lg">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-xl font-bold text-black">HackathonHub</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/challenges" 
              className="text-black hover:text-[#7297c5] font-medium transition-colors"
            >
              Challenges
            </Link>
            <Link 
              href="/leaderboard" 
              className="text-black hover:text-[#7297c5] font-medium transition-colors"
            >
              Leaderboard
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
          
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center space-x-2 px-4 py-2 text-black hover:text-primary font-medium transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <span>{username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Sign Out
                </button>
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
