import React, { useState, useEffect } from 'react';
import { Flame, ArrowRight, Lock, User, AlertCircle, Loader2, Server, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getServerUrl, setServerUrl, api } from '../services/api';

export const LoginScreen: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Server URL settings
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverAddress, setServerAddress] = useState(getServerUrl() || 'http://192.168.161.0:4000');
  const [pingStatus, setPingStatus] = useState<{ testing: boolean; success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    setServerAddress(getServerUrl() || 'http://192.168.161.0:4000');
  }, []);

  const handleTestConnection = async () => {
    setPingStatus({ testing: true });
    const res = await api.auth.ping(serverAddress);
    setPingStatus({ testing: false, success: res.ok, message: res.message });
  };

  const handleSaveServer = () => {
    setServerUrl(serverAddress);
    setShowServerConfig(false);
    setPingStatus(null);
  };

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
      <div className="pt-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#C94B4B] flex items-center justify-center text-white mx-auto mb-3.5 shadow-lg shadow-[#C94B4B]/25">
          <Flame className="w-9 h-9 fill-white text-white" />
        </div>
        <h1 className="text-[28px] font-extrabold text-[#242424] tracking-tight">ServeFlow</h1>
        <p className="text-[14px] text-[#737373] mt-1 font-semibold">Restaurant POS & Operations</p>
        <p className="text-[12px] text-[#999] mt-0.5">Manage orders • Kitchen • Payments • Reports</p>
      </div>

      {/* Main Login Card */}
      <div className="my-auto py-4">
        <div className="bg-white rounded-3xl p-6 border border-[#E8E6E3] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Notification Alert */}
            {displayError && (
              <div
                className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-semibold flex flex-col gap-1.5 animate-in fade-in duration-200"
                role="alert"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div className="leading-snug">{displayError}</div>
                </div>
                {displayError.includes('Unable to connect') && (
                  <button
                    type="button"
                    onClick={() => setShowServerConfig(true)}
                    className="mt-1 text-[12px] text-[#C94B4B] underline font-bold self-start cursor-pointer"
                  >
                    Tap here to configure or test server connection
                  </button>
                )}
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

          {/* Server Config Collapsible / Modal */}
          {showServerConfig ? (
            <div className="mt-4 p-4 rounded-2xl bg-[#F8F8F6] border border-[#E8E6E3] animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-[#333] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#C94B4B]" />
                  Server Connection URL
                </span>
                <button
                  type="button"
                  onClick={() => setShowServerConfig(false)}
                  className="text-[11px] font-semibold text-[#888] hover:text-[#333]"
                >
                  Cancel
                </button>
              </div>
              <input
                type="text"
                value={serverAddress}
                onChange={(e) => setServerAddress(e.target.value)}
                placeholder="http://192.168.161.0:4000"
                className="w-full px-3 py-2 text-[13px] font-mono rounded-lg border border-[#DDD] bg-white text-[#333] focus:outline-none focus:border-[#C94B4B]"
              />
              <p className="text-[11px] text-[#777] mt-1.5 leading-snug">
                Enter your computer's IP address with port 4000. Both devices must be on the same Wi-Fi.
              </p>

              {pingStatus && (
                <div
                  className={`mt-2 p-2 rounded-lg text-[12px] flex items-center gap-1.5 font-semibold ${
                    pingStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {pingStatus.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{pingStatus.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={pingStatus?.testing}
                  className="flex-1 py-2 px-3 rounded-lg border border-[#DDD] bg-white text-[#444] text-[12px] font-bold hover:bg-[#F0F0EE] flex items-center justify-center gap-1.5"
                >
                  {pingStatus?.testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Test Connection
                </button>
                <button
                  type="button"
                  onClick={handleSaveServer}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#242424] text-white text-[12px] font-bold hover:bg-[#333]"
                >
                  Save URL
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-[#F5F5F3] flex items-center justify-between text-[11.5px] text-[#737373]">
              <span className="truncate max-w-[210px] font-mono text-[11px]">
                Server: {getServerUrl() || 'http://192.168.161.0:4000'}
              </span>
              <button
                type="button"
                onClick={() => setShowServerConfig(true)}
                className="font-bold text-[#C94B4B] hover:underline cursor-pointer ml-1"
              >
                Change IP
              </button>
            </div>
          )}

          {/* Forgot password */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() =>
                alert('Please contact your restaurant administrator or manager to reset your password.')
              }
              className="text-[12px] font-semibold text-[#888] hover:text-[#C94B4B] transition-colors"
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
