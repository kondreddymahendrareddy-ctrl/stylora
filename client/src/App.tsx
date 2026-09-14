import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WardrobeSection } from './components/WardrobeSection';
import { OutfitGenerator } from './components/OutfitGenerator';
import { OutfitCard } from './components/OutfitCard';
import { StylistExplanationModal } from './components/StylistExplanationModal';
import { UploadModal } from './components/UploadModal';
import { StyleProfileModal } from './components/StyleProfileModal';
import { StyleHistory } from './components/StyleHistory';
import { AuthModal } from './components/AuthModal';
import { 
  WardrobeItem, 
  Outfit, 
  GenerateOutfitRequest, 
  UserStyleProfile 
} from './types/fashion';
import { User } from './types/auth';
import { 
  fetchWardrobe, 
  generateOutfits, 
  deleteWardrobeItem, 
  fetchProfile, 
  submitOutfitFeedback,
  resetWardrobe,
  seedWardrobe
} from './services/api';
import { 
  getStoredToken, 
  fetchCurrentUser, 
  logout as apiLogout 
} from './services/authApi';
import { Sparkles, Shirt, Wand2, Compass, AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'wardrobe' | 'profile' | 'history'>('studio');
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [profile, setProfile] = useState<UserStyleProfile | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [explainedOutfit, setExplainedOutfit] = useState<Outfit | null>(null);

  // Load initial data and verify active session
  useEffect(() => {
    async function initData() {
      try {
        setIsLoading(true);

        // Verify stored session token first so API requests carry correct auth
        const token = getStoredToken();
        if (token) {
          try {
            const user = await fetchCurrentUser(token);
            setCurrentUser(user);

            // After login: download this user's specific previously uploaded clothes from database
            const [items, userProfile] = await Promise.all([
              fetchWardrobe(),
              fetchProfile()
            ]);
            setWardrobe(items);
            setProfile(userProfile);
            setOutfits([]);
            return;
          } catch (tokenErr) {
            console.warn('Session verification failed, continuing as guest:', tokenErr);
          }
        }

        // Before login: all should be strictly ZERO (no sample data)
        setCurrentUser(null);
        setWardrobe([]);
        setProfile({
          styleArchetype: 'minimalist',
          favoriteColors: [],
          dislikedCombinations: [],
          averageFormalityPreference: 0,
          totalOutfitsGenerated: 0,
          totalOutfitsWorn: 0,
          likedOutfitsCount: 0
        });
        setOutfits([]);
      } catch (err: any) {
        console.error('Initialization error:', err);
        setErrorMessage(err.message || 'Could not connect to backend server');
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  const handleGenerateOutfits = async (req: GenerateOutfitRequest) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const generated = await generateOutfits({
        ...req,
        gender: req.gender || currentUser?.gender,
        skinTone: req.skinTone || currentUser?.skinTone
      });
      setOutfits(generated);
      // Refresh profile counts
      const updatedProfile = await fetchProfile();
      setProfile(updatedProfile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate outfits');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteWardrobeItem(id);
      setWardrobe(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete garment');
    }
  };

  const handleItemAdded = (item: WardrobeItem) => {
    setWardrobe(prev => [item, ...prev]);
  };

  const handleFeedback = async (outfitId: string, liked: boolean, worn: boolean) => {
    try {
      const { outfit: updated, profile: updatedProfile } = await submitOutfitFeedback(outfitId, liked, worn);
      setOutfits(prev => prev.map(o => o.id === outfitId ? updated : o));
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleResetAll = async () => {
    try {
      const { items, profile: updatedProfile } = await resetWardrobe();
      setWardrobe(items);
      setProfile(updatedProfile);
      setOutfits([]);
    } catch (err: any) {
      alert(err.message || 'Failed to reset wardrobe');
    }
  };

  const handleOpenUpload = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    } else {
      setIsUploadOpen(true);
    }
  };

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    try {
      setIsLoading(true);
      // After login: download this user's specific previously uploaded clothes from database
      const [items, userProfile] = await Promise.all([
        fetchWardrobe(),
        fetchProfile()
      ]);
      setWardrobe(items);
      setProfile(userProfile);
      setOutfits([]);
    } catch (err) {
      console.warn('Failed to load user closet on login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = getStoredToken();
    await apiLogout(token || undefined);
    setCurrentUser(null);
    // Before login: all should be strictly ZERO
    setWardrobe([]);
    setProfile({
      styleArchetype: 'minimalist',
      favoriteColors: [],
      dislikedCombinations: [],
      averageFormalityPreference: 0,
      totalOutfitsGenerated: 0,
      totalOutfitsWorn: 0,
      likedOutfitsCount: 0
    });
    setOutfits([]);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col selection:bg-neutral-900 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={handleOpenUpload}
        wardrobeCount={wardrobe.length}
        profile={profile}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center space-x-3 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-700" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: OUTFIT STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-12 animate-fadeIn">
            {/* Hero Banner with Luxury Studio Background Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#ECE5DB] mb-10 bg-neutral-950 text-white">
              {/* Luxury fashion flatlay background image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105 opacity-40"
                style={{ backgroundImage: `url('/images/hero-banner.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/80 to-neutral-900/65" />
              
              <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 max-w-3xl space-y-4">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold tracking-wider uppercase shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>YOUR AI CLOSET ASSISTANT</span>
                </div>
                
                <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
                  Great Outfits From The Clothes You Already Own.
                </h1>
                
                <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-light max-w-2xl">
                  Tell us where you are going and what the weather is like. We will match your clothes together and explain in simple words why they look great together.
                </p>

                {/* Friendly Value Badges */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs border border-white/15">
                    <span>✨</span>
                    <span>No need to buy new clothes</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs border border-white/15">
                    <span>🎨</span>
                    <span>Colors that match naturally</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs border border-white/15">
                    <span>💡</span>
                    <span>Easy, clear styling tips</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Empty Wardrobe Notice */}
            {wardrobe.length === 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    {!currentUser ? (
                      <><strong>Welcome to Stylora.</strong> Sign in to your personal account to access your uploaded clothes and online closet.</>
                    ) : (
                      <><strong>Your closet is empty (0 clothes).</strong> Upload your shirts, pants, jackets, and dresses to generate personalized outfits!</>
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {!currentUser ? (
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="bg-neutral-900 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-neutral-800 transition-all shadow-xs"
                    >
                      Sign In / Register
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="bg-neutral-900 text-white px-3.5 py-1.5 rounded-full font-semibold hover:bg-neutral-800 transition-all shadow-xs"
                    >
                      + Add Clothes
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Interactive Generator Controls */}
            <OutfitGenerator
              onGenerate={handleGenerateOutfits}
              isGenerating={isGenerating}
            />

            {/* Generated Outfits Showcase */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#ECE5DB] pb-4">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-neutral-900">
                    Outfits Picked For You
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Made only from the clothes in your closet.
                  </p>
                </div>
                <span className="text-xs font-semibold text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
                  {outfits.length} Outfits Found
                </span>
              </div>

              {outfits.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#ECE5DB]">
                  <Compass className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-neutral-700">No outfits created yet</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {!currentUser 
                      ? "Sign in to your account and upload clothes to get tailored outfit recommendations." 
                      : "Select where you are going above and click \"Create Outfits For Me\"."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {outfits.map(outfit => (
                    <OutfitCard
                      key={outfit.id}
                      outfit={outfit}
                      onExplain={(o) => setExplainedOutfit(o)}
                      onFeedback={handleFeedback}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DIGITAL WARDROBE */}
        {activeTab === 'wardrobe' && (
          <WardrobeSection
            items={wardrobe}
            onDeleteItem={handleDeleteItem}
            onOpenUpload={handleOpenUpload}
            currentUser={currentUser}
          />
        )}

        {/* TAB 3: STYLE INTELLIGENCE */}
        {activeTab === 'profile' && (
          <StyleProfileModal
            profile={profile}
            wardrobe={wardrobe}
            currentUser={currentUser}
            onProfileUpdated={(updated) => setProfile(updated)}
            onUserUpdated={(u) => setCurrentUser(u)}
            onResetAll={handleResetAll}
          />
        )}

        {/* TAB 4: STYLE HISTORY & ANALYTICS */}
        {activeTab === 'history' && (
          <StyleHistory />
        )}
      </main>

      {/* Stylist Explanation Modal (Explainable AI) */}
      <StylistExplanationModal
        outfit={explainedOutfit}
        onClose={() => setExplainedOutfit(null)}
      />

      {/* Wardrobe Photo Upload & Scanner Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onItemAdded={handleItemAdded}
      />

      {/* User Authentication Modal (Sign In & Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-[#ECE5DB] bg-white py-8 mt-16 text-center text-xs text-neutral-400">
        <p className="font-serif tracking-wider uppercase text-neutral-600 font-medium">
          STYLORA — Your Smart AI Closet Assistant
        </p>
        <p className="text-[11px] mt-1 text-neutral-400">
          Smart outfit recommendations made from clothes you already own.
        </p>
      </footer>
    </div>
  );
}

export default App;
