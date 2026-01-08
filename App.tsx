import React, { useState, useEffect, useRef } from 'react';
import { ElementType, GameState, GridPosition, Orb, Particle, FloatingText, Language } from './types';
import { GRID_SIZE, ELEMENT_CONFIG, TEXT, GAME_DURATION, MIN_MATCH_LENGTH, BOMB_THRESHOLD, FEVER_DURATION } from './constants';
import { audio } from './utils/audio';
import ParticleSystem from './components/Particles';
import OrbVisual from './components/OrbVisual';
import { Timer, RotateCcw, Sparkles, Zap, Bomb } from 'lucide-react';

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const getRandomType = (): ElementType => {
  const types = Object.values(ElementType).filter(t => t !== ElementType.PRISM);
  return types[Math.floor(Math.random() * types.length)];
};

const createBoard = (size: number): Orb[][] => {
  const board: Orb[][] = [];
  for (let r = 0; r < size; r++) {
    const row: Orb[] = [];
    for (let c = 0; c < size; c++) {
      row.push({
        id: generateId(),
        type: getRandomType(),
        position: { row: r, col: c },
        isMatched: false,
        isHint: false,
        isBomb: false
      });
    }
    board.push(row);
  }
  return board;
};

const isAdjacent = (p1: GridPosition, p2: GridPosition): boolean => {
  const dr = Math.abs(p1.row - p2.row);
  const dc = Math.abs(p1.col - p2.col);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
};

// --- Main Component ---
export default function App() {
  // State
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [board, setBoard] = useState<Orb[][]>([]);
  const [selection, setSelection] = useState<Orb[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [language, setLanguage] = useState<Language>('en');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [shake, setShake] = useState(false);
  const [hardShake, setHardShake] = useState(false); // For Fever
  const [fingerPos, setFingerPos] = useState({ x: 0, y: 0 }); // Track finger for cursor
  
  // Game Juice States
  const [level, setLevel] = useState(1);
  const [nextLevelScore, setNextLevelScore] = useState(1000);
  const [feverValue, setFeverValue] = useState(0); 
  const [isFever, setIsFever] = useState(false);
  
  // Refs
  const selectionRef = useRef<Orb[]>([]);
  const isDragging = useRef(false);
  const lastOrbRef = useRef<Orb | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const feverTimerRef = useRef<number | null>(null);

  // --- Visual Systems Logic (Particles & Text) ---
  const spawnParticles = (x: number, y: number, color: string, count: number = 10, explosive: boolean = false) => {
    const newParticles: Particle[] = [];
    const multiplier = isFever ? 3 : 1; 
    for (let i = 0; i < count * multiplier; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = explosive ? Math.random() * 8 + 4 : Math.random() * 4 + 1;
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed * (isFever ? 2 : 1),
        vy: Math.sin(angle) * speed * (isFever ? 2 : 1),
        life: 1.0,
        maxLife: 1.0,
        color,
        size: explosive ? Math.random() * 12 + 6 : Math.random() * 6 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string = '#fff', scale: number = 1) => {
      setFloatingTexts(prev => [...prev, {
          id: Math.random(),
          x,
          y,
          text,
          color,
          life: 1.0,
          scale
      }]);
  };

  const spawnFireworks = () => {
      const colors = ['#f59e0b', '#06b6d4', '#4ade80', '#d8b4fe', '#f43f5e', '#ffffff'];
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const count = isFever ? 25 : 8; 
      for (let i = 0; i < count; i++) {
          setTimeout(() => {
              const x = cx + (Math.random() - 0.5) * window.innerWidth * 0.9;
              const y = cy + (Math.random() - 0.5) * window.innerHeight * 0.9;
              const color = colors[Math.floor(Math.random() * colors.length)];
              spawnParticles(x, y, color, 40, true);
          }, i * (isFever ? 50 : 150));
      }
  };

  const updateVisuals = () => {
    // Particles - Add gravity
    setParticles(prev => prev.map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy + (isFever ? 0.1 : 0.3), // Lower gravity in fever for more chaos
      vx: p.vx * 0.95, // Friction
      vy: p.vy * 0.95, // Friction
      life: p.life - (isFever ? 0.015 : 0.02), // Last longer in fever
      size: p.size * 0.94
    })).filter(p => p.life > 0));

    // Floating Texts
    setFloatingTexts(prev => prev.map(t => ({
        ...t,
        y: t.y - 0.5, // Float up slower (was 1.5)
        life: t.life - 0.008 // Decay much slower to stay for ~2 seconds
    })).filter(t => t.life > 0));
  };

  useEffect(() => {
    let animationFrameId: number;
    const loop = () => {
      updateVisuals();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isFever]); // Re-bind when fever changes

  // --- Game Timer ---
  useEffect(() => {
    let timer: number | undefined;
    if (gameState === GameState.PLAYING) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState(GameState.GAME_OVER);
            audio.stopBGM();
            if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // Remove shake class
  useEffect(() => {
    if (shake) {
        const t = setTimeout(() => setShake(false), 400);
        return () => clearTimeout(t);
    }
  }, [shake]);

  // Remove hard shake class
  useEffect(() => {
    if (hardShake) {
        const t = setTimeout(() => setHardShake(false), 200); 
        return () => clearTimeout(t);
    }
  }, [hardShake]);


  // --- Logic for Level Up & Fever ---
  const checkLevelUp = (currentScore: number) => {
    if (currentScore >= nextLevelScore) {
        setLevel(prev => prev + 1);
        setNextLevelScore(prev => prev + Math.floor(prev * 1.5));
        // Visuals removed as requested to avoid confusion
        // audio.playLevelUp();
        // spawnParticles(window.innerWidth / 2, window.innerHeight / 2, '#fbbf24', 50, true);
        // spawnFloatingText(window.innerWidth/2, window.innerHeight/2, "LEVEL UP!", "#fbbf24", 2);
    }
  };

  const addFever = (amount: number) => {
      if (isFever) return;
      setFeverValue(prev => {
          const newVal = Math.min(prev + amount, 100);
          if (newVal >= 100) {
              startFever();
              return 100;
          }
          return newVal;
      });
  };

  const startFever = () => {
      setIsFever(true);
      audio.setFeverBGM(true);
      audio.playFeverStart();
      setHardShake(true); // Initial bang
      spawnFloatingText(window.innerWidth/2, window.innerHeight/3, TEXT[language].fever, "#d8b4fe", 3);
      spawnFireworks();
      
      feverTimerRef.current = setTimeout(() => {
          setIsFever(false);
          setFeverValue(0);
          audio.setFeverBGM(false);
      }, FEVER_DURATION * 1000);
  };

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy') => {
      if (navigator.vibrate) {
          switch(style) {
              case 'light': navigator.vibrate(5); break;
              case 'medium': navigator.vibrate(15); break;
              case 'heavy': navigator.vibrate([20, 10, 20]); break;
          }
      }
  };

  // --- Core Gameplay Logic ---

  const executeMatches = (matchChain: Orb[], bombOrigin: GridPosition | null = null) => {
      // 1. Calculate Score
      // NEW FORMULA: (Length * 100) * (Length - 2)
      const length = matchChain.length;
      let calculatedScore = (length * 100) * Math.max(1, length - 2);
      
      // Bomb Bonus Calculation
      const bombInChain = matchChain.find(o => o.type === ElementType.PRISM);
      if (bombInChain) {
          calculatedScore += 1000;
      }

      // Apply Fever Multiplier immediately for consistency
      if (isFever) calculatedScore *= 2;
      
      // Bomb Logic
      let isBombExplosion = false;
      const explosionIds = new Set<string>();

      if (bombInChain) {
          isBombExplosion = true;
          
          audio.playExplosion();
          triggerHaptic('heavy');
          
          // Display Score with Blast Text
          if (isFever) {
              setHardShake(true);
              spawnFireworks();
              spawnFloatingText(window.innerWidth/2, window.innerHeight/2, `GIGA BLAST x2!\n+${calculatedScore.toLocaleString()}`, "#ffffff", 4);
          } else {
              setShake(true);
              spawnFireworks();
              spawnFloatingText(window.innerWidth/2, window.innerHeight/2, `MEGA BOOM!\n+${calculatedScore.toLocaleString()}`, "#d946ef", 2.5);
          }

          // Bomb Area (Radius 1 for Normal, Radius 2 for Fever)
          const center = bombInChain.position;
          const radius = isFever ? 2 : 1; 
          
          for (let r = center.row - radius; r <= center.row + radius; r++) {
              for (let c = center.col - radius; c <= center.col + radius; c++) {
                  const target = board[r]?.[c];
                  if (target) {
                      explosionIds.add(target.id);
                      // Visuals for exploded items
                      const rect = document.getElementById(`orb-${target.id}`)?.getBoundingClientRect();
                      if (rect) spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, ELEMENT_CONFIG[target.type].color, isFever ? 12 : 8, true);
                  }
              }
          }
      } else {
          audio.playMatch(matchChain.length);
          triggerHaptic('medium');
          // Standard match text
          const lastOrb = matchChain[matchChain.length - 1];
          const rect = document.getElementById(`orb-${lastOrb.id}`)?.getBoundingClientRect();
          if (rect) {
             let txt = `+${calculatedScore.toLocaleString()}`;
             
             if (isFever) {
                 if (matchChain.length >= 5) {
                    txt = `${TEXT[language].bonus} x2!\n+${calculatedScore.toLocaleString()}`;
                 } else {
                    txt = `FEVER x2!\n+${calculatedScore.toLocaleString()}`;
                 }
             } else if (matchChain.length >= 5) {
                // Show HAPPY/BONUS text with score
                txt = `${TEXT[language].bonus}\n+${calculatedScore.toLocaleString()}`;
             }
             
             // Gold text in fever, else element color
             const color = isFever ? '#fcd34d' : ELEMENT_CONFIG[matchChain[0].type].color;
             spawnFloatingText(rect.left, rect.top, txt, color, matchChain.length >= 5 ? 1.5 : 1);
          }
      }

      const newScore = score + calculatedScore;
      setScore(newScore);
      checkLevelUp(newScore);
      addFever(matchChain.length * (isBombExplosion ? 3 : 1.5));
      
      if (matchChain.length >= 5) setShake(true);

      // Check for bomb CREATION (only if not a bomb explosion)
      let spawnNewBombAt: GridPosition | null = null;
      if (!isBombExplosion && matchChain.length >= BOMB_THRESHOLD) {
          spawnNewBombAt = matchChain[matchChain.length - 1].position;
      }

      // 2. Visuals for chain
      matchChain.forEach(orb => {
        const rect = document.getElementById(`orb-${orb.id}`)?.getBoundingClientRect();
        if (rect) spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, ELEMENT_CONFIG[orb.type].color, isFever ? 20 : 12, true);
      });

      // 3. Board Update (Remove & Refill)
      setBoard(prevBoard => {
        const newBoard = [...prevBoard.map(row => [...row])];
        
        // Items to remove: The chain + bomb explosion area
        const itemsToRemove = new Set([...matchChain.map(o => o.id), ...Array.from(explosionIds)]);
        
        for (let c = 0; c < GRID_SIZE; c++) {
          let newCol: Orb[] = [];
          
          // Filter out removed items
          for (let r = 0; r < GRID_SIZE; r++) {
            const orb = newBoard[r][c];
            if (!itemsToRemove.has(orb.id)) {
              newCol.push(orb);
            } else if (spawnNewBombAt && orb.position.row === spawnNewBombAt.row && orb.position.col === spawnNewBombAt.col) {
               // Transform into bomb
               newCol.push({
                   ...orb,
                   id: generateId(),
                   type: ElementType.PRISM
               });
               spawnNewBombAt = null; // Consumed
            }
          }
          
          // Fill top with new items
          const missingCount = GRID_SIZE - newCol.length;
          for (let i = 0; i < missingCount; i++) {
             newCol.unshift({
               id: generateId(),
               type: getRandomType(),
               position: { row: -1, col: c },
               isMatched: false,
               isHint: false,
               isBomb: false
             });
          }
          
          // Place back into grid
          for (let r = 0; r < GRID_SIZE; r++) {
            newBoard[r][c] = { ...newCol[r], position: { row: r, col: c } };
          }
        }
        return newBoard;
      });

      // Reset selection
      setSelection([]);
      selectionRef.current = [];
      lastOrbRef.current = null;
  };

  // --- Interaction Handlers ---

  const snapToOrb = (orbId: string) => {
    const el = document.getElementById(`orb-${orbId}`);
    if (el) {
        const rect = el.getBoundingClientRect();
        setFingerPos({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        });
    }
  };

  const startGame = () => {
    audio.init();
    audio.playSelect();
    audio.playBGM(false);
    setBoard(createBoard(GRID_SIZE));
    setScore(0);
    setLevel(1);
    setNextLevelScore(1000);
    setFeverValue(0);
    setIsFever(false);
    setTimeLeft(GAME_DURATION);
    setGameState(GameState.PLAYING);
    setFloatingTexts([]);
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, '#ffffff', 20, true);
  };

  const handleStart = (orb: Orb, clientX: number, clientY: number) => {
    if (gameState !== GameState.PLAYING) return;

    // INSTANT BOMB TRIGGER: If tapping a prism, explode immediately
    if (orb.type === ElementType.PRISM) {
        executeMatches([orb]);
        return;
    }

    isDragging.current = true;
    setSelection([orb]);
    selectionRef.current = [orb];
    lastOrbRef.current = orb;
    snapToOrb(orb.id); // Snap cursor to orb center
    
    audio.playConnect(0);
    triggerHaptic('light');
    
    const rect = document.getElementById(`orb-${orb.id}`)?.getBoundingClientRect();
    if (rect) spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, ELEMENT_CONFIG[orb.type].color, 5);
  };

  const handleMove = (orb: Orb, clientX: number, clientY: number) => {
    if (!isDragging.current || gameState !== GameState.PLAYING) return;
    snapToOrb(orb.id); // Snap cursor to orb center
    
    // FEVER JUICE: Sparkler effect on finger drag (using snapped pos)
    if (isFever && Math.random() > 0.5) {
        const el = document.getElementById(`orb-${orb.id}`);
        if (el) {
            const rect = el.getBoundingClientRect();
            spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '#ffffff', 2);
        }
    }

    const currentSelection = selectionRef.current;
    const lastOrb = currentSelection[currentSelection.length - 1];

    // Backtracking
    if (currentSelection.length > 1 && currentSelection[currentSelection.length - 2].id === orb.id) {
      const newSel = currentSelection.slice(0, -1);
      setSelection(newSel);
      selectionRef.current = newSel;
      lastOrbRef.current = newSel[newSel.length - 1];
      audio.playConnect(newSel.length - 1);
      triggerHaptic('light');
      return;
    }

    // INSTANT BOMB TRIGGER: If dragging INTO a prism, add it and explode immediately
    if (orb.type === ElementType.PRISM && isAdjacent(lastOrb.position, orb.position)) {
        isDragging.current = false; // Stop dragging
        const finalSelection = [...currentSelection, orb];
        setSelection(finalSelection);
        executeMatches(finalSelection);
        return;
    }

    // Normal Matching Logic
    if (
      orb.id !== lastOrb.id &&
      orb.type === lastOrb.type && // Only same type (Prism handled above)
      !currentSelection.find(o => o.id === orb.id) &&
      isAdjacent(lastOrb.position, orb.position)
    ) {
      const newSel = [...currentSelection, orb];
      setSelection(newSel);
      selectionRef.current = newSel;
      lastOrbRef.current = orb;
      
      const rect = document.getElementById(`orb-${orb.id}`)?.getBoundingClientRect();
      if (rect) spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, ELEMENT_CONFIG[orb.type].color, 5);
      
      audio.playConnect(newSel.length - 1);
      triggerHaptic('light');
    }
  };

  const handleEnd = () => {
    isDragging.current = false;
    const currentSelection = selectionRef.current;
    
    if (currentSelection.length >= MIN_MATCH_LENGTH) {
        executeMatches(currentSelection);
    } else {
        // Cancel selection
        setSelection([]);
        selectionRef.current = [];
        lastOrbRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const orbElement = element?.closest('[data-orb-id]');
      const orbId = orbElement?.getAttribute('data-orb-id');

      if (orbId) {
          let foundOrb = null;
          board.forEach(row => row.forEach(o => {
              if (o.id === orbId) foundOrb = o;
          }));
          if (foundOrb) handleStart(foundOrb, touch.clientX, touch.clientY);
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const orbElement = element?.closest('[data-orb-id]');
    const orbId = orbElement?.getAttribute('data-orb-id');

    if (orbId) {
        let foundOrb = null;
        board.forEach(row => row.forEach(o => {
            if (o.id === orbId) foundOrb = o;
        }));
        if (foundOrb) {
             handleMove(foundOrb, touch.clientX, touch.clientY);
             return; // If on orb, cursor is snapped inside handleMove
        }
    }
    
    // Only update to raw finger pos if NOT on an orb (optional, keeps cursor visible)
    if (isDragging.current) {
         setFingerPos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const getLinePath = () => {
    if (selection.length < 2) return '';
    const cellSize = 100 / GRID_SIZE;
    return selection.map(orb => {
        const x = (orb.position.col * cellSize) + (cellSize / 2);
        const y = (orb.position.row * cellSize) + (cellSize / 2);
        return `${x},${y}`;
    }).join(' ');
  };

  const t = TEXT[language];
  const activeColor = selection.length > 0 ? ELEMENT_CONFIG[selection[0].type].color : '#fff';

  // Fever Rainbow Gradient Background
  const feverBgClass = isFever 
    ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-[length:200%_200%] animate-rainbow-rush" 
    : "bg-[#020617]";

  return (
    <div 
      className={`relative w-full h-screen overflow-hidden select-none font-sans transition-colors duration-500 ${feverBgClass}`}
      style={{
          // Dynamic Ambient Background (Only show normal gradient when not in fever)
          background: selection.length > 0 && !isFever
              ? `radial-gradient(circle at center, ${activeColor}33 0%, #020617 80%)` 
              : undefined
      }}
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
    >
      <ParticleSystem particles={particles} />

      {/* Speed Lines Overlay (Comic Book Effect) during Fever */}
      {isFever && <div className="absolute inset-0 z-0 bg-speed-lines animate-speed-lines pointer-events-none opacity-50 mix-blend-overlay"></div>}

      {/* Floating Text Overlay */}
      {floatingTexts.map(txt => (
          <div 
            key={txt.id}
            className={`absolute pointer-events-none z-50 font-black text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] animate-bounce-text whitespace-pre-wrap text-center leading-none ${isFever ? 'chromatic-aberration text-3xl' : ''}`}
            style={{ 
                left: txt.x, 
                top: txt.y, 
                color: txt.color, 
                opacity: txt.life,
                transform: `translate(-50%, -50%) scale(${txt.scale})`
            }}
          >
              {txt.text}
          </div>
      ))}

      {/* Cursor Follower */}
      {gameState === GameState.PLAYING && isDragging.current && (
        <div 
            className="fixed pointer-events-none z-50 transition-transform duration-75"
            style={{
                left: fingerPos.x,
                top: fingerPos.y,
                width: '60px',
                height: '60px',
                transform: 'translate(-50%, -50%)',
            }}
        >
            <div className={`w-full h-full rounded-full border-4 border-white opacity-40 animate-ping`} style={{ borderColor: activeColor }}></div>
            <div className={`absolute inset-0 rounded-full border-2 border-white opacity-80`} style={{ borderColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }}></div>
        </div>
      )}

      {/* Dynamic Background Flash overlay & Fever Overlay Text */}
      <div className="absolute inset-0 pointer-events-none transition-colors duration-500 flex items-center justify-center overflow-hidden"
           style={{ background: selection.length > 0 ? `radial-gradient(circle at center, ${activeColor}, transparent 70%)` : '' }}>
         {isFever && (
             <h1 className="text-9xl font-black text-white/10 -rotate-12 select-none animate-heartbeat transform scale-150 absolute z-0 mix-blend-overlay">FEVER</h1>
         )}
      </div>

      <div className={`relative z-10 flex flex-col items-center justify-center h-full max-w-md mx-auto p-4 transition-transform ${shake ? 'shake' : ''}`}>
        
        {/* HUD - NOW RECEIVES THE SHAKE EFFECTS */}
        <div className={`w-full flex flex-col gap-2 mb-4 transition-transform duration-200 ${isFever ? 'scale-105' : ''} ${shake ? 'shake' : ''} ${hardShake ? 'shake-hard' : ''}`}>
             {/* Score and Time Row */}
            <div className={`w-full flex justify-between items-center bg-slate-900/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-300 ${isFever ? 'border-yellow-400 border-4 bg-slate-900/90 shadow-[0_0_30px_rgba(234,179,8,0.5)]' : ''}`}>
                {isFever && <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-purple-500/20 to-yellow-500/20 animate-pulse"></div>}
                
                <div className="flex flex-col z-10">
                    <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">{t.level} {level}</span>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-mono font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] ${isFever ? 'text-yellow-300 chromatic-aberration text-4xl' : 'text-white'}`}>{score.toLocaleString()}</span>
                        {isFever && (
                            <div className="flex items-center text-yellow-400 font-black text-lg animate-bounce">
                                <Zap size={16} fill="currentColor" /> x2
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-col items-end z-10">
                    <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">{t.time}</span>
                    <div className={`flex items-center gap-2 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        <Timer size={18} />
                        <span className="text-2xl font-mono font-bold">{timeLeft}</span>
                    </div>
                </div>
            </div>

            {/* Fever Status Indicators */}
            {gameState === GameState.PLAYING && (
                <div className="w-full flex justify-between gap-2 h-8"> 
                    {/* Score Multiplier Indicator */}
                    <div className={`flex-1 rounded-lg flex items-center justify-center border transition-all duration-300 ${isFever ? 'bg-yellow-500/80 border-yellow-400 opacity-100 shadow-[0_0_15px_rgba(250,204,21,0.6)] transform -rotate-1 scale-105' : 'bg-slate-800/50 border-white/5 opacity-40 grayscale'}`}>
                        <span className={`flex items-center gap-1 font-black text-xs uppercase tracking-tighter ${isFever ? 'text-black animate-pulse' : 'text-slate-500'}`}>
                            <Zap size={14} fill="currentColor" /> SCORE x2
                        </span>
                    </div>
                    
                    {/* Bomb Power Indicator */}
                    <div className={`flex-1 rounded-lg flex items-center justify-center border transition-all duration-300 ${isFever ? 'bg-purple-500/80 border-purple-400 opacity-100 shadow-[0_0_15px_rgba(192,132,252,0.6)] transform rotate-1 scale-105' : 'bg-slate-800/50 border-white/5 opacity-40 grayscale'}`}>
                         <span className={`flex items-center gap-1 font-black text-xs uppercase tracking-tighter ${isFever ? 'text-black animate-pulse' : 'text-slate-500'}`}>
                            <Bomb size={14} fill="currentColor" /> GIGA BOMBS
                        </span>
                    </div>
                </div>
            )}

            {/* Fever Bar */}
            {gameState === GameState.PLAYING && (
                <div className={`w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/10 relative ${isFever ? 'shadow-[0_0_20px_#fff] border-white' : ''}`}>
                     <div 
                        className={`h-full transition-all duration-300 ${isFever ? 'bg-white animate-pulse' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                        style={{ width: `${isFever ? 100 : feverValue}%` }}
                     ></div>
                </div>
            )}
        </div>

        {/* Game Area - NO SHAKE HERE for better playability */}
        <div 
            ref={containerRef}
            className={`relative w-full aspect-square bg-slate-900/40 rounded-3xl p-3 shadow-2xl border backdrop-blur-sm transition-all duration-300 ${isFever ? 'border-white border-4 shadow-[0_0_60px_rgba(255,255,255,0.3)]' : 'border-white/5'}`}
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >
          {gameState === GameState.PLAYING && (
              <>
                 <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Outer Glow */}
                    <polyline 
                        points={getLinePath()} 
                        fill="none" 
                        stroke={activeColor}
                        strokeWidth={isFever ? "16" : "12"}
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="opacity-40 blur-md transition-all duration-100"
                    />
                    {/* Main Beam */}
                    <polyline 
                        points={getLinePath()} 
                        fill="none" 
                        stroke={activeColor}
                        strokeWidth={isFever ? "6" : "4"}
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transition-all duration-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                    />
                    {/* Energy Flow */}
                    <polyline 
                        points={getLinePath()} 
                        fill="none" 
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        strokeDasharray="10 15" 
                        className={`animate-flow opacity-80 ${isFever ? 'animate-pulse' : ''}`}
                    />
                 </svg>

                <div 
                    className="grid w-full h-full gap-2"
                    style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
                >
                    {board.map((row, r) => (
                    row.map((orb, c) => {
                        const isSelected = selection.find(s => s.id === orb.id);
                        const isLastSelected = selection.length > 0 && selection[selection.length - 1].id === orb.id;
                        
                        return (
                        <div
                            key={orb.id}
                            id={`orb-${orb.id}`}
                            data-orb-id={orb.id}
                            onMouseDown={(e) => handleStart(orb, e.clientX, e.clientY)}
                            onMouseEnter={(e) => handleMove(orb, e.clientX, e.clientY)}
                            className={`
                                relative flex items-center justify-center
                                cursor-pointer select-none transition-transform duration-200
                                ${isSelected ? 'scale-110 animate-jelly' : 'scale-100 hover:scale-105 active:scale-95'}
                                ${isLastSelected ? 'z-20' : isSelected ? 'z-10' : ''}
                                animate-pop-in
                            `}
                        >
                            <div className="w-[90%] h-[90%] relative">
                                <OrbVisual type={orb.type} selected={!!isSelected} isFever={isFever} />
                            </div>

                            {/* Combo Text - Attached to the Last Orb in Chain */}
                            {isLastSelected && selection.length >= 3 && (
                                <div className={`absolute ${isFever ? '-top-14' : '-top-8'} left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap ${isFever ? 'animate-tremble' : 'animate-bounce-text'}`}>
                                     {/* Outer Stroke (Black) */}
                                     <div className="relative">
                                        <span 
                                            className={`absolute top-0 left-0 ${isFever ? 'text-6xl' : 'text-2xl'} font-black italic tracking-tighter transition-all duration-300`}
                                            style={{ 
                                                WebkitTextStroke: isFever ? '8px black' : '4px black',
                                                color: 'transparent',
                                                zIndex: -2
                                            }}
                                         >
                                           LINK {selection.length}
                                         </span>
                                         
                                        {/* Inner Stroke */}
                                        <span 
                                            className={`absolute top-0 left-0 ${isFever ? 'text-6xl' : 'text-2xl'} font-black italic tracking-tighter transition-all duration-300`}
                                            style={{ 
                                                WebkitTextStroke: isFever ? '4px #fcd34d' : '2px white',
                                                color: 'transparent',
                                                zIndex: -1
                                            }}
                                         >
                                           LINK {selection.length}
                                         </span>

                                         {/* Main Gradient Fill */}
                                         <span 
                                            className={`relative ${isFever ? 'text-6xl' : 'text-2xl'} font-black italic tracking-tighter text-transparent bg-clip-text transition-all duration-300`}
                                            style={{ 
                                                backgroundImage: isFever 
                                                    ? 'linear-gradient(180deg, #fff 0%, #facc15 40%, #ea580c 100%)' 
                                                    : `linear-gradient(180deg, #fff 30%, ${activeColor} 100%)`, 
                                                filter: isFever ? 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.8))' : 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))'
                                            }}
                                         >
                                           LINK {selection.length}
                                         </span>
                                         
                                         {/* Fever Extra Stars */}
                                         {isFever && (
                                             <>
                                                 <span className="absolute -top-4 -left-6 text-3xl animate-spin-slow">✨</span>
                                                 <span className="absolute -bottom-2 -right-6 text-3xl animate-pulse">🎉</span>
                                             </>
                                         )}
                                     </div>
                                </div>
                            )}

                        </div>
                        );
                    })
                    ))}
                </div>
              </>
          )}

          {gameState === GameState.MENU && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/70 rounded-3xl backdrop-blur-md p-6 text-center animate-fade-in border border-white/10">
                 <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-4 tracking-tight drop-shadow-lg">
                     {t.title}
                 </h1>
                 <p className="text-slate-300 mb-8 font-medium">{t.tutorial}</p>
                 
                 <button 
                    onClick={startGame}
                    className="group relative px-10 py-4 bg-white text-black font-bold text-xl rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors">
                        <Sparkles size={24} /> {t.start}
                    </span>
                 </button>
             </div>
          )}

          {gameState === GameState.GAME_OVER && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80 rounded-3xl backdrop-blur-md p-6 text-center animate-fade-in">
                 <h2 className="text-5xl font-black text-white mb-2 drop-shadow-xl">{t.gameOver}</h2>
                 <div className="flex flex-col items-center gap-2 mb-8">
                     <span className="text-slate-400 uppercase tracking-widest text-xs font-bold">{t.finalScore}</span>
                     <span className="text-6xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 font-mono font-bold drop-shadow-lg">{score.toLocaleString()}</span>
                     <span className="text-sm text-slate-400 mt-2">Max Level: {level}</span>
                 </div>
                 
                 <button 
                    onClick={startGame}
                    className="flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all hover:scale-105 border border-white/10 shadow-lg"
                 >
                    <RotateCcw size={24} /> {t.replay}
                 </button>
             </div>
          )}
        </div>

        {/* Footer Controls (Language Toggle) */}
        <div className="mt-8 flex gap-4 opacity-80 transition-opacity text-white">
             <div className="flex bg-slate-800/80 rounded-full p-1 border border-white/20 backdrop-blur">
                <button 
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${language === 'en' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => setLanguage('en')}
                >
                    English
                </button>
                <button 
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${language === 'ja' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => setLanguage('ja')}
                >
                    日本語
                </button>
             </div>
        </div>

      </div>
    </div>
  );
}