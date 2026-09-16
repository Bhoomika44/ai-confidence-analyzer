import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword
} from '../services/api';

import {
  KeyRound,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [resendCountdown, setResendCountdown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCountdown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleRequestCode = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiForgotPassword(cleanEmail);

      setEmail(cleanEmail);
      setStep(2);
      setResendCountdown(30);

      setSuccess(
        res.data?.message ||
        'A verification code has been sent to your email.'
      );
    } catch (err) {
      console.error('Forgot password error:', err);

      setError(
        err.response?.data?.message ||
        'Failed to find account with that email.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0 || loading) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await apiForgotPassword(email.trim().toLowerCase());

      setResetCode('');
      setResendCountdown(30);

      setSuccess(
        res.data?.message ||
        'A new verification code has been sent to your email.'
      );
    } catch (err) {
      console.error('Resend verification code error:', err);

      setError(
        err.response?.data?.message ||
        'Failed to send a new verification code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const cleanCode = resetCode.trim();

    if (!/^\d{4}$/.test(cleanCode)) {
      setError('Please enter the 4-digit verification code sent to your email.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiResetPassword({
        email: email.trim().toLowerCase(),
        resetCode: cleanCode,
        newPassword
      });

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }

      if (res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      setSuccess(
        'Password reset successfully! Redirecting to dashboard...'
      );

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error('Reset password error:', err);

      setError(
        err.response?.data?.message ||
        'Invalid or expired verification code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setStep(1);
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setResendCountdown(0);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md w-full border-indigo-500/20 shadow-glass">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400 shadow-glow">
            <KeyRound className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-white">
            Reset Password
          </h2>

          <p className="text-xs text-slate-400 mt-2">
            {step === 1
              ? 'Enter your registered email address to receive a verification code.'
              : 'Enter the verification code sent to your email and choose a new password.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Email Address
              </label>

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={loading}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-glow transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending Verification...' : 'Send Reset Code'}

              {!loading && (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>

          </form>
        ) : (

          /* Step 2 */
          <form onSubmit={handleResetPassword} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-400"
                />
              </div>
            </div>

            {/* Verification Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                4-Digit Verification Code
              </label>

              <input
                type="text"
                required
                maxLength={4}
                inputMode="numeric"
                value={resetCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setResetCode(value);
                }}
                placeholder="1234"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-center font-mono text-lg font-bold text-white tracking-widest placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />

              {/* Resend */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-500">
                  Didn't receive the code?
                </span>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCountdown > 0 || loading}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : 'Resend Code'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Password
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (min 6 chars)"
                  disabled={loading}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-glow transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading
                ? 'Updating Password...'
                : 'Save New Password & Sign In'}

              {!loading && (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </button>

            {/* Change Email */}
            <button
              type="button"
              onClick={handleChangeEmail}
              disabled={loading}
              className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              ← Change email address
            </button>

          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;