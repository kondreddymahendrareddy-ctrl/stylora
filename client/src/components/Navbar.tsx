import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Shirt, Wand2, User as UserIcon, Plus, LogOut, ChevronDown, Check, History as HistoryIcon } from 'lucide-react';
import { UserStyleProfile } from '../types/fashion';
import { User } from '../types/auth';

interface NavbarProps {
  activeTab: 'studio' | 'wardrobe' | 'profile' | 'history';
  setActiveTab: (tab: 'studio' | 'wardrobe' | 'profile' | 'history') => void;
  onOpenUpload: () => void;
  wardrobeCount: number;
  profile: UserStyleProfile | null;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  wardrobeCount,
  profile,
  currentUser,
  onOpenAuth,
  onLogout
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatArchetype = (arch?: string) => {
    if (!arch) return 'Minimalist';
    return arch.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#ECE5DB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
            <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-2xl tracking-widest font-semibold uppercase text-neutral-900">
                STYLORA
              </span>
              <span className="block text-[10px] tracking-[0.2em] font-medium text-neutral-500 uppercase -mt-1">
                AI Personal Stylist
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-neutral-100/80 p-1.5 rounded-full border border-neutral-200/60">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
                activeTab === 'studio'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>OUTFIT CREATOR</span>
            </button>

            <button
              onClick={() => setActiveTab('wardrobe')}
              className={`flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
                activeTab === 'wardrobe'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>MY CLOSET ({wardrobeCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>MY STYLE STATS</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              <span>STYLE HISTORY</span>
            </button>
          </nav>

          {/* Right Action: User Auth, Archetype & Upload Button */}
          <div className="flex items-center space-x-3">
            {/* User Account / Sign In */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200/80 pl-2 pr-3 py-1.5 rounded-full transition-all text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-neutral-900 text-amber-300 flex items-center justify-center text-[10px] font-bold shadow-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-neutral-800 max-w-[100px] truncate hidden sm:inline">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {/* Luxury Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#ECE5DB] py-2 z-50 animate-scaleUp">
                    <div className="px-4 py-2.5 border-b border-[#ECE5DB]">
                      <p className="text-xs font-semibold text-neutral-900 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {currentUser.email}
                      </p>
                      <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#ECE5DB] text-[10px] font-medium text-neutral-700">
                        {formatArchetype(currentUser.styleArchetype)}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Style Intelligence Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          onLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 border border-[#ECE5DB] bg-white hover:bg-neutral-50 text-neutral-800 px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5 text-neutral-600" />
                <span>SIGN IN</span>
              </button>
            )}

            {/* Add to Closet Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold tracking-wider px-4 py-2.5 rounded-full shadow-sm transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">ADD TO CLOSET</span>
              <span className="sm:hidden">ADD</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
