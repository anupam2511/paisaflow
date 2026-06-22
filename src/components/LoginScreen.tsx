import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldCheck, AlertCircle, RefreshCw, Milestone } from 'lucide-react';
import { signInWithGoogle, signInWithGoogleRedirect } from '../utils/firebase';

export default function LoginScreen() {
  const [errorMsg, setErrorMsg] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      // Auth state update will trigger automatically in App.tsx via onAuthStateChanged
    } catch (err: any) {
      console.error("Sign-In failed", err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Auth popup has been blocked by your browser. Please click the "Use Google Redirect" button below or click "Open in New Tab" in the top right to log in.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('The sign-in popup was closed before completion. If popups are blocked or closed too quickly, try click "Use Google Redirect" below!');
      } else {
        setErrorMsg(err.message || 'Secure authorization failed. Please try the Redirect option below.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRedirectSignIn = async () => {
    setIsRedirecting(true);
    setErrorMsg('');
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      console.error("Redirect trigger failed", err);
      setErrorMsg(err.message || 'Redirect sign-in initialization failed. Please use are "Open in New Tab" layout.');
      setIsRedirecting(false);
    }
  };

  return (
    <div id="login-screen-view" className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] flex flex-col justify-center items-center px-4 py-12 transition-all duration-350">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#0b1329] rounded-3xl border border-slate-100 dark:border-slate-800/80 p-8 shadow-xl relative overflow-hidden"
      >
        {/* Subtle glowing ambient elements */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 dark:bg-indigo-600/10 text-white dark:text-indigo-400 rounded-2.5xl flex items-center justify-center shadow-lg shadow-indigo-600/15 mx-auto mb-4 border border-indigo-500/10">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-sans">
            PaisaFlow Space
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-wider">
            Secure Capital HUD
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed mt-1 font-semibold">
            Real-time, cloud-synchronized personal finance tracking powered by secure Google Authentication.
          </p>
        </div>

        {/* Security Notification Banner */}
        <div className="mb-6 p-4 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 rounded-2xl flex items-start gap-2.5">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-grow">
            <h4 className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Verified Secure</h4>
            <p className="text-[10px] text-emerald-600/95 dark:text-emerald-450 mt-0.5 leading-relaxed font-semibold">
              Your financial portfolio is bound specifically to your Google credentials, safely encrypted and stored in full isolated client-side storage + private cloud backends.
            </p>
          </div>
        </div>

        {/* Google Authentication Segment */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn || isRedirecting}
            className={`w-full flex items-center justify-center py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-2xl transition shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99] font-black text-xs uppercase tracking-wider ${
              isSigningIn || isRedirecting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSigningIn ? (
              <RefreshCw className="w-5 h-5 mr-3 animate-spin text-white shrink-0" />
            ) : (
              <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.67-.35-1.37-.35-2.09z"/>
                <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>{isSigningIn ? 'Opening Secure Popup...' : 'Sign In with Google (Popup)'}</span>
          </button>

          {/* Fallback Redirect sign in button - extremely robust for sandboxes */}
          <button
            onClick={handleRedirectSignIn}
            disabled={isSigningIn || isRedirecting}
            className={`w-full flex items-center justify-center py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-2xl transition shadow-xs hover:shadow-xs cursor-pointer active:scale-[0.99] font-bold text-xs uppercase tracking-wider ${
              isSigningIn || isRedirecting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isRedirecting ? (
              <RefreshCw className="w-5 h-5 mr-3 animate-spin text-slate-400 shrink-0" />
            ) : (
              <Milestone className="w-5 h-5 mr-3 text-emerald-500 shrink-0" />
            )}
            <span>{isRedirecting ? 'Redirecting to Google...' : 'Use Google Redirect (Safe Fallback)'}</span>
          </button>

          {/* Iframe Hint Banner */}
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/40 rounded-xl">
            <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-extrabold flex items-center gap-1">
              💡 Frame Sign-In Tips:
            </p>
            <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-semibold">
              If popups fail or are closed too quickly inside this preview, use the <strong>Google Redirect (Safe Fallback)</strong> above, or click <strong>Open in New Tab</strong> immediately in the top right to ensure total authorization success.
            </p>
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100/40 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-[11px] leading-relaxed rounded-2xl font-bold flex gap-2 animate-pulse"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
