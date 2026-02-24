/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, RotateCcw, Play, Info, ChevronRight, BarChart3, Home, Zap, Flame, Skull, Clock, Infinity as InfinityIcon } from 'lucide-react';

// --- Types ---
type GameState = 'START' | 'PLAYING' | 'GAMEOVER';
type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HELL';
type GameMode = 'TIMED' | 'ZEN';

interface Color {
  h: number;
  s: number;
  l: number;
}

// --- Constants ---
const GRID_SIZE = 5;
const INITIAL_TIME = 15;
const TIME_BONUS = 1.5;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('MEDIUM');
  const [gameMode, setGameMode] = useState<GameMode>('TIMED');
  
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('color-test-highscore-v2');
    return saved ? JSON.parse(saved) : { EASY: 0, MEDIUM: 0, HELL: 0 };
  });

  const [baseColor, setBaseColor] = useState<Color>({ h: 0, s: 0, l: 0 });
  const [diffColor, setDiffColor] = useState<Color>({ h: 0, s: 0, l: 0 });
  const [diffIndex, setDiffIndex] = useState(-1);
  const [currentDiffValue, setCurrentDiffValue] = useState(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Helpers ---
  const generateLevel = useCallback(() => {
    const h = Math.floor(Math.random() * 360);
    const s = 40 + Math.floor(Math.random() * 40); // 40-80%
    const l = 30 + Math.floor(Math.random() * 40); // 30-70%
    
    const base: Color = { h, s, l };
    
    // Difficulty calculation
    let baseDiff = 15;
    let rampRate = 3;
    
    if (difficultyLevel === 'EASY') {
      baseDiff = 20;
      rampRate = 5;
    } else if (difficultyLevel === 'HELL') {
      baseDiff = 10;
      rampRate = 2;
    }

    const currentDiff = Math.max(1, baseDiff - Math.floor(score / rampRate));
    
    const isLightness = Math.random() > 0.5;
    const diff: Color = { ...base };
    
    if (isLightness) {
      const direction = base.l > 50 ? -1 : 1;
      diff.l = base.l + (direction * currentDiff);
    } else {
      const direction = base.s > 50 ? -1 : 1;
      diff.s = base.s + (direction * currentDiff);
    }

    setBaseColor(base);
    setDiffColor(diff);
    setDiffIndex(Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE)));
    setCurrentDiffValue(currentDiff);
  }, [score, difficultyLevel]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(INITIAL_TIME);
    setGameState('PLAYING');
    generateLevel();
  };

  const backToHome = () => {
    setGameState('START');
  };

  const handleBlockClick = (index: number) => {
    if (gameState !== 'PLAYING') return;

    if (index === diffIndex) {
      setScore(prev => prev + 1);
      if (gameMode === 'TIMED') {
        setTimeLeft(prev => Math.min(INITIAL_TIME, prev + TIME_BONUS));
      }
      generateLevel();
    } else {
      if (gameMode === 'TIMED') {
        setTimeLeft(prev => Math.max(0, prev - 3));
      }
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (gameState === 'PLAYING' && gameMode === 'TIMED') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.1) {
            setGameState('GAMEOVER');
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, gameMode]);

  useEffect(() => {
    if (gameState === 'GAMEOVER') {
      const currentHigh = highScore[difficultyLevel];
      if (score > currentHigh) {
        const newHighScores = { ...highScore, [difficultyLevel]: score };
        setHighScore(newHighScores);
        localStorage.setItem('color-test-highscore-v2', JSON.stringify(newHighScores));
      }
    }
  }, [gameState, score, difficultyLevel, highScore]);

  const colorToCss = (c: Color) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans bg-zinc-50 safe-area-inset">
      {/* Header - Reduced margin on mobile */}
      <header className="w-full max-w-md mb-4 sm:mb-8 flex flex-col items-center text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-zinc-900 mb-1 sm:mb-2"
        >
          ColorTest <span className="text-emerald-600">色彩之王</span>
        </motion.h1>
        <p className="text-zinc-500 text-xs sm:text-base font-medium">
          找出那个颜色不一样的方块
        </p>
      </header>

      <main className="w-full max-w-md flex flex-col">
        {/* Stats Bar */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 px-1">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white border border-zinc-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm">
            <Trophy className="w-3.5 h-3.5 sm:w-4 h-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-bold text-zinc-700">{score}</span>
          </div>
          
          <div className="flex-1 mx-3 sm:mx-4 h-1.5 sm:h-2 bg-zinc-200 rounded-full overflow-hidden">
            {gameMode === 'TIMED' ? (
              <motion.div 
                className={`h-full ${timeLeft < 5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / INITIAL_TIME) * 100}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            ) : (
              <div className="h-full bg-zinc-300 w-full opacity-50" />
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-white border border-zinc-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm">
            {gameMode === 'TIMED' ? (
              <>
                <Timer className="w-3.5 h-3.5 sm:w-4 h-4 text-zinc-400" />
                <span className="text-xs sm:text-sm font-mono font-bold text-zinc-700">{timeLeft.toFixed(1)}s</span>
              </>
            ) : (
              <>
                <InfinityIcon className="w-3.5 h-3.5 sm:w-4 h-4 text-zinc-400" />
                <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase">无尽</span>
              </>
            )}
          </div>
        </div>

        {/* Game Area - Constrained by viewport height on mobile */}
        <div className="relative aspect-square w-full max-h-[65vh] sm:max-h-none bg-white border-2 border-zinc-900 rounded-2xl p-3 sm:p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden touch-none">
          <AnimatePresence mode="wait">
            {gameState === 'START' && (
              <motion.div 
                key="start"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 bg-white z-10 overflow-y-auto"
              >
                <h2 className="text-lg sm:text-xl font-display font-bold mb-4 sm:mb-6">选择挑战模式</h2>
                
                {/* Difficulty Selection */}
                <div className="w-full space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  <p className="text-[9px] sm:text-[10px] text-zinc-400 uppercase font-bold tracking-widest text-center">难度分级</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'EASY', label: '简单', icon: Zap, color: 'text-emerald-500' },
                      { id: 'MEDIUM', label: '中等', icon: Flame, color: 'text-amber-500' },
                      { id: 'HELL', label: '地狱', icon: Skull, color: 'text-red-500' }
                    ].map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setDifficultyLevel(level.id as DifficultyLevel)}
                        className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl border-2 transition-all ${
                          difficultyLevel === level.id 
                            ? 'border-zinc-900 bg-zinc-50 scale-105' 
                            : 'border-transparent bg-zinc-50/50 opacity-60'
                        }`}
                      >
                        <level.icon className={`w-4 h-4 sm:w-5 h-5 ${level.color}`} />
                        <span className="text-[10px] sm:text-xs font-bold">{level.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="w-full space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  <p className="text-[9px] sm:text-[10px] text-zinc-400 uppercase font-bold tracking-widest text-center">游戏模式</p>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      onClick={() => setGameMode('TIMED')}
                      className={`flex items-center justify-center gap-2 p-2 sm:p-3 rounded-xl border-2 transition-all ${
                        gameMode === 'TIMED' 
                          ? 'border-zinc-900 bg-zinc-50' 
                          : 'border-transparent bg-zinc-50/50 opacity-60'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 sm:w-4 h-4" />
                      <span className="text-[10px] sm:text-xs font-bold">计时挑战</span>
                    </button>
                    <button
                      onClick={() => setGameMode('ZEN')}
                      className={`flex items-center justify-center gap-2 p-2 sm:p-3 rounded-xl border-2 transition-all ${
                        gameMode === 'ZEN' 
                          ? 'border-zinc-900 bg-zinc-50' 
                          : 'border-transparent bg-zinc-50/50 opacity-60'
                      }`}
                    >
                      <InfinityIcon className="w-3.5 h-3.5 sm:w-4 h-4" />
                      <span className="text-[10px] sm:text-xs font-bold">无尽练习</span>
                    </button>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full group flex items-center justify-center gap-3 bg-zinc-900 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-emerald-600 transition-all active:scale-95 shadow-lg"
                >
                  开始挑战
                  <Play className="w-4 h-4 sm:w-5 h-5 fill-current" />
                </button>

                <div className="mt-4 sm:mt-6 flex items-center gap-2 text-zinc-400 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold">
                  <BarChart3 className="w-3 h-3" />
                  最高分: {highScore[difficultyLevel]}
                </div>
              </motion.div>
            )}

            {gameState === 'GAMEOVER' && (
              <motion.div 
                key="gameover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 bg-white/95 backdrop-blur-sm z-20"
              >
                <div className="w-12 h-12 sm:w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <RotateCcw className="w-6 h-6 sm:w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold mb-1 text-zinc-900">挑战结束</h2>
                <div className="flex flex-col items-center mb-4 sm:mb-6">
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">本次得分</span>
                  <span className="text-4xl sm:text-5xl font-display font-black text-emerald-600">{score}</span>
                </div>
                
                <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="bg-zinc-50 p-2 sm:p-3 rounded-xl border border-zinc-100 flex flex-col items-center">
                    <span className="text-[8px] sm:text-[9px] text-zinc-400 uppercase font-bold mb-1">最高记录</span>
                    <span className="text-base sm:text-lg font-bold text-zinc-800">{highScore[difficultyLevel]}</span>
                  </div>
                  <div className="bg-zinc-50 p-2 sm:p-3 rounded-xl border border-zinc-100 flex flex-col items-center">
                    <span className="text-[8px] sm:text-[9px] text-zinc-400 uppercase font-bold mb-1">难度等级</span>
                    <span className="text-base sm:text-lg font-bold text-zinc-800">{difficultyLevel}</span>
                  </div>
                </div>

                <div className="w-full space-y-2 sm:space-y-3">
                  <button 
                    onClick={startGame}
                    className="w-full bg-zinc-900 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base hover:bg-emerald-600 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 h-4" />
                    再来一局
                  </button>
                  <button 
                    onClick={backToHome}
                    className="w-full bg-white text-zinc-900 border-2 border-zinc-900 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base hover:bg-zinc-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Home className="w-3.5 h-3.5 sm:w-4 h-4" />
                    返回主页
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Grid */}
          <div className="color-grid h-full w-full">
            {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 0.98 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleBlockClick(i)}
                className="w-full h-full rounded-lg sm:rounded-xl transition-colors duration-200 shadow-sm"
                style={{ 
                  backgroundColor: i === diffIndex ? colorToCss(diffColor) : colorToCss(baseColor)
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer Info - Smaller on mobile */}
        <div className="mt-4 sm:mt-8 space-y-3 sm:space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 items-start">
            <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-lg shrink-0">
              <Info className="w-4 h-4 sm:w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-emerald-900 mb-0.5 sm:mb-1">色彩差异说明</h4>
              <p className="text-[10px] sm:text-xs text-emerald-700 leading-relaxed">
                当前差异值: <span className="font-bold">{currentDiffValue}%</span>。
                {difficultyLevel === 'HELL' ? '地狱难度下差异极小，挑战你的视神经！' : '随着得分增加，差异会逐渐缩小。'}
              </p>
            </div>
          </div>

          {gameMode === 'ZEN' && (
            <div className="bg-zinc-900 text-white rounded-xl p-2 sm:p-3 text-center">
              <p className="text-[9px] sm:text-xs font-bold uppercase tracking-widest">无尽练习模式：点击错误不扣时</p>
            </div>
          )}

          <div className="flex justify-center gap-4 sm:gap-6 text-zinc-400">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium">
              <ChevronRight className="w-3 h-3" />
              响应式布局
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium">
              <ChevronRight className="w-3 h-3" />
              艺术生进阶
            </div>
          </div>
        </div>
      </main>

      {/* Background Decoration */}
      <div className="fixed -bottom-24 -left-24 w-48 sm:w-64 h-48 sm:h-64 bg-emerald-100 rounded-full blur-3xl opacity-30 -z-10" />
      <div className="fixed -top-24 -right-24 w-48 sm:w-64 h-48 sm:h-64 bg-amber-100 rounded-full blur-3xl opacity-30 -z-10" />
    </div>
  );
}
