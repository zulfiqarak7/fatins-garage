import { useState, useEffect, useRef, useCallback } from 'react';

// --- Components ---

const F1Lights = ({ stage }: { stage: number }) => {
    // Stage 0: Off, 1: 1 red, 2: 2 red, ..., 5: 5 red, 6: All Off (GO!)
    const lights = [1, 2, 3, 4, 5];
    
    return (
        <div className="flex justify-center gap-2 sm:gap-4 mb-8 bg-black/40 p-4 rounded-xl border border-gray-700 w-fit mx-auto">
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

    return (
        <div className="text-7xl sm:text-9xl font-racing tracking-wider tabular-nums text-white drop-shadow-lg">
            {formatTime(time)}
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
    const [history, setHistory] = useState<number[]>([]);

    const timerRef = useRef<number | null>(null);
    const lightsRef = useRef<number | null>(null);
    
    // F1 Start Sequence Logic
    const startSequence = useCallback(() => {
        if (isRunning || isArming) return;
        
        setIsArming(true);
        setLightStage(0);
        setTime(0);

        let stage = 0;
        // Light up 1 red light every 600ms (Total 3 seconds for 5 lights)
        // @ts-ignore
        lightsRef.current = setInterval(() => {
            stage++;
            setLightStage(stage);
            
            if (stage === 5) {
                if (lightsRef.current !== null) clearInterval(lightsRef.current);
                // Random delay between 0.2s and 1.5s before lights out (Reaction test!)
                const randomDelay = Math.random() * 1000 + 500;
                
                setTimeout(() => {
                    setLightStage(6); // Lights out!
                    setIsArming(false);
                    startTimer();
                }, randomDelay);
            }
        }, 600); // 600ms * 5 = 3000ms (3 seconds)

    }, [isRunning, isArming]);

    const startTimer = () => {
        setIsRunning(true);
        const startTime = Date.now();
        // @ts-ignore
        timerRef.current = setInterval(() => {
            setTime(Date.now() - startTime);
        }, 10);
    };

    const stopTimer = useCallback(() => {
        if (timerRef.current !== null) clearInterval(timerRef.current);
        setIsRunning(false);
        setIsArming(false);
        if (lightsRef.current !== null) clearInterval(lightsRef.current);
        setLightStage(0); // Reset lights
        
        if (time > 0) {
            setHistory(prev => [time, ...prev].slice(0, 5)); // Keep last 5
        }
    }, [time]);

    // Spacebar handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
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
        <div className="min-h-screen relative overflow-hidden pb-12 bg-[#061D42] text-white font-sans">
            {/* Decorative Stripes */}
            <div className="stripe bg-[#FF1E00] right-20"></div>
            <div className="stripe bg-[#FFCC00] right-16"></div>

            {/* Header */}
            <header className="p-6 flex justify-between items-center relative z-10">
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

            <main className="max-w-4xl mx-auto px-4 relative z-10 mt-4">
                
                {/* Timer Section */}
                <div className="text-center mb-12">
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

                {/* Recent Times (Your Personal Board) */}
                {history.length > 0 && (
                    <div className="mb-12 flex justify-center gap-4 flex-wrap">
                        {history.map((t, i) => (
                            <div key={i} className="bg-[#3671C6]/20 border border-[#3671C6] px-4 py-2 rounded-lg font-mono text-[#FFCC00]">
                                {(t / 1000).toFixed(2)}s
                            </div>
                        ))}
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
                <p>Built for Fatin • Unleash the Lion</p>
            </footer>
        </div>
    );
}
