import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Key, User, ArrowRight, ShieldCheck, Trash2, HelpCircle, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<string[]>([]);
  const [showPin, setShowPin] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Load registered users registry on mount
  useEffect(() => {
    const registry = localStorage.getItem('paisaflow_accounts_registry');
    if (registry) {
      try {
        setRegisteredUsers(JSON.parse(registry));
      } catch (e) {
        setRegisteredUsers([]);
      }
    }
  }, []);

  // Monitor if username is new
  useEffect(() => {
    if (!username.trim()) {
      setIsRegistering(false);
      return;
    }
    const cleanUser = username.trim().toLowerCase();
    const pinKey = `paisaflow_user_pin_${cleanUser}`;
    const userExists = localStorage.getItem(pinKey) !== null;
    setIsRegistering(!userExists);
  }, [username]);

  // Handle single pin index change
  const handlePinChange = (index: number, val: string) => {
    // only numeric values permitted
    if (val && !/^[0-9]$/.test(val)) return;

    const newPin = [...pin];
    newPin[index] = val;
    setPin(newPin);
    setErrorMsg('');

    // Auto-focus next box
    if (val && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  // Handle key down (specifically backspace for focus-shifting)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        // Go back and clear previous
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        pinRefs[index - 1].current?.focus();
      } else {
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
      setErrorMsg('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newPin = [...pin];
    for (let i = 0; i < pasted.length; i++) {
      newPin[i] = pasted[i];
    }
    setPin(newPin);
    // Focus last pasted or end
    const lastIndex = Math.min(pasted.length, 3);
    pinRefs[lastIndex].current?.focus();
  };

  const executeLoginOrRegister = () => {
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMsg('Please enter a username to declare owner space');
      return;
    }
    if (cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 letters');
      return;
    }

    const pinStr = pin.join('');
    if (pinStr.length < 4) {
      setErrorMsg('PIN must be exactly 4 digits');
      pinRefs[pinStr.length < 4 ? pinStr.length : 3].current?.focus();
      return;
    }

    const lowerUser = cleanUsername.toLowerCase();
    const pinKey = `paisaflow_user_pin_${lowerUser}`;
    const storedPin = localStorage.getItem(pinKey);

    if (storedPin === null) {
      // Register New Account
      localStorage.setItem(pinKey, pinStr);
      
      // Update global accounts registry
      const newRegistry = Array.from(new Set([...registeredUsers, cleanUsername]));
      localStorage.setItem('paisaflow_accounts_registry', JSON.stringify(newRegistry));
      setRegisteredUsers(newRegistry);

      // Clean enter
      onLoginSuccess(cleanUsername);
    } else {
      // Login attempt
      if (storedPin === pinStr) {
        onLoginSuccess(cleanUsername);
      } else {
        setErrorMsg('Invalid Numeric PIN code. Access denied.');
        // clear PIN
        setPin(['', '', '', '']);
        pinRefs[0].current?.focus();
      }
    }
  };

  const handleSelectPreExisting = (userSelected: string) => {
    setUsername(userSelected);
    setPin(['', '', '', '']);
    setErrorMsg('');
    setTimeout(() => {
      pinRefs[0].current?.focus();
    }, 100);
  };

  const handleDeleteRegisteredUser = (userToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to completely delete the local profile data for "${userToDelete}"? This cannot be undone.`)) {
      const cleanUser = userToDelete.toLowerCase();
      // Remove PIN and core data key
      localStorage.removeItem(`paisaflow_user_pin_${cleanUser}`);
      localStorage.removeItem(`personal_finance_dashboard_data_user_${cleanUser}`);
      
      // Clean registry
      const updatedRegistry = registeredUsers.filter(u => u !== userToDelete);
      localStorage.setItem('paisaflow_accounts_registry', JSON.stringify(updatedRegistry));
      setRegisteredUsers(updatedRegistry);

      if (username === userToDelete) {
        setUsername('');
        setPin(['', '', '', '']);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] flex flex-col justify-center items-center px-4 py-12 transition-all duration-350">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#0b1329] rounded-3xl border border-slate-100 dark:border-slate-800/80 p-8 shadow-xl relative overflow-hidden"
      >
        {/* Subtle glowing elements in dark style */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 dark:bg-indigo-500/15 text-white dark:text-indigo-400 rounded-2.5xl flex items-center justify-center shadow-lg shadow-indigo-600/15 mx-auto mb-4 border border-indigo-500/10">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-150 tracking-tight font-sans">
            PaisaFlow Space
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-semibold">
            Secure offline capital suite with Username & numeric PIN
          </p>
        </div>

        {/* Security Notification Banner */}
        <div className="mb-6 p-3 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 rounded-2xl flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-relaxed font-semibold">
            All workspace vaults are securely stored inside your local browser. No data ever transmits to remote systems.
          </span>
        </div>

        {/* Form controls */}
        <div className="space-y-5">
          {/* Username entry */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1.5 tracking-wider">
              Enter Username Space
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 mb-0.5">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.replace(/[^a-zA-Z0-9_\s]/g, ''));
                  setErrorMsg('');
                }}
                maxLength={20}
                placeholder="e.g. Anupam"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-150"
              />
            </div>
          </div>

          {/* Secure 4-Digit digit boxes */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Numeric Security PIN
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Hide PIN' : 'View Input'}</span>
              </button>
            </div>

            <div className="flex justify-between gap-3.5" onPaste={handlePaste}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-full h-14 text-center text-xl font-black rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 bg-slate-50/60 dark:bg-slate-900/40 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-mono"
                />
              ))}
            </div>
          </div>

          {/* Verification Status Feedback Message */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-bold text-center leading-normal"
              >
                {errorMsg}
              </motion.div>
            )}

            {!errorMsg && username.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 text-xs rounded-xl font-bold text-center leading-normal border ${
                  isRegistering 
                    ? 'bg-amber-50/70 dark:bg-amber-500/5 border-amber-100/50 dark:border-amber-500/10 text-amber-600 dark:text-amber-400' 
                    : 'bg-indigo-50/70 dark:bg-indigo-500/5 border-indigo-100/50 dark:border-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {isRegistering ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> 
                    New Account Spot! Register with this PIN now.
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" />
                    Recognized member! Enter PIN to open wallet.
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Action */}
          <button
            onClick={executeLoginOrRegister}
            className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs uppercase tracking-widest font-black rounded-xl cursor-pointer transition shadow-sm active:scale-[0.98]"
          >
            <span>{isRegistering ? 'Register & Enter' : 'Submit Authorization'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Accounts Switch Trigger Panel */}
        {registeredUsers.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-3 tracking-wider">
              Switch Local Vault Profiles ({registeredUsers.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {registeredUsers.map((user) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => handleSelectPreExisting(user)}
                  className={`p-2 rounded-xl border text-left flex items-center justify-between pointer-events-auto transition duration-150 cursor-pointer ${
                    username.toLowerCase() === user.toLowerCase()
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 border-slate-150 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-800/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                      {user.substring(0, 2)}
                    </div>
                    <span className="text-[11px] font-bold truncate">{user}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteRegisteredUser(user, e)}
                    className="p-1 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 text-slate-300 rounded transition shrink-0"
                    title="Prune profile account"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
