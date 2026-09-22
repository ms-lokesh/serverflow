import React, { useState } from 'react';
import { Flame, ArrowRight, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setIsSubmitting(true);
    setLocalError(null);
    clearError();

    const result = await login(identifier.trim(), password);
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setLocalError(result.error);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-between p-5 max-w-md mx-auto selection:bg-[#C94B4B]/20 selection:text-[#C94B4B]">
      {/* Brand Header */}
      <div className="pt-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#C94B4B] flex items-center justify-center text-white mx-auto mb-3.5 shadow-lg shadow-[#C94B4B]/25">
          <Flame className="w-9 h-9 fill-white text-white" />
        </div>
        <h1 className="text-[28px] font-extrabold text-[#242424] tracking-tight">ServeFlow</h1>
        <p className="text-[14px] text-[#737373] mt-1 font-semibold">Restaurant POS & Operations</p>
        <p className="text-[12px] text-[#999] mt-0.5">Manage orders • Kitchen • Payments • Reports</p>
      </div>

      {/* Main Login Card */}
      <div className="my-auto py-6">
        <div className="bg-white rounded-3xl p-6 border border-[#E8E6E3] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Notification Alert */}
            {displayError && (
              <div
                className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-semibold flex items-start gap-2.5 animate-in fade-in duration-200"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div className="leading-snug">{displayError}</div>
              </div>
            )}

            <div>
              <label
                htmlFor="login-identifier"
                className="block text-[11.5px] font-extrabold text-[#555] uppercase tracking-wider mb-1.5"
              >
                Employee ID / Email
              </label>
              <div className="relative">
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (displayError) setLocalError(null);
                  }}
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[#242424] text-[14px] font-semibold placeholder:text-[#AAA] focus:outline-none focus:border-[#C94B4B] focus:bg-white transition-all disabled:opacity-60"
                  placeholder="e.g. ADM-001 or DIN-001"
                />
                <User className="w-4 h-4 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-[11.5px] font-extrabold text-[#555] uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (displayError) setLocalError(null);
                  }}
                  required
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[#242424] text-[14px] font-semibold placeholder:text-[#AAA] focus:outline-none focus:border-[#C94B4B] focus:bg-white transition-all disabled:opacity-60"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={isSubmitting || !identifier.trim() || !password}
              className="w-full py-3.5 px-4 rounded-xl bg-[#C94B4B] text-white font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#A83B3B] active:scale-98 transition-all shadow-md shadow-[#C94B4B]/25 min-h-[48px] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Forgot password */}
          <div className="mt-5 text-center pt-3 border-t border-[#F5F5F3]">
            <button
              type="button"
              onClick={() =>
                alert('Please contact your restaurant administrator or manager to reset your password.')
              }
              className="text-[12.5px] font-semibold text-[#737373] hover:text-[#C94B4B] transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pb-4 text-[11.5px] text-[#888]">
        ServeFlow POS • Single Restaurant Edition
      </div>
    </div>
  );
};
