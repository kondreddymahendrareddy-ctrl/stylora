import React, { useState } from 'react';
import { User, LoginPayload, SignupPayload, GenderPreference, SkinTone } from '../types/auth';
import { login, signup } from '../services/authApi';
import { 
  Sparkles, 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Compass,
  Palette
} from 'lucide-react';

export const SKIN_TONE_OPTIONS: { id: SkinTone; label: string; hex: string; note: string }[] = [
  { id: 'fair_light', label: 'Porcelain / Fair', hex: '#F8D9C6', note: 'Emerald, rich navy, berries' },
  { id: 'light_warm', label: 'Light Warm / Peach', hex: '#F1C2A2', note: 'Terracotta, warm olive, coral' },
  { id: 'medium_olive', label: 'Medium / Olive', hex: '#CF9C76', note: 'Cobalt, plum, forest green' },
  { id: 'tan_warm', label: 'Warm Tan / Caramel', hex: '#A86D44', note: 'Saffron, turquoise, bronze, ivory' },
  { id: 'deep_rich', label: 'Deep / Rich Chestnut', hex: '#724628', note: 'Royal blue, gold, fuchsia' },
  { id: 'dark_espresso', label: 'Deep Espresso / Cocoa', hex: '#3E2314', note: 'High-contrast brights, stark white' },
];

export const GENDER_OPTIONS: { id: GenderPreference; label: string; badge: string; desc: string }[] = [
  { id: 'women', label: "Women's Fashion", badge: 'Women', desc: 'Dresses, skirts, tailoring, blouses' },
  { id: 'men', label: "Men's Fashion", badge: 'Men', desc: 'Shirts, blazers, trousers, casuals' },
  { id: 'unisex', label: 'Unisex / Fluid', badge: 'All', desc: 'Modern, versatile, relaxed cuts' },
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  
  // Signup State
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupArchetype, setSignupArchetype] = useState<any>('minimalist');
  const [signupGender, setSignupGender] = useState<GenderPreference>('women');
  const [signupSkinTone, setSignupSkinTone] = useState<SkinTone>('medium_olive');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { user } = await login({
        email: loginEmail,
        password: loginPassword
      });
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { user } = await signup({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        styleArchetype: signupArchetype,
        gender: signupGender,
        skinTone: signupSkinTone,
      });
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Signup failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setLoginEmail('demo@stylora.ai');
    setLoginPassword('password123');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] border border-[#ECE5DB] shadow-2xl overflow-hidden flex flex-col relative animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header with STYLORA Logo & Title */}
        <div className="pt-8 pb-6 px-8 text-center bg-gradient-to-b from-[#FAF8F5] to-white border-b border-[#ECE5DB]">
          {/* Official STYLORA Logo Emblem */}
          <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center text-white mx-auto shadow-md ring-4 ring-neutral-100 mb-3">
            <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
          </div>

          {/* Title & Subtitle */}
          <h2 className="font-serif text-3xl font-semibold tracking-wider text-neutral-900 uppercase">
            STYLORA
          </h2>
          <p className="text-[10px] tracking-[0.25em] font-bold text-neutral-400 uppercase mt-0.5">
            AI Personal Stylist & Wardrobe Intelligence
          </p>
          <p className="text-xs text-neutral-500 italic mt-2 font-serif">
            "Dress with Intention, from What You Own."
          </p>

          {/* Tab Switcher */}
          <div className="flex rounded-full bg-neutral-100/90 p-1 mt-6 border border-neutral-200/70">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
                activeTab === 'signup'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-500 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#FAF9F6] border border-[#ECE5DB] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-500">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={fillDemoAccount}
                    className="text-[11px] text-amber-700 font-semibold hover:underline"
                  >
                    Use Demo Account
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#FAF9F6] border border-[#ECE5DB] rounded-2xl pl-10 pr-10 py-2.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white py-3 rounded-2xl text-xs font-semibold tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>SIGN IN TO STYLORA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: SIGN UP */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-500 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Alexander Vance"
                    className="w-full bg-[#FAF9F6] border border-[#ECE5DB] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-500 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#FAF9F6] border border-[#ECE5DB] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-500 mb-1.5">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full bg-[#FAF9F6] border border-[#ECE5DB] rounded-2xl pl-10 pr-10 py-2.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Gender Preference / Wardrobe Department */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-500 mb-1.5">
                  Wardrobe Department & Silhouette
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSignupGender(g.id)}
                      className={`py-2.5 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                        signupGender === g.id
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                          : 'border-[#ECE5DB] bg-[#FAF9F6] text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <span className="text-xs font-semibold">{g.badge}</span>
                      <span className={`text-[9px] mt-0.5 leading-tight ${signupGender === g.id ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        {g.id === 'women' ? "Women's" : g.id === 'men' ? "Men's" : 'Unisex'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skin Tone & Complexion Swatch */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-500 flex items-center space-x-1">
                    <Palette className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Complexion & Skin Tone</span>
                  </label>
                  <span className="text-[10px] text-neutral-600 font-medium">
                    {SKIN_TONE_OPTIONS.find(s => s.id === signupSkinTone)?.label}
                  </span>
                </div>
                
                {/* 6 circular swatches */}
                <div className="grid grid-cols-6 gap-2 p-2 bg-[#FAF9F6] border border-[#ECE5DB] rounded-2xl">
                  {SKIN_TONE_OPTIONS.map((tone) => {
                    const isSelected = signupSkinTone === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setSignupSkinTone(tone.id)}
                        title={`${tone.label} - ${tone.note}`}
                        className={`group relative flex flex-col items-center p-1 rounded-xl transition-all ${
                          isSelected ? 'bg-white shadow-xs' : 'hover:bg-neutral-200/50'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full shadow-inner transition-transform ${
                            isSelected ? 'ring-2 ring-offset-2 ring-neutral-900 scale-105' : 'group-hover:scale-105'
                          }`}
                          style={{ backgroundColor: tone.hex }}
                        />
                      </button>
                    );
                  })}
                </div>
                
                {/* Color note preview */}
                <p className="text-[10px] text-neutral-500 italic mt-1.5 px-1">
                  💡 Best palettes: {SKIN_TONE_OPTIONS.find(s => s.id === signupSkinTone)?.note}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-500 mb-1.5">
                  What is your favorite clothing style?
                </label>
                <select
                  value={signupArchetype}
                  onChange={(e) => setSignupArchetype(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#ECE5DB] rounded-2xl px-4 py-2.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                >
                  <option value="minimalist">Simple & Clean (Blacks, whites & greys)</option>
                  <option value="old_money_aesthetic">Classic & Elegant (Timeless, quality natural fabrics)</option>
                  <option value="streetwear_contemporary">Streetwear & Casual (Relaxed tees, jackets & sneakers)</option>
                  <option value="smart_casual_eclectic">Smart Casual (Great for work and going out)</option>
                  <option value="classic_tailored">Sharp & Formal (Suits, blazers & dress shoes)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white py-3 rounded-2xl text-xs font-semibold tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>CREATE STYLORA ACCOUNT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Guest / Demo Explorer Bypass */}
          <div className="pt-2 border-t border-[#ECE5DB] text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-neutral-500 hover:text-neutral-900 font-medium tracking-wide transition-colors py-1 inline-flex items-center space-x-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-neutral-400" />
              <span>Continue as Guest / Explore Demo</span>
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="bg-[#FAF9F6] py-3 px-6 text-center border-t border-[#ECE5DB] flex items-center justify-center space-x-2 text-[10px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted Session • Sustainable Wardrobe Intelligence</span>
        </div>
      </div>
    </div>
  );
};
