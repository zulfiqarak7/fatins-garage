import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken
} from 'firebase/auth';
import type { User } from 'firebase/auth';

import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc,
  doc,
  onSnapshot, 
  serverTimestamp, 
  query,
  Timestamp
} from 'firebase/firestore';
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDZGbav4K8Dnp5P9e-5FsHBx6A8JwNvwCs",
  authDomain: "fatins-garage.firebaseapp.com",
  projectId: "fatins-garage",
  storageBucket: "fatins-garage.firebasestorage.app",
  messagingSenderId: "656862381114",
  appId: "1:656862381114:web:25d4d9c950300dc50f2103",
  measurementId: "G-3GZTSQBC26"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Use a default app ID for your standalone version, or fallback to the environment's ID if present
const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'fatins-garage-default';

// --- Types ---
interface Solve {
    id: string;
    time: number;
    timestamp: Timestamp | null; // null for pending local writes
}

// --- Components ---

const F1Lights = ({ stage }: { stage: number }) => {
    // Stage 0: Off, 1: 1 red, 2: 2 red, ..., 5: 5 red, 6: All Off (GO!)
    const lights = [1, 2, 3, 4, 5];
    
    return (
        <div className="flex justify-center gap-2 sm:gap-4 mb-8 bg-black/40 p-4 rounded-xl border border-gray-700 w-fit mx-auto max-w-full">
            {lights.map((i) => (
                <div key={i} className="flex flex-col gap-2">
                    {/* The light housing */}
                    <div className={`light ${stage >= i && stage < 6 ? 'on' : ''}`}></div>
                </div>
            ))}
        </div>
    );
};

const TimerDisplay = ({ time }: { time: number }) => {
    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes > 0 ? minutes + ':' : ''}${seconds < 10 && minutes > 0 ? '0' : ''}${seconds}.${milliseconds < 10 ? '0' : ''}${milliseconds}`;
    };

    // Reduced to text-6xl on mobile to prevent overflow on small screens
    return (
        <div className="text-6xl sm:text-9xl font-racing tracking-wider tabular-nums text-white drop-shadow-lg break-words">
            {formatTime(time)}
        </div>
    );
};

const ProgressGraph = ({ data }: { data: Solve[] }) => {
    if (data.length === 0) return null;

    // Show message if not enough data
    if (data.length < 2) {
        return (
             <div className="w-full bg-black/20 border border-white/10 rounded-xl p-8 mb-8 backdrop-blur-sm text-center">
                <h3 className="text-sm font-racing text-gray-400 mb-2 uppercase tracking-widest">Telemetry</h3>
                <p className="text-[#FFCC00] font-mono">Complete at least 2 solves to unlock performance graph.</p>
            </div>
        );
    }

    // Use only last 20 solves for the graph to keep it readable
    const recentData = data.slice(0, 20).reverse(); 
    
    const height = 150;
    const width = 600;
    const padding = 20;

    const maxTime = Math.max(...recentData.map(d => d.time));
    const minTime = Math.min(...recentData.map(d => d.time));
    const timeRange = maxTime - minTime || 1;

    // Helper to scale Y (time)
    const getY = (val: number) => {
        const normalized = (val - minTime) / timeRange; 
        return height - padding - ((1 - normalized) * (height - (padding * 2)));
    };

    // Helper to scale X (index)
    const getX = (index: number) => {
        return padding + (index / (recentData.length - 1)) * (width - (padding * 2));
    };

    const points = recentData.map((d, i) => `${getX(i)},${getY(d.time)}`).join(' ');

    return (
        <div className="w-full max-w-full bg-black/20 border border-white/10 rounded-xl p-4 mb-8 backdrop-blur-sm overflow-hidden">
            <h3 className="text-sm font-racing text-gray-400 mb-2 uppercase tracking-widest">Telemetry (Last 20 Solves)</h3>
            <div className="w-full overflow-hidden relative" style={{ height: `${height}px` }}>
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="#ffffff10" strokeWidth="1" />
                    <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#ffffff10" strokeWidth="1" />
                    
                    {/* The Line */}
                    <polyline 
                        points={points} 
                        fill="none" 
                        stroke="#FF1E00" 
                        strokeWidth="2" 
                        vectorEffect="non-scaling-stroke"
                    />
                    
                    {/* Dots */}
                    {recentData.map((d, i) => (
                        <circle 
                            key={d.id} 
                            cx={getX(i)} 
                            cy={getY(d.time)} 
                            r="3" 
                            fill="#FFCC00" 
                        />
                    ))}
                </svg>
            </div>
        </div>
    );
};

const Leaderboard = () => {
    // Top single solve times (approximate current records)
    const records = [
        { rank: 1, name: "Xuanyi Geng", time: "3.05", event: "Shenyang Spring 2025" },
        { rank: 2, name: "Yiheng Wang", time: "3.08", event: "XMUM Cube Open 2025" },
        { rank: 3, name: "Max Park", time: "3.13", event: "Pride in Long Beach 2023" },
        { rank: 4, name: "Yusheng Du", time: "3.47", event: "Wuhu Open 2018" },
        { rank: 5, name: "Luke Garrett", time: "3.44", event: "Comp 2024" },
    ].sort((a,b) => parseFloat(a.time) - parseFloat(b.time));

    return (
        <div className="bg-white/5 border-l-4 border-[#FFCC00] p-6 rounded-r-xl shadow-lg backdrop-blur-sm">
            <h2 className="text-2xl font-racing mb-4 flex items-center gap-2">
                <span className="text-[#FFCC00]">🏆</span> World Leaderboard
            </h2>
            <div className="space-y-3">
                {records.map((rec, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm sm:text-base border-b border-white/10 pb-2 last:border-0">
                        <div className="flex items-center gap-3">
                            <span className={`font-bold w-6 text-center ${idx === 0 ? 'text-[#FFCC00]' : 'text-gray-400'}`}>
                                {idx + 1}
                            </span>
                            <span className="font-medium text-gray-200">{rec.name}</span>
                        </div>
                        <span className="font-mono font-bold text-[#FFCC00]">{rec.time}s</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TipsSection = () => {
    return (
        <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="bg-white/5 border-t-4 border-[#FF1E00] p-6 rounded-b-xl shadow-lg backdrop-blur-sm">
                <h3 className="text-xl font-racing text-[#FF1E00] mb-3">⏱️ Timing Tips</h3>
                <ul className="space-y-2 text-gray-300 text-sm leading-relaxed list-disc pl-4">
                    <li><strong className="text-white">Inspection is Key:</strong> Use the full 15 seconds. Don't just look for the cross; try to plan your first F2L pair.</li>
                    <li><strong className="text-white">The Start:</strong> In competitions, you must wait for the green light. Our 5-light countdown mimics the pressure of a race start. Breathe during the red lights.</li>
                    <li><strong className="text-white">Stopping:</strong> Practice dropping the cube gently and hitting the timer with your palms flat, just like a Stackmat.</li>
                </ul>
            </div>
            <div className="bg-white/5 border-t-4 border-[#FFCC00] p-6 rounded-b-xl shadow-lg backdrop-blur-sm">
                <h3 className="text-xl font-racing text-[#FFCC00] mb-3">🧠 Champion's Mindset</h3>
                <ul className="space-y-2 text-gray-300 text-sm leading-relaxed list-disc pl-4">
                    <li><strong className="text-white">Visualisation:</strong> Like Max visualises the track, visualise your algorithms before you execute them.</li>
                    <li><strong className="text-white">Slow is Smooth:</strong> "Smooth is fast." Don't turn as fast as you can; turn as consistently as you can to avoid lockups.</li>
                    <li><strong className="text-white">Rest:</strong> Your brain builds neural pathways while you sleep. Rest is as important as practice.</li>
                </ul>
            </div>
        </div>
    );
};

const F1CarGraphic = () => (
    <div className="relative w-full h-32 flex justify-center items-center opacity-80 my-4">
        {/* Abstract CSS F1 Car */}
        <div className="relative w-48 h-full">
            {/* Front Wing */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#061D42] border-t-2 border-[#FFCC00] transform skew-x-12 rounded"></div>
            {/* Nose */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-20 bg-[#061D42] border-x-2 border-[#FF1E00] rounded-t-3xl z-10">
                 <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-[#FFCC00] font-racing text-xl">1</div>
                 <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-[#FFCC00] rounded-full opacity-20"></div>
            </div>
            {/* Tyres */}
            <div className="absolute bottom-4 left-[-20px] w-14 h-14 bg-[#111] rounded-lg border border-gray-700 shadow-xl flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#FFCC00] rounded-full opacity-50"></div>
            </div>
            <div className="absolute bottom-4 right-[-20px] w-14 h-14 bg-[#111] rounded-lg border border-gray-700 shadow-xl flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#FFCC00] rounded-full opacity-50"></div>
            </div>
            {/* Halo/Cockpit */}
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-16 h-10 bg-[#111] rounded-t-full border-t border-gray-600"></div>
        </div>
    </div>
);

export default function App() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [lightStage, setLightStage] = useState(0); // 0-6
    const [isArming, setIsArming] = useState(false);
    
    // Firestore Data State
    const [user, setUser] = useState<User | null>(null);
    const [history, setHistory] = useState<Solve[]>([]);
    
    // Debug States
    const [authError, setAuthError] = useState<string | null>(null);
    const [dataError, setDataError] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const startTimeRef = useRef<number>(0);
    const timerRef = useRef<number | null>(null);
    const lightsRef = useRef<number | null>(null);

    // 1. Initialize Auth
    useEffect(() => {
        const initAuth = async () => {
            try {
                // If we are in the special environment with a token, use it
                if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
                    await signInWithCustomToken(auth, (window as any).__initial_auth_token);
                } else {
                    // Otherwise try anonymous auth
                    await signInAnonymously(auth);
                }
                setAuthError(null);
            } catch (err: any) {
                console.error("Auth failed", err);
                setAuthError(err.message || "Authentication failed");
            }
        };
        initAuth();

        const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
            setUser(currentUser);
            if (currentUser) setAuthError(null);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Data from Firestore
    useEffect(() => {
        if (!user) return;
        
        setIsLoadingData(true);
        setDataError(null);

        // Note: Firestore queries without composite indexes are limited. 
        // We fetch all for this user and sort in memory for this simple app.
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'solves'));

        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const solves = snapshot.docs.map((doc: DocumentData) => ({
                id: doc.id,
                ...doc.data()
            })) as Solve[];

            // Sort by timestamp descending (newest first)
            solves.sort((a, b) => {
                const ta = a.timestamp?.seconds || 0;
                const tb = b.timestamp?.seconds || 0;
                return tb - ta;
            });

            setHistory(solves);
            setIsLoadingData(false);
        }, (error: any) => {
            console.error("Data fetch error:", error);
            setDataError(error.message || "Failed to load data");
            setIsLoadingData(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    // F1 Start Sequence Logic
    const startSequence = useCallback(() => {
        if (isRunning || isArming) return;
        
        setIsArming(true);
        setLightStage(0);
        setTime(0);

        let stage = 0;
        
        // Using window.setInterval ensures it returns a number ID (not NodeJS.Timeout)
        lightsRef.current = window.setInterval(() => {
            stage++;
            setLightStage(stage);
            
            if (stage === 5) {
                if (lightsRef.current !== null) clearInterval(lightsRef.current);
                const randomDelay = Math.random() * 1000 + 500;
                
                setTimeout(() => {
                    setLightStage(6); // Lights out!
                    setIsArming(false);
                    startTimer();
                }, randomDelay);
            }
        }, 600); 

    }, [isRunning, isArming]);

    const startTimer = () => {
        setIsRunning(true);
        startTimeRef.current = Date.now();
        // Using window.setInterval ensures it returns a number ID
        timerRef.current = window.setInterval(() => {
            setTime(Date.now() - startTimeRef.current);
        }, 10);
    };

    const stopTimer = useCallback(async () => {
        if (timerRef.current !== null) clearInterval(timerRef.current);
        setIsRunning(false);
        setIsArming(false);
        if (lightsRef.current !== null) clearInterval(lightsRef.current);
        setLightStage(0); 

        // Calculate exact time based on Start Time Ref
        const finalTime = Date.now() - startTimeRef.current;
        setTime(finalTime);
        
        if (finalTime > 0 && user) {
            // Save to Firestore
            try {
                await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'solves'), {
                    time: finalTime,
                    timestamp: serverTimestamp()
                });
            } catch (e: any) {
                console.error("Error saving time:", e);
                setDataError("Failed to save: " + e.message);
            }
        }
    }, [user]); 

    // Clear History Logic
    const clearHistory = async () => {
        if (!user || history.length === 0) return;
        
        // Use browser confirm for safety
        if (window.confirm("CONFIRM: Delete all race telemetry? This action is permanent.")) {
            try {
                // Delete all documents in the history
                const deletePromises = history.map(solve => 
                    deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'solves', solve.id))
                );
                await Promise.all(deletePromises);
            } catch (e: any) {
                console.error("Error clearing history:", e);
                setDataError("Failed to clear data: " + e.message);
            }
        }
    };

    // Spacebar handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); 
                if (isRunning) {
                    stopTimer();
                } else if (!isArming) {
                    startSequence();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRunning, isArming, startSequence, stopTimer]);


    return (
        <div className="min-h-screen relative overflow-x-hidden pb-12 bg-[#061D42] text-white font-sans w-full">
            {/* Decorative Stripes */}
            <div className="stripe bg-[#FF1E00] right-20"></div>
            <div className="stripe bg-[#FFCC00] right-16"></div>

            {/* Header */}
            <header className="p-6 flex justify-between items-center relative z-10 w-full max-w-full">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-racing italic bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        FATIN'S <span className="text-[#FF1E00]">GARAGE</span>
                    </h1>
                    <p className="text-xs text-[#FFCC00] tracking-widest uppercase mt-1">Speedcubing Telemetry</p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-2xl font-bold text-gray-400">#1</div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 relative z-10 mt-4 w-full overflow-hidden">
                
                {/* ERROR BANNERS */}
                {authError && (
                    <div className="bg-red-500/80 border border-red-400 text-white p-4 rounded-lg mb-6 text-center">
                        <strong>⚠️ Authentication Error:</strong> {authError}
                        <br/><span className="text-sm">Please enable "Anonymous Authentication" in your Firebase Console.</span>
                    </div>
                )}
                {dataError && (
                    <div className="bg-yellow-500/80 border border-yellow-400 text-black p-4 rounded-lg mb-6 text-center">
                        <strong>⚠️ Database Error:</strong> {dataError}
                        <br/><span className="text-sm">Check your Firestore Security Rules are set to Test Mode.</span>
                    </div>
                )}

                {/* Timer Section */}
                <div className="text-center mb-8">
                    <F1Lights stage={lightStage} />
                    
                    <div 
                        className="cursor-pointer py-10 transition-transform active:scale-95 select-none"
                        onClick={isRunning ? stopTimer : startSequence}
                    >
                        <TimerDisplay time={time} />
                        
                        <div className="mt-4 h-8">
                            {isArming && <span className="text-[#FFCC00] font-bold animate-pulse">PREPARE TO START...</span>}
                            {isRunning && <span className="text-[#FF1E00] font-bold">SOLVE IN PROGRESS</span>}
                            {!isRunning && !isArming && time === 0 && <span className="text-gray-500 text-sm">PRESS SPACE OR TAP TO START SEQUENCE</span>}
                            {!isRunning && !isArming && time > 0 && <span className="text-green-400 text-sm">FINISH</span>}
                        </div>
                    </div>
                </div>

                {/* Progress Graph */}
                <ProgressGraph data={history} />

                {/* Recent Times (Horizontal List) */}
                {isLoadingData ? (
                    <div className="mb-12 text-center text-[#FFCC00] animate-pulse">
                        Connecting to Telemetry...
                    </div>
                ) : history.length > 0 ? (
                    <div className="mb-12 w-full max-w-full">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="text-xs text-gray-400 uppercase tracking-widest">Recent Solves</h3>
                            <button 
                                onClick={clearHistory}
                                className="text-xs text-red-500/70 hover:text-red-500 font-mono transition-colors"
                            >
                                [CLEAR DATA]
                            </button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar w-full">
                            {history.slice(0, 10).map((t) => (
                                <div key={t.id} className="flex-shrink-0 bg-[#3671C6]/20 border border-[#3671C6] px-4 py-2 rounded-lg font-mono text-[#FFCC00]">
                                    {(t.time / 1000).toFixed(2)}s
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                     <div className="mb-12 text-center text-gray-500 text-sm italic">
                        {dataError ? "Telemetry offline." : "No previous times found. Complete a solve to begin your career."}
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {/* Left Col: Leaderboard */}
                    <div className="lg:col-span-1">
                        <Leaderboard />
                    </div>

                    {/* Center/Right: Graphics & Tips */}
                    <div className="lg:col-span-2">
                        <F1CarGraphic />
                        <TipsSection />
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="mt-20 text-center text-gray-600 text-sm p-4 border-t border-white/5 relative z-10">
                <p>
                    Built for Fatin • Unleash the Lion • 
                    {user ? <span className="text-green-500"> Driver ID: {user.uid.slice(0,6)}...</span> : <span className="text-red-500"> Not Connected</span>}
                </p>
            </footer>
        </div>
    );
}
