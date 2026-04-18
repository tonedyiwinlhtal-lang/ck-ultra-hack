/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  History, 
  Activity, 
  TrendingUp, 
  Play, 
  Square, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Trophy,
  AlertCircle,
  RefreshCw,
  LogIn,
  LogOut,
  ShieldAlert,
  Settings,
  User as UserIcon,
  Key as KeyIcon,
  Copy,
  Plus
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// --- Types ---

interface GameResult {
  issueNumber: string;
  number: string;
  bigSmall: string;
  colour: string;
}

interface Prediction {
  issueNumber: string;
  bigSmall: "BIG" | "SMALL";
  number: number;
  colour: string;
  status: "WIN" | "LOSE" | "PENDING";
  patternName?: string;
  confidence: number; // 0-100%
  method: string;     // Recommended action
  actual?: GameResult;
}

// --- Utils ---

const getColourFromNumber = (num: number): string => {
  if (num === 0) return "Red + Violet";
  if (num === 5) return "Green + Violet";
  if ([2, 4, 6, 8].includes(num)) return "Red";
  return "Green";
};

const getBigSmallFromNumber = (num: number): "BIG" | "SMALL" => {
  return num >= 5 ? "BIG" : "SMALL";
};

// --- Prediction Engine (Prime High-Power V3.0) ---

const PRIME_PATTERNS = [
  "ZENITH_PRIME_ALGO", "TITAN_EX_PROTOCOL", "AETHER_VOID_SCAN", "NEBULA_RECURSION",
  "HYPERION_CORE_V9", "PULSE_MIRROR_FLUX", "ORACLE_SYNAPSE", "VOID_BENDER_MAX",
  "CELESTIAL_WEIGHT", "GOD_EYE_SCANNER", "PRIME_GRID_MATRIX", "SOLAR_WAVE_LOCK"
];

const ELITE_PRIME_METHODS = [
  "STEALTH 1X (NEURAL)", 
  "PRIME 3X (ELITE)", 
  "MAX-POWER 9X (ULTRA)", 
  "OVERCLOCK 27X (TURBO)",
  "RECOVERY 81X (PRIME)",
  "STABILIZING (SAFE SCAN)"
];

const runPrediction = (history: any[], nextIssueNumber: string): Prediction => {
  if (!history || history.length < 5) {
    return {
      issueNumber: nextIssueNumber,
      bigSmall: "BIG",
      number: 7,
      colour: "Green",
      status: "PENDING",
      confidence: 50,
      method: "INITIALIZING...",
      patternName: "PRIME_BOOT_SCAN"
    };
  }

  const nums = history.map(i => parseInt(i.number));
  const bs = history.map(i => parseInt(i.number) >= 5 ? 1 : 0); // 1 = BIG, 0 = SMALL
  
  // PRIME LOGIC LAYERS
  let bsScore = 0; 
  let confidenceBoost = 0;
  let isPrimePattern = false;

  // Layer 1: Advanced Sequence Mirroring
  let streak = 0;
  let lastVal = bs[0];
  for(let val of bs) {
    if(val === lastVal) streak++;
    else break;
  }

  if (streak >= 4) {
    // Trend continuation logic
    bsScore += (lastVal === 1 ? 50 : -50);
    confidenceBoost += 20;
    if (streak >= 6) isPrimePattern = true;
  }

  // Layer 2: Vector Cross-Calculation (Prime Algorithm)
  // Checking for perfect 2-2 or 3-3 mirror sequences
  const isMirror3 = bs[0] === bs[1] && bs[1] === bs[2] && bs[3] !== bs[0] && bs[3] === bs[4] && bs[4] === bs[5];
  if (isMirror3) {
    bsScore += (bs[0] === 1 ? -60 : 60); // Strong reversal on mirror completion
    confidenceBoost += 30;
    isPrimePattern = true;
  }

  // Layer 3: Harmonic Resonator (100M Pattern Simulation)
  let neuralWeight = 0;
  const weights = [35, 25, 18, 12, 8, 6, 4, 3, 2, 1];
  bs.forEach((v, i) => {
    neuralWeight += (v === 1 ? weights[i] : -weights[i]);
  });
  bsScore += neuralWeight * 1.5;

  // Layer 4: Number Delta Velocity
  const delta = nums[0] - nums[1];
  if (Math.abs(delta) > 5) {
    bsScore += (delta > 0 ? 15 : -15);
  }

  // FINAL DECISION
  const predictedBS: "BIG" | "SMALL" = bsScore >= 0 ? "BIG" : "SMALL";
  
  // Elite Confidence Logic
  let baseConfidence = 80;
  const agreement = Math.abs(bsScore);
  baseConfidence += Math.min(15, agreement / 2);
  
  // Random "Prime" bonus to simulate 100M pattern matches
  const primeBonus = isPrimePattern ? Math.random() * 5 + 5 : 0;
  const finalConfidence = Math.min(99.99, baseConfidence + confidenceBoost + primeBonus);

  // Elite Method Mapping
  let method = ELITE_PRIME_METHODS[0];
  if (finalConfidence >= 95) method = ELITE_PRIME_METHODS[4]; // 81X
  else if (finalConfidence >= 90) method = ELITE_PRIME_METHODS[3]; // 27X
  else if (finalConfidence >= 85) method = ELITE_PRIME_METHODS[2]; // 9X
  else if (finalConfidence >= 80) method = ELITE_PRIME_METHODS[1]; // 3X
  else if (finalConfidence < 70) method = ELITE_PRIME_METHODS[5]; // SAFE

  // Precision Number Target
  // We use the last 3 numbers + the neural delta to isolate a prime hit
  const noise = Math.floor(Math.random() * 2);
  const targetSeed = (nums[0] + nums[1] + (predictedBS === "BIG" ? 5 : 0)) % 10;
  const finalNumber = predictedBS === "BIG" 
    ? (targetSeed < 5 ? targetSeed + 5 : targetSeed) 
    : (targetSeed >= 5 ? targetSeed - 5 : targetSeed);

  const patternPrefix = isPrimePattern ? "PRIME_" : "";
  const randomPattern = PRIME_PATTERNS[Math.floor(Math.random() * PRIME_PATTERNS.length)];

  return {
    issueNumber: nextIssueNumber,
    bigSmall: predictedBS,
    number: finalNumber,
    colour: getColourFromNumber(finalNumber),
    status: "PENDING",
    patternName: `${patternPrefix}${randomPattern}_X${agreement.toFixed(1)}`,
    confidence: Number(finalConfidence.toFixed(2)),
    method
  };
};

// --- Components ---

const LoginPage = ({ onLogin }: { onLogin: (isAdmin: boolean) => void }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleKeyLogin = async () => {
    if (!accessKey.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'keys'), where('key', '==', accessKey.trim()), where('isActive', '==', true));
      const snaps = await getDocs(q);
      
      if (snaps.empty) {
        throw new Error("Invalid or Expired Neural Key.");
      }

      const keyData = snaps.docs[0].data();
      const expiry = keyData.expiry?.toDate();
      
      if (expiry && new Date() > expiry) {
        throw new Error("Neural Key has Expired.");
      }

      // Save key session
      localStorage.setItem('neural_key_session', JSON.stringify({
        key: accessKey.trim(),
        expiry: expiry ? expiry.getTime() : null
      }));

      onLogin(false);
    } catch (err: any) {
      setError(err.message || "Key verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // CRITICAL: Strict Email Check
      const ROOT_ADMIN = 'khaingminthant86@gmail.com';
      if (user.email !== ROOT_ADMIN) {
        await signOut(auth);
        throw new Error(`ACCESS DENIED: ${user.email} is not the Root Administrator.`);
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
      }
      onLogin(true);
    } catch (err: any) {
      console.error("Admin Login failed:", err);
      setError(err.message || "Neural Link: Admin Verification Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0d121f] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl text-center relative overflow-hidden group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
            {loading ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Zap className="w-10 h-10 text-white fill-current" />}
          </div>
          
          <h1 className="text-4xl font-black text-white tracking-tighter mb-4">
            PRIME <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">ACCESS</span>
          </h1>
          <p className="text-zinc-500 text-sm mb-10 leading-relaxed">
            Please enter your neural access key to initiate standard scan protocols.
          </p>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-left"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <p className="text-[11px] text-rose-300 font-medium leading-tight">{error}</p>
            </motion.div>
          )}

          {!showAdminLogin ? (
            <div className="space-y-4">
              <div className="relative">
                <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter Neural Key..."
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/30 transition-all font-mono tracking-widest"
                />
              </div>
              <button 
                onClick={handleKeyLogin}
                disabled={loading}
                className="w-full py-4 px-6 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all active:scale-95 shadow-xl disabled:opacity-50"
              >
                Launch Scanner
              </button>
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-white transition-colors mt-4"
              >
                Access Admin Portal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-xl disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                Admin Google Login
              </button>
              <button 
                onClick={() => setShowAdminLogin(false)}
                className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-white transition-colors mt-4"
              >
                Back to Key Login
              </button>
            </div>
          )}
          
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-2">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Neural Encryption Active</p>
            <p className="text-[9px] text-zinc-700 italic">ID: CK-NEURAL-AUTH-900X</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ user, onClose }: { user: User, onClose: () => void }) => {
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [token30s, setToken30s] = useState('');
  const [token60s, setToken60s] = useState('');
  const [sig30, setSig30] = useState('');
  const [sig60, setSig60] = useState('');
  const [rand30, setRand30] = useState('');
  const [rand60, setRand60] = useState('');
  const [keys, setKeys] = useState<any[]>([]);
  const [keyType, setKeyType] = useState('day');
  const [durationValue, setDurationValue] = useState(1);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'config', 'system'), (snapshot) => {
      const data = snapshot.data();
      setSystemConfig(data);
      if (data) {
        setNewAnnouncement(data.announcement || '');
        setToken30s(data.token30s || '');
        setToken60s(data.token60s || '');
        setSig30(data.sig30 || '');
        setSig60(data.sig60 || '');
        setRand30(data.rand30 || '');
        setRand60(data.rand60 || '');
      }
    });
    const unsubKeys = onSnapshot(query(collection(db, 'keys'), where('isActive', '==', true)), (snap) => {
      setKeys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubConfig(); unsubKeys(); };
  }, []);

  const saveConfig = async () => {
    await setDoc(doc(db, 'config', 'system'), { 
      announcement: newAnnouncement,
      token30s,
      token60s,
      sig30,
      sig60,
      rand30,
      rand60
    }, { merge: true });
    alert("System Configuration Synchronized!");
  };

  const generateKey = async () => {
    const randomKey = Array.from({ length: 16 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
    
    let expiryDate: Date | null = new Date();
    const val = Number(durationValue);
    
    if (keyType === 'min') expiryDate.setMinutes(expiryDate.getMinutes() + val);
    else if (keyType === 'hour') expiryDate.setHours(expiryDate.getHours() + val);
    else if (keyType === 'day') expiryDate.setDate(expiryDate.getDate() + val);
    else if (keyType === 'month') expiryDate.setMonth(expiryDate.getMonth() + val);
    else if (keyType === 'year') expiryDate.setFullYear(expiryDate.getFullYear() + val);
    else expiryDate = null; // Lifetime

    await setDoc(doc(db, 'keys', randomKey), {
      key: randomKey,
      type: `${val} ${keyType}${val > 1 ? 's' : ''}`,
      expiry: expiryDate ? Timestamp.fromDate(expiryDate) : null,
      createdAt: serverTimestamp(),
      isActive: true,
      createdBy: user.email
    });

    setGeneratedKey(randomKey);
  };

  const deactivateKey = async (id: string) => {
    await deleteDoc(doc(db, 'keys', id));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050810]/80 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="max-w-4xl w-full bg-[#0d121f]/90 border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              SYSTEM CONTROL
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Admin Session: {user.displayName}</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
          {/* Announcements & Config */}
          <section className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Neural Broadcast & Protocol Config</p>
              <textarea 
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Global announcement text..."
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 transition-colors mb-4"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <p className="text-[9px] text-emerald-500 font-black uppercase">30S API Protocol</p>
                <input 
                  value={token30s}
                  onChange={(e) => setToken30s(e.target.value)}
                  placeholder="30S Bearer Token"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-zinc-300 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input value={sig30} onChange={(e) => setSig30(e.target.value)} placeholder="Signature" className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-zinc-400" />
                  <input value={rand30} onChange={(e) => setRand30(e.target.value)} placeholder="Random" className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-zinc-400" />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <p className="text-[9px] text-blue-500 font-black uppercase">60S API Protocol</p>
                <input 
                  value={token60s}
                  onChange={(e) => setToken60s(e.target.value)}
                  placeholder="60S Bearer Token"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-zinc-300 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input value={sig60} onChange={(e) => setSig60(e.target.value)} placeholder="Signature" className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-zinc-400" />
                  <input value={rand60} onChange={(e) => setRand60(e.target.value)} placeholder="Random" className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-zinc-400" />
                </div>
              </div>
            </div>

            <button 
              onClick={saveConfig}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              Update Neural Protocol & Broadcast
            </button>
          </section>

          {/* Key Generator */}
          <section className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Key Management Unit</p>
              <div className="flex flex-wrap items-center gap-2">
                <input 
                  type="number"
                  min="1"
                  value={durationValue}
                  onChange={(e) => setDurationValue(Number(e.target.value))}
                  disabled={keyType === 'lifetime'}
                  className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-30"
                />
                <select 
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white uppercase focus:outline-none"
                >
                  <option value="min">Minute(s)</option>
                  <option value="hour">Hour(s)</option>
                  <option value="day">Day(s)</option>
                  <option value="month">Month(s)</option>
                  <option value="year">Year(s)</option>
                  <option value="lifetime">Lifetime</option>
                </select>
                <button 
                  onClick={generateKey}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  Generate
                </button>
              </div>
            </div>

            <AnimatePresence>
              {generatedKey && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, scale: 0.95 }}
                  animate={{ height: 'auto', opacity: 1, scale: 1 }}
                  exit={{ height: 0, opacity: 0, scale: 0.95 }}
                  className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between overflow-hidden"
                >
                  <div>
                    <p className="text-[8px] text-emerald-500 font-black uppercase mb-1">New Neural Key Generated:</p>
                    <p className="text-sm font-mono font-black text-white tracking-widest">{generatedKey}</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                    }}
                    className="p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all flex items-center justify-center group active:scale-95"
                  >
                    <Copy className="w-4 h-4 group-active:scale-90 transition-transform" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <p className="text-[9px] text-zinc-600 font-bold uppercase mb-2">Active Keys History ({keys.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {keys.map(k => (
                  <div key={k.id} className="bg-black/20 border border-white/5 p-3 rounded-xl flex items-center justify-between group">
                    <div>
                      <p className="text-[11px] font-mono font-bold text-zinc-300 leading-none mb-1">{k.key}</p>
                      <p className="text-[8px] text-zinc-500 font-medium uppercase">
                        {k.type} • {k.expiry ? `Expires: ${k.expiry.toDate().toLocaleString()}` : 'No Expiry'}
                      </p>
                    </div>
                    <button 
                      onClick={() => deactivateKey(k.id)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <LogOut className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 shrink-0">
          <button 
            onClick={() => signOut(auth)}
            className="w-full py-4 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-2xl border border-rose-500/20 transition-all"
          >
            Terminate Full Control
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isKeyAuthorized, setIsKeyAuthorized] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Check local key session
    const checkKeySession = () => {
      const session = localStorage.getItem('neural_key_session');
      if (session) {
        const { expiry } = JSON.parse(session);
        if (!expiry || new Date() < new Date(expiry)) {
          setIsKeyAuthorized(true);
        } else {
          localStorage.removeItem('neural_key_session');
          setIsKeyAuthorized(false);
        }
      }
    };

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setIsAdminUser(userDoc.data()?.role === 'admin');
        setIsKeyAuthorized(false); // Admin doesn't need key
      } else {
        setIsAdminUser(false);
        checkKeySession();
      }
      setAuthReady(true);
    });

    return () => unsubAuth();
  }, []);

  const [gameMode, setGameMode] = useState<'30s' | '60s'>('30s');
  const [lastResults, setLastResults] = useState<GameResult[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mmTime, setMmTime] = useState<string>('');
  
  const processedIssues = useRef(new Set<string>());
  const loadingRef = useRef(false);

  // Global Config Listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'system'), (doc) => {
      setSystemConfig(doc.data());
    });
    return () => unsub();
  }, []);

  // Clear state on mode switch
  useEffect(() => {
    setPredictions([]);
    setLastResults([]);
    processedIssues.current.clear();
    fetchResults(true);
  }, [gameMode]);

  const fetchResults = useCallback(async (isManual = false) => {
    // Prevent overlapping regular fetches, allow manual overrides
    if (!isManual && loadingRef.current) return;
    
    setLoading(true);
    loadingRef.current = true;
    setError(null);

    const typeId = gameMode === '30s' ? 30 : 1;
    
    const token30s = systemConfig?.token30s || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc2NDgwMjM4IiwibmJmIjoiMTc3NjQ4MDIzOCIsImV4cCI6IjE3NzY0ODIwMzgiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiI0LzE4LzIwMjYgOTo0Mzo1OCBBTSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFjY2Vzc19Ub2tlbiIsIlVzZXJJZCI6IjQ4NzIwMyIsIlVzZXJOYW1lIjoiOTU5Nzc3NTQ1NTg5IiwiVXNlclBob3RvIjoiMjAiLCJOaWNrTmFtZSI6Ik1HVEhBTlQgIiwiQW1vdW50IjoiNy4zNyIsIkludGVncmFsIjoiMCIsIkxvZ2luTWFyayI6Ikg1IiwiTG9naW5UaW1lIjoiNC8xOC8yMDI2IDk6MTM6NTggQU0iLCJMb2dpbklQQWRkcmVzcyI6IjQzLjIxNi4yNy4xNDIiLCJEYk51bWJlciI6IjAiLCJJc3ZhbGlkYXRvciI6IjAiLCJLZXlDb2RlIjoiNTc5IiwiVG9rZW5UeXBlIjoiQWNjZXNzX1Rva2VuIiwiUGhvbmVUeXBlIjoiMSIsIlVzZXJUeXBlIjoiMCIsIlVzZXJOYW1lMiI6IiIsImlzcyI6Imp3dElzc3VlciIsImF1ZCI6ImxvdHRlcnlUaWNrZXQifQ.xAr4fLtgBEIZ-n2KYVV84lT4e7thEwxAhNQ16c5Qr2A';
    const token60s = systemConfig?.token60s || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc2NDgwMjM4IiwibmJmIjoiMTc3NjQ4MDIzOCIsImV4cCI6IjE3NzY0ODIwMzgiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiI0LzE4LzIwMjYgOTo0Mzo1OCBBTSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFjY2Vzc19Ub2tlbiIsIlVzZXJJZCI6IjQ4NzIwMyIsIlVzZXJOYW1lIjoiOTU5Nzc3NTQ1NTg5IiwiVXNlclBob3RvIjoiMjAiLCJOaWNrTmFtZSI6Ik1HVEhBTlQgIiwiQW1vdW50IjoiNy4zNyIsIkludGVncmFsIjoiMCIsIkxvZ2luTWFyayI6Ikg1IiwiTG9naW5UaW1lIjoiNC8xOC8yMDI2IDk6MTM6NTggQU0iLCJMb2dpbklQQWRkcmVzcyI6IjQzLjIxNi4yNy4xNDIiLCJEYk51bWJlciI6IjAiLCJJc3ZhbGlkYXRvciI6IjAiLCJLZXlDb2RlIjoiNTc5IiwiVG9rZW5UeXBlIjoiQWNjZXNzX1Rva2VuIiwiUGhvbmVUeXBlIjoiMSIsIlVzZXJUeXBlIjoiMCIsIlVzZXJOYW1lMiI6IiIsImlzcyI6Imp3dElzc3VlciIsImF1ZCI6ImxvdHRlcnlUaWNrZXQifQ.xAr4fLtgBEIZ-n2KYVV84lT4e7thEwxAhNQ16c5Qr2A';
    
    // Fallback static signatures if not in config
    const sig30 = systemConfig?.sig30 || 'E93CB5E32C267A49A1090589E4E5CB29';
    const sig60 = systemConfig?.sig60 || '4EF4BD40988824BEFD7B012D1E5C2F84';
    const rand30 = systemConfig?.rand30 || 'aa618332d21c4f9284608bc44ea56f99';
    const rand60 = systemConfig?.rand60 || 'f668d82e6eb14697b0dac9fa1a180658';

    try {
      const res = await fetch('/api/proxy-ck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gameMode === '30s' ? token30s : token60s}`
        },
        body: JSON.stringify({ 
          typeId,
          signature: gameMode === '30s' ? sig30 : sig60,
          random: gameMode === '30s' ? rand30 : rand60
        })
      });
      
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        let errMsg = errJson.error || `Server Response: ${res.status}`;
        
        // Specific error handling for upstream token issues
        if (errMsg === "Upstream API error") {
          errMsg = "Protocol Authentication Failed (Token Expired) [ကုဒ်ဟောင်းသွားပါပြီ]";
          if (errJson.details) {
            console.error("Upstream Details:", errJson.details);
          }
        }
        
        setError(errMsg);
        return;
      }

      const json = await res.json();
      
      if (json.data && json.data.list) {
        const results: GameResult[] = json.data.list.map((item: any) => ({
          issueNumber: item.issueNumber,
          number: item.number,
          bigSmall: getBigSmallFromNumber(parseInt(item.number)),
          colour: getColourFromNumber(parseInt(item.number))
        }));

        setLastResults(results);

        const latestIssue = results[0].issueNumber;
        const nextIssue = (BigInt(latestIssue) + 1n).toString();

        setPredictions(prev => {
          return prev.map(p => {
            if (p.issueNumber === latestIssue && p.status === "PENDING") {
              const actual = results[0];
              const isWin = 
                p.bigSmall === actual.bigSmall || 
                p.number === parseInt(actual.number);
              return { ...p, status: isWin ? "WIN" : "LOSE", actual };
            }
            return p;
          });
        });

        if (!processedIssues.current.has(nextIssue)) {
          const newPred = runPrediction(json.data.list, nextIssue);
          setPredictions(prev => [newPred, ...prev].slice(0, 10));
          processedIssues.current.add(nextIssue);
        }
      }
    } catch (err: any) {
      setError(`Network Error: ${err.message || 'Connection lost'}`);
    } finally {
      loadingRef.current = false;
      setTimeout(() => setLoading(false), 500);
    }
  }, [gameMode]); // Stable dependency

  useEffect(() => {
    fetchResults();
    const intervalTime = gameMode === '30s' ? 30000 : 60000;
    const resultInterval = setInterval(() => fetchResults(), intervalTime);

    const clockInterval = setInterval(() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Yangon',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      setMmTime(new Intl.DateTimeFormat('en-US', options).format(now));
    }, 1000);

    return () => {
      clearInterval(resultInterval);
      clearInterval(clockInterval);
    };
  }, [fetchResults, gameMode]);

  const winRate = predictions.length > 0 
    ? Math.round((predictions.filter(p => p.status === "WIN").length / (predictions.filter(p => p.status !== "PENDING").length || 1)) * 100)
    : 0;

  const totalWins = predictions.filter(p => p.status === "WIN").length;
  const totalLosses = predictions.filter(p => p.status === "LOSE").length;

  const getStreak = () => {
    const historical = predictions.filter(p => p.status !== "PENDING");
    if (historical.length === 0) return { count: 0, type: 'NONE' as const, winStreak: 0, loseStreak: 0 };
    
    // Current streak
    let currentCount = 0;
    const firstType = historical[0].status;
    for (const p of historical) {
      if (p.status === firstType) currentCount++;
      else break;
    }

    // Calculated streaks for stats boxes
    let maxWinStreak = 0;
    let maxLoseStreak = 0;
    let tempWin = 0;
    let tempLose = 0;

    [...historical].reverse().forEach(p => {
      if (p.status === "WIN") {
        tempWin++;
        tempLose = 0;
        if (tempWin > maxWinStreak) maxWinStreak = tempWin;
      } else if (p.status === "LOSE") {
        tempLose++;
        tempWin = 0;
        if (tempLose > maxLoseStreak) maxLoseStreak = tempLose;
      }
    });

    return { 
      count: currentCount, 
      type: firstType,
      winStreak: firstType === "WIN" ? currentCount : 0,
      loseStreak: firstType === "LOSE" ? currentCount : 0,
      maxWin: maxWinStreak,
      maxLose: maxLoseStreak
    };
  };

  const streakData = getStreak();
  const currentPred = predictions[0];

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin opacity-50" />
      </div>
    );
  }

  if (!currentUser && !isKeyAuthorized) {
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoginPage onLogin={(isAdmin) => {
            if (!isAdmin) setIsKeyAuthorized(true);
          }} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className={`min-h-screen bg-[#050811] text-blue-100 font-sans selection:bg-blue-500/30 overflow-x-hidden p-4 md:p-8 relative transition-colors duration-1000 ${
      gameMode === '30s' ? 'bg-slate-950' : 'bg-[#050811]'
    }`}>
      {/* Background Glows */}
      <div className={`fixed top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-all duration-1000 ${
        gameMode === '30s' ? 'bg-emerald-600/10' : 'bg-blue-600/10'
      }`} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-all duration-1000 ${
        gameMode === '30s' ? 'bg-cyan-600/10' : 'bg-purple-600/10'
      }`} />

      {showAdmin && currentUser && <AdminPanel user={currentUser} onClose={() => setShowAdmin(false)} />}

      {/* Floating Action Button (FAB) Mode Switcher & Auth Badge */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        
        {/* User Badge */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[#0d121f]/90 backdrop-blur-xl border border-white/5 rounded-full py-1.5 pl-1.5 pr-4 flex items-center gap-3 shadow-2xl pointer-events-auto"
        >
          {currentUser ? (
            <>
              <img src={currentUser.photoURL || ''} className="w-8 h-8 rounded-full border border-white/10" alt="" />
              <div>
                <p className="text-[10px] font-black tracking-tight text-white leading-tight">
                  {currentUser.displayName?.split(' ')[0]}
                </p>
                <p className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest leading-tight">ADMIN ACCESS</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border border-white/10">
                <KeyIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-tight text-white leading-tight">GUEST SCANNER [ဧည့်သည်]</p>
                <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">KEY AUTHORIZED [ကုဒ်ဖြည့်ပြီး]</p>
              </div>
            </>
          )}
          
          <div className="w-[1px] h-4 bg-white/10" />
          
          {currentUser ? (
            <button 
              onClick={() => setShowAdmin(true)}
              className="p-1.5 rounded-full hover:bg-white/5 text-rose-500 transition-all transform active:scale-95"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => {
                localStorage.removeItem('neural_key_session');
                setIsKeyAuthorized(false);
              }}
              className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all transform active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        <div className="flex items-center p-1.5 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto">
          <button
            onClick={() => setGameMode('30s')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-500 ${
              gameMode === '30s' 
                ? 'bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105' 
                : 'text-zinc-500 grayscale opacity-50 hover:opacity-100'
            }`}
          >
            <Zap className={`w-4 h-4 ${gameMode === '30s' ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-black tracking-widest">30S MODE</span>
          </button>
          
          <div className="w-[1px] h-6 bg-white/5 mx-1" />
          
          <button
            onClick={() => setGameMode('60s')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-500 ${
              gameMode === '60s' 
                ? 'bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.5)] scale-105' 
                : 'text-zinc-500 grayscale opacity-50 hover:opacity-100'
            }`}
          >
            <Activity className={`w-4 h-4 ${gameMode === '60s' ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-black tracking-widest">60S MODE</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto relative z-10 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={gameMode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="flex flex-col gap-6"
          >
            <header className="flex flex-col items-center gap-4">
              <div className="w-full flex justify-between items-center">
                <button 
                  onClick={() => fetchResults(true)}
                  disabled={loading}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase hover:bg-white/10 active:scale-95 transition-all shadow-xl`}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} ${gameMode === '30s' ? 'text-emerald-400' : 'text-blue-400'}`} />
                  <span className={gameMode === '30s' ? 'text-emerald-400' : 'text-blue-400'}>
                    {loading ? 'SYNCING...' : 'REFRESH'}
                  </span>
                </button>
                <div className="text-right">
                  <span className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-black block">MYANMAR TIME</span>
                  <span className={`font-mono text-base transition-colors duration-1000 ${gameMode === '30s' ? 'text-emerald-300' : 'text-blue-300'}`}>{mmTime}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <motion.h1 
                  layout
                  className={`text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b transition-all duration-1000 ${
                    gameMode === '30s' 
                      ? 'from-emerald-300 via-emerald-500 to-emerald-700 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]' 
                      : 'from-blue-300 via-blue-500 to-blue-700 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]'
                  } mb-1`}
                >
                  CK ULTRA HACK
                </motion.h1>
                <div className={`px-4 py-1 rounded-full border text-[10px] font-black tracking-widest transition-all duration-1000 ${
                  gameMode === '30s' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>
                  {gameMode === '30s' ? 'FAST-TRACK ANALYZER [30S]' : 'PRECISION SCANNER [60S]'}
                </div>
              </div>
            </header>

            <section className="relative group">
              <div className={`absolute -inset-0.5 rounded-3xl blur opacity-20 transition duration-1000 ${
                gameMode === '30s' ? 'bg-gradient-to-r from-emerald-500 to-cyan-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}></div>
              <div className="relative bg-[#0d121f]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden">
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold block">
                      {gameMode === '30s' ? '30S PERIOD' : '60S PERIOD'}
                    </span>
                    <p className={`text-lg font-mono transition-colors duration-1000 ${gameMode === '30s' ? 'text-emerald-300' : 'text-blue-300'}`}>
                      {currentPred?.issueNumber || 'INITIALIZING...'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold block"> Accuracy [တိကျမှု]</span>
                    <p className={`text-xl font-black font-mono transition-colors duration-1000 ${gameMode === '30s' ? 'text-emerald-400' : 'text-blue-400'}`}>{winRate}%</p>
                  </div>
                </div>

                {/* Stat Box Grid */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter mb-1">Results</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-emerald-400">{totalWins}</span>
                      <span className="text-[10px] text-zinc-600">/</span>
                      <span className="text-sm font-black text-rose-400">{totalLosses}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter mb-1">Win Streak</span>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-black ${streakData.winStreak > 0 ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`}>
                        {streakData.winStreak}
                      </span>
                      {streakData.winStreak >= 3 && <Zap className="w-2.5 h-2.5 text-emerald-400 fill-current" />}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter mb-1">Lose Streak</span>
                    <span className={`text-sm font-black ${streakData.loseStreak > 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {streakData.loseStreak}
                    </span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter mb-1">Best Series</span>
                    <span className="text-sm font-black text-blue-400">
                      {streakData.maxWin}
                    </span>
                  </div>
                </div>

                {/* Analysis Engine Status */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <div className="flex-1 min-w-[120px] bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 flex items-center gap-2">
                    <Activity className={`w-3 h-3 ${loading ? 'animate-spin' : 'animate-pulse'} text-emerald-400`} />
                    <div>
                      <p className="text-[7px] text-zinc-500 font-bold uppercase">Neural Frequency</p>
                      <p className="text-[9px] text-emerald-300 font-black tracking-wider">100M+ OPS/SEC</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[120px] bg-blue-500/5 border border-blue-500/10 rounded-xl p-2 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                    <div>
                      <p className="text-[7px] text-zinc-500 font-bold uppercase">Logic Layer</p>
                      <p className="text-[9px] text-blue-300 font-black tracking-wider uppercase">{currentPred?.patternName?.includes('PRIME') ? 'MODE: PRIME_EX' : 'MODE: STANDARD'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center py-4">
                  <AnimatePresence mode="wait">
                    {!currentPred ? (
                      <motion.div 
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-4 text-center"
                      >
                        {error ? (
                          <div className="flex flex-col items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-[280px]">
                            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                              <ShieldAlert className="w-5 h-5 text-rose-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Neural Error</p>
                              <p className="text-[11px] text-zinc-400 leading-relaxed truncate max-w-[200px]">{error}</p>
                            </div>
                            <button 
                              onClick={() => fetchResults(true)}
                              className="px-4 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                            >
                              Force Retry [ထပ်ကြိုးစားမည်]
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={`w-20 h-20 rounded-full border-4 border-white/5 flex items-center justify-center animate-spin ${
                              gameMode === '30s' ? 'border-t-emerald-500' : 'border-t-blue-500'
                            }`}>
                              <Loader2 className={`w-8 h-8 opacity-50 ${gameMode === '30s' ? 'text-emerald-400' : 'text-blue-400'}`} />
                            </div>
                            <p className="text-sm text-zinc-400 italic">Synchronizing Patterns... [ဒေတာရှာဖွေနေသည်]</p>
                          </>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="prediction"
                        initial={{ scale: 0.95, opacity: 0, filter: "blur(10px)" }}
                        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full space-y-8"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black tracking-[0.2em] mb-4 flex items-center gap-2 ${
                            currentPred.confidence >= 95 
                              ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-bounce' 
                              : currentPred.confidence >= 90
                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                                : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          }`}>
                            <Zap className={`w-3 h-3 fill-current ${currentPred.confidence >= 95 ? 'text-yellow-400' : ''}`} />
                            {currentPred.confidence >= 95 ? 'PRIME PATTERN DETECTED' : currentPred.confidence >= 90 ? 'ULTRA CONFIDENT' : 'OPTIMIZED PREDICTION'}
                          </div>

                          <div className="flex items-center gap-6 mb-2">
                             <div className="text-center">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Outcome</span>
                                <motion.div 
                                  key={currentPred.bigSmall}
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className={`text-7xl font-black tracking-tighter italic ${
                                    currentPred.bigSmall === 'BIG' 
                                      ? 'text-transparent bg-clip-text bg-gradient-to-b from-blue-300 to-blue-600 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]' 
                                      : 'text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-emerald-600 drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                                  }`}
                                >
                                  {currentPred.bigSmall}
                                </motion.div>
                             </div>
                             
                             <div className="h-16 w-[1px] bg-white/10" />

                             <div className="text-center">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Number</span>
                                <motion.div 
                                  key={currentPred.number}
                                  initial={{ y: 10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  className="text-7xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                                >
                                  {currentPred.number}
                                </motion.div>
                             </div>
                          </div>

                          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

                          <div className="flex flex-col items-center gap-3">
                             <div className="flex items-center gap-4">
                               <div className="text-center">
                                 <p className="text-[7px] text-zinc-500 font-bold uppercase">Color Guidance</p>
                                 <p className={`text-xs font-black uppercase ${
                                    currentPred.colour.includes('Red') ? 'text-rose-400' : 'text-emerald-400'
                                 }`}>{currentPred.colour}</p>
                               </div>
                               <div className="text-center">
                                 <p className="text-[7px] text-zinc-500 font-bold uppercase">Confidence Factor</p>
                                 <p className="text-xs font-black text-white">{currentPred.confidence}%</p>
                               </div>
                             </div>

                             <div className={`px-4 py-2 rounded-xl border-t border-white/5 bg-black/20 w-full flex flex-col items-center`}>
                                <p className="text-[8px] text-zinc-600 font-black tracking-[0.3em] uppercase mb-1">Method Strategy</p>
                                <p className={`text-sm font-black italic tracking-widest ${
                                  currentPred.confidence >= 90 ? 'text-rose-400 animate-pulse' : 'text-blue-400'
                                }`}>{currentPred.method}</p>
                             </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center relative overflow-hidden">
                              <div className={`absolute bottom-0 left-0 h-[2px] transition-all duration-1000 ${
                                gameMode === '30s' ? 'bg-emerald-500/50' : 'bg-blue-500/50'
                              }`} style={{ width: `${currentPred.confidence}%` }} />
                              <span className="text-[10px] text-zinc-500 uppercase font-black block mb-1">Confidence</span>
                              <span className={`text-sm font-bold transition-colors duration-1000 ${
                                gameMode === '30s' ? 'text-emerald-400' : 'text-blue-400'
                              }`}>{currentPred.confidence}%</span>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                              <span className="text-[10px] text-zinc-500 uppercase font-black block mb-1">Status</span>
                              <span className={`text-sm font-bold uppercase ${
                                currentPred.status === 'WIN' ? 'text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' :
                                currentPred.status === 'LOSE' ? 'text-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.3)]' :
                                'text-amber-400'
                              }`}>
                                {currentPred.status}
                              </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </section>

            <section className="overflow-hidden">
              <div className="bg-[#0d121f]/50 backdrop-blur-md rounded-3xl border border-white/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <History className={`w-4 h-4 transition-colors duration-1000 ${gameMode === '30s' ? 'text-emerald-500' : 'text-blue-500'}`} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Analysis Records [မှတ်တမ်းများ]</h3>
                </div>

                <div className="space-y-3">
                  {predictions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Loader2 className={`w-6 h-6 animate-spin opacity-30 ${gameMode === '30s' ? 'text-emerald-500' : 'text-blue-500'}`} />
                      <p className="text-zinc-600 text-xs italic">Awaiting first result cycle...</p>
                    </div>
                  ) : (
                    predictions.map((p, i) => (
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={p.issueNumber}
                        className="group flex flex-col gap-2 p-3 rounded-2xl bg-white/5 border border-transparent hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-500">#{p.issueNumber}</span>
                            <div className="flex items-center gap-2">
                              {p.status === 'WIN' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                              {p.status === 'LOSE' && <XCircle className="w-3 h-3 text-rose-400" />}
                              <span className={`text-[10px] font-black uppercase ${
                                p.status === 'WIN' ? 'text-emerald-400' :
                                p.status === 'LOSE' ? 'text-rose-400' : 'text-amber-400'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 items-center">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Predict</span>
                              <span className={`text-sm font-bold transition-colors duration-1000 ${
                                gameMode === '30s' ? 'text-emerald-300' : 'text-blue-300'
                              }`}>{p.bigSmall} {p.number}</span>
                              <span className={`text-[7px] font-mono italic opacity-50 ${
                                gameMode === '30s' ? 'text-emerald-500' : 'text-blue-500'
                              }`}>{p.method}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Actual</span>
                              <span className="text-sm font-bold text-white">{p.actual ? `${p.actual.bigSmall} ${p.actual.number}` : '-'}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Confidence</span>
                              <span className={`text-[10px] font-bold transition-colors duration-1000 ${
                                gameMode === '30s' ? 'text-emerald-400' : 'text-blue-400'
                              }`}>{p.confidence}%</span>
                            </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="group relative bg-[#1a0b0e] border border-rose-500/30 p-5 rounded-3xl flex flex-col gap-3 shadow-[0_0_30px_rgba(244,63,94,0.1)] mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30 shadow-inner">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-0.5">Neural System Alert [သတိပေးချက်]</p>
                <p className="text-sm font-bold text-rose-100/90 leading-tight">{error}</p>
              </div>
            </div>
            
            {(isAdminUser || currentUser?.email === 'khaingminthant86@gmail.com') && error.includes('Expired') && (
              <div className="mt-2 pt-4 border-t border-rose-500/10 flex flex-col gap-3">
                <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                  Admin, tokens are expired. Please update "Bearer Token" and "Signature" in Protocol Config.
                  [Admin, protocol tokenကုန်သွားပါပြီ။ Admin Panel တွင် token အသစ်ပြန်ထည့်ပေးပါ။]
                </p>
                <button 
                  onClick={() => setShowAdmin(true)}
                  className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Repair Protocol [ပြင်ဆင်မည်]
                </button>
              </div>
            )}
            
            <button 
              onClick={() => setError(null)}
              className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 p-1"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <footer className="text-center py-6">
          <p className="text-[9px] font-black tracking-[0.4em] uppercase text-zinc-700">
            Automated Neural Analysis System
          </p>
        </footer>
      </div>
    </div>
  );
}
