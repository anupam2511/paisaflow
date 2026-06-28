import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldCheck, AlertCircle, RefreshCw, Milestone } from 'lucide-react';

const lightLogo = new URL('../assets/images/paisaflow-logo-removebg-preview.png', import.meta.url).href;
const darkLogo = new URL('../assets/images/paisaflow-dark-logo-removebg-preview.png', import.meta.url).href;
import { signInWithGoogle, signInWithGoogleRedirect } from '../utils/firebase';

export default function LoginScreen() {
  const [errorMsg, setErrorMsg] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains("dark") ||
             window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const checkDark = () => {
      const hasDarkClass = document.documentElement.classList.contains("dark");
      setIsDark(hasDarkClass);
    };

    checkDark();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkDark();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      checkDark();
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

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
    <div id="login-screen-view" className="min-h-screen bg-[#f8fafc] dark:bg-transparent flex flex-col justify-center items-center px-4 py-12 transition-all duration-350">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/70 dark:border-slate-700/50 p-10 md:p-12 shadow-xl dark:shadow-[0_30px_80px_rgba(0,0,0,.55)] relative overflow-hidden"
      >
        {/* Subtle glowing ambient elements */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
          <div className="text-center flex flex-col items-center">

            {/* Logo */}
            <img
              src={isDark ? darkLogo : lightLogo}
              alt="PaisaFlow"
              className="
                w-full
                max-w-[300px]
                h-auto
                object-contain
                select-none
                pointer-events-none
                mb-14
                transition-all
                duration-300
              "
            draggable={false}
            />

            {/* Hero Text */}
            <div className="mb-12">
              <h1 className="text-[34px] leading-tight font-extrabold text-slate-900 dark:text-white tracking-tight">
                Simplify your spending.
              </h1>

              <h2 className="text-[34px] leading-tight font-extrabold bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent mt-1">
                Master your flow.
              </h2>
            </div>

          </div>

          <p className="text-sm text-slate-500 font-medium text-center mb-8">
              End-to-end encrypted • Private • Cloud synced
          </p>

        {/* Security Notification Banner */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-6 text-center mb-8">

          <div className="flex items-center justify-center gap-2 mb-2">

            <ShieldCheck className="w-5 h-5 text-emerald-500" />

            <span className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Verified Secure
            </span>

          </div>

          <p className="text-xs leading-6 text-slate-600 dark:text-slate-300 text-center">
            Your financial data is encrypted, protected with Google Authentication and securely synchronized across your devices.
          </p>

        </div>

        {/* Google Authentication Segment */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn || isRedirecting}
            className={`
              w-full
              h-14
              rounded-2xl

              bg-gradient-to-r
              from-[#2563EB]
              via-[#1D4ED8]
              to-[#0EA5E9]

              hover:from-[#1D4ED8]
              hover:to-[#0284C7]

              transition-all
              duration-300

              shadow-lg
              hover:shadow-xl

              hover:scale-[1.01]
              active:scale-[0.985]

              font-bold
              tracking-wide
              text-white

              flex
              items-center
              justify-center

              ${
                  isSigningIn || isRedirecting
                      ? "opacity-70 cursor-not-allowed"
                      : ""
              }
              `}
          >
            {isSigningIn ? (
              <RefreshCw className="w-6 h-6 mr-3 animate-spin text-white shrink-0" />
            ) : (
              <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.67-.35-1.37-.35-2.09z"/>
                <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>{isSigningIn ? 'Connecting to Google...' : 'Sign In with Google'}</span>
          </button>

          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-rose-50/70 border border-rose-100/40 text-rose-600 text-[11px] leading-relaxed rounded-2xl font-bold flex gap-2 animate-pulse"
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
