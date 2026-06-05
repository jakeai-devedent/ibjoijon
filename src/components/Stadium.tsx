/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Team, ShopItem, PlayMode, ShotResult } from '../types';
import { Target, Shield, HelpCircle, Trophy, Sparkles, Flame, Zap, ArrowRight, RotateCcw } from 'lucide-react';

interface StadiumProps {
  playerTeam: Team;
  opponentTeam: Team;
  selectedBall: ShopItem;
  selectedGlove: ShopItem;
  selectedStadium: ShopItem;
  onMatchFinished: (isWin: boolean, score: { player: number; opponent: number }) => void;
  onTriggerStat: (type: 'goal' | 'save') => void;
  onEarnCoins: (amount: number) => void;
}

export default function Stadium({
  playerTeam,
  opponentTeam,
  selectedBall,
  selectedGlove,
  selectedStadium,
  onMatchFinished,
  onTriggerStat,
  onEarnCoins,
}: StadiumProps) {
  // Game Play States
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [round, setRound] = useState(1);
  const [mode, setMode] = useState<PlayMode>('SHOOT'); // SHOOT -> SAVE -> NEXT...
  const [phase, setPhase] = useState<'IDLE' | 'KICKING' | 'SAVING' | 'REVEALED'>('IDLE');

  // Shot config
  const [shotType, setShotType] = useState<'power' | 'finesse' | 'panenka'>('finesse');
  const [aimX, setAimX] = useState(50); // percentage 0 - 100 of goal box
  const [aimY, setAimY] = useState(45); // percentage 0 - 100
  const [power, setPower] = useState(75); // 0 - 100

  // Animation states
  const [ballVisualPos, setBallVisualPos] = useState({ x: 0, y: 180, scale: 1 });
  const [gkVisualPos, setGkVisualPos] = useState({ x: 0, y: 0 });
  const [gkBending, setGkBending] = useState<string>('rotate-0');

  // Interactive feedback
  const [shotComment, setShotComment] = useState('');
  const [effectTrigger, setEffectTrigger] = useState<string | null>(null); // 'fire' | 'neon' | 'gold' | 'g_lightning' | 'g_matrix'
  const [lastGoalCounted, setLastGoalCounted] = useState<boolean | null>(null);

  // Sudden Death & Match Record Tracker
  const [matchOver, setMatchOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Turn History indicators: arrays of booleans (true = goal, false = miss/saved, null = pending)
  const [playerShotsHistory, setPlayerShotsHistory] = useState<(boolean | null)[]>([null, null, null, null, null]);
  const [opponentShotsHistory, setOpponentShotsHistory] = useState<(boolean | null)[]>([null, null, null, null, null]);

  // Goal Post Dimensions (relative to Goal target area container)
  // X: 15% to 85% is net. Above 15% & Below 85% is target.
  // Y: 18% to 82% is net.
  const posts = {
    leftPost: 15,
    rightPost: 85,
    crossbar: 18,
    groundLimit: 82,
  };

  // Sound effects emulation / triggers
  const playHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Reset arena coordinates
  const resetBallAndGk = () => {
    setBallVisualPos({ x: 0, y: 180, scale: 1 });
    setGkVisualPos({ x: 0, y: 0 });
    setGkBending('rotate-0');
    setPhase('IDLE');
    setEffectTrigger(null);
  };

  // Quick preset aims for mobile convenience
  const applyPresetAim = (x: number, y: number) => {
    if (phase !== 'IDLE') return;
    setAimX(x);
    setAimY(y);
    playHaptic();
  };

  // AI goalie diving decision
  const calculateAiGkDive = (targetX: number, targetY: number, powerVal: number) => {
    // Diff stats from opponents
    const gkReflex = opponentTeam.reflex;
    
    // Add randomness. Higher reflexes make goalkeeper pick closer to correct trajectory
    const successRate = gkReflex / 160; // Up to ~60% accuracy in picking the right zone
    const isGKDiviningCorrectly = Math.random() < successRate;

    let diveX = 50;
    let diveY = 45;

    if (isGKDiviningCorrectly) {
      // Dives close to where the user is aiming, with a slight error
      const errorX = (Math.random() - 0.5) * 15;
      const errorY = (Math.random() - 0.5) * 10;
      diveX = Math.max(10, Math.min(90, targetX + errorX));
      diveY = Math.max(15, Math.min(85, targetY + errorY));
    } else {
      // Pick a random side to dive
      const randomSide = Math.random();
      if (randomSide < 0.3) {
        // Dive Left
        diveX = 20 + Math.random() * 20;
        diveY = 30 + Math.random() * 40;
      } else if (randomSide < 0.6) {
        // Dive Right
        diveX = 60 + Math.random() * 20;
        diveY = 30 + Math.random() * 40;
      } else {
        // Stay in middle
        diveX = 45 + Math.random() * 10;
        diveY = 45 + Math.random() * 20;
      }
    }

    return { x: diveX, y: diveY };
  };

  // AI Shooting target decision
  const calculateAiShot = () => {
    const powerStat = opponentTeam.power;
    // AI aims for corners mostly but some times middle
    const decision = Math.random();
    let xTarget = 50;
    let yTarget = 50;

    if (decision < 0.25) {
      // Top Left Corner
      xTarget = 20 + Math.random() * 12;
      yTarget = 22 + Math.random() * 15;
    } else if (decision < 0.50) {
      // Top Right Corner
      xTarget = 68 + Math.random() * 12;
      yTarget = 22 + Math.random() * 15;
    } else if (decision < 0.75) {
      // Bottom Left / Right corners
      xTarget = Math.random() < 0.5 ? (20 + Math.random() * 15) : (65 + Math.random() * 15);
      yTarget = 65 + Math.random() * 15;
    } else {
      // Center risky shot
      xTarget = 40 + Math.random() * 20;
      yTarget = 45 + Math.random() * 25;
    }

    return { x: xTarget, y: yTarget };
  };

  // KICK! User shoots
  const handleUserShoot = () => {
    if (phase !== 'IDLE') return;
    setPhase('KICKING');
    playHaptic();

    // 1. Calculate accuracy based on shot type and powers
    let actualX = aimX;
    let actualY = aimY;
    let precisionFactor = 1.0;

    if (shotType === 'power') {
      precisionFactor = 1.6; // High deviation
    } else if (shotType === 'finesse') {
      precisionFactor = 0.6; // Low deviation
    } else if (shotType === 'panenka') {
      precisionFactor = 0.4;
    }

    // High power increases inaccuracy
    const powerError = (power / 100) * 8 * precisionFactor;
    // Team's power stat can slightly counter inaccuracy
    const statBonus = (100 - playerTeam.power) / 20;
    const finalInaccuracy = Math.max(1, powerError + statBonus);

    // Apply random offset
    actualX += (Math.random() - 0.5) * finalInaccuracy;
    actualY += (Math.random() - 0.5) * finalInaccuracy;

    // Boundary check for goal posts
    const isOutsideX = actualX < posts.leftPost || actualX > posts.rightPost;
    const isOutsideY = actualY < posts.crossbar || actualY > posts.groundLimit;
    const isGoalpostCollision = 
      (Math.abs(actualX - posts.leftPost) < 1.8 && actualY < posts.groundLimit && actualY > posts.crossbar) ||
      (Math.abs(actualX - posts.rightPost) < 1.8 && actualY < posts.groundLimit && actualY > posts.crossbar) ||
      (Math.abs(actualY - posts.crossbar) < 1.8 && actualX > posts.leftPost && actualX < posts.rightPost);

    // AI Goalkeeper dives
    const gkTarget = calculateAiGkDive(actualX, actualY, power);

    // Convert aim percents into actual visual pixel translation offset
    // Target coordinate inside 100x100 translates to UI pixel offsets
    // Box center is (0,0). Width ~500px, Height ~220px.
    const ballTargetPixelX = (actualX - 50) * 5.0; // multiplier to stretch
    const ballTargetPixelY = (actualY - 50) * 2.2; 

    const gkTargetPixelX = (gkTarget.x - 50) * 4.6;
    const gkTargetPixelY = (gkTarget.y - 50) * 1.6;

    // Trigger ball visual flight
    setBallVisualPos({ x: ballTargetPixelX, y: ballTargetPixelY - 70, scale: 0.35 });
    
    // Trigger GK dive visual transition
    setGkVisualPos({ x: gkTargetPixelX, y: gkTargetPixelY });
    if (gkTargetPixelX < -30) {
      setGkBending('rotate-[-45deg] translate-y-3');
    } else if (gkTargetPixelX > 30) {
      setGkBending('rotate-[45deg] translate-y-3');
    } else {
      setGkBending('scale-y-95');
    }

    // Determine shot result
    setTimeout(() => {
      let goalScored = false;
      let msg = '';

      if (isOutsideX || isOutsideY) {
        msg = '골대를 완전히 벗어났습니다! 실축!';
        // ball goes further away
        setBallVisualPos(prev => ({ ...prev, x: prev.x * 1.2, y: prev.y * 1.3, scale: 0.2 }));
      } else if (isGoalpostCollision) {
        msg = '깡! 크로스바 혹은 골대를 강타하고 튕겨나갔습니다!';
        setBallVisualPos(prev => ({ x: prev.x * 0.95, y: prev.y + 45, scale: 0.4 }));
      } else {
        // Ball is in net. Did Goalkeeper touch it?
        // Check distance between GK gloves target and Ball target
        const dist = Math.sqrt(Math.pow(gkTarget.x - actualX, 2) + Math.pow(gkTarget.y - actualY, 2));
        
        // Save threshold: with Power Shot it is harder to save, with Panenka GK has to wait in middle
        let saveThreshold = 14; // Default save bubble
        if (shotType === 'power') {
          saveThreshold = 9; // Harder to save even if close
        } else if (shotType === 'panenka') {
          // Panenka is captured instantly if Goalkepeer stayed center
          if (gkTarget.x > 40 && gkTarget.x < 60) {
            saveThreshold = 35; // Easily caught in middle
          } else {
            saveThreshold = 4; // GK dived away, guaranteed goal!
          }
        }

        if (dist < saveThreshold) {
          // Goalkeeper Saved!
          goalScored = false;
          msg = `아쉽습니다! ${opponentTeam.flag} 골키퍼의 눈부신 선방에 가로막혔습니다!`;
          // Ball rebounds slightly
          setBallVisualPos(prev => ({ x: gkTargetPixelX + (Math.random() - 0.5) * 40, y: gkTargetPixelY + 20, scale: 0.42 }));
        } else {
          goalScored = true;
          // Commentary depending on quality
          if (shotType === 'panenka') {
            msg = '대담합니다! 완벽한 파넨카 슛으로 골키퍼를 완전히 무너뜨리고 골인!';
          } else if (actualX < 20 || actualX > 80 || actualY < 25) {
            msg = '엄청난 궤적! 구석을 찌르는 마스터 클래스 환상적인 원더골!';
          } else {
            msg = '골인!! 슈팅이 네트를 골망을 시원하게 갈라놓았습니다!';
          }
        }
      }

      // Special Ball Equip FX
      if (goalScored) {
        if (selectedBall.id === 'ball_fire') setEffectTrigger('fire');
        if (selectedBall.id === 'ball_neon') setEffectTrigger('neon');
        if (selectedBall.id === 'ball_gold') setEffectTrigger('gold');
      }

      // Update states
      setLastGoalCounted(goalScored);
      setShotComment(msg);
      setPhase('REVEALED');

      if (goalScored) {
        setPlayerScore(p => p + 1);
        onTriggerStat('goal');
        // Extra coins if holding Gold ball
        const baseReward = 20;
        const reward = selectedBall.id === 'ball_gold' ? Math.round(baseReward * 1.2) : baseReward;
        onEarnCoins(reward);
        
        // Add to history
        updateHistory(true, 'player');
      } else {
        updateHistory(false, 'player');
      }
    }, 1100);
  };

  // User control: GK Defense setup
  const [gkDefendAimX, setGkDefendAimX] = useState(50);
  const [gkDefendAimY, setGkDefendAimY] = useState(45);

  const applyPresetDefence = (x: number, y: number) => {
    if (phase !== 'IDLE') return;
    setGkDefendAimX(x);
    setGkDefendAimY(y);
    playHaptic();
  };

  // USER SAVES!
  const handleUserSave = () => {
    if (phase !== 'IDLE') return;
    setPhase('SAVING');
    playHaptic();

    // Determine AI Shot destination
    const aiShot = calculateAiShot();
    const isOutsideX = aiShot.x < posts.leftPost || aiShot.x > posts.rightPost;
    const isOutsideY = aiShot.y < posts.crossbar || aiShot.y > posts.groundLimit;

    // User's GK diving pixel calculation
    // Max diving ranges
    const gkTargetPixelX = (gkDefendAimX - 50) * 4.6;
    const gkTargetPixelY = (gkDefendAimY - 50) * 1.6;

    const ballTargetPixelX = (aiShot.x - 50) * 5.0;
    const ballTargetPixelY = (aiShot.y - 50) * 2.2;

    // GK actions
    setGkVisualPos({ x: gkTargetPixelX, y: gkTargetPixelY });
    if (gkTargetPixelX < -30) {
      setGkBending('rotate-[-45deg] translate-y-3');
    } else if (gkTargetPixelX > 30) {
      setGkBending('rotate-[45deg] translate-y-3');
    } else {
      setGkBending('scale-y-95');
    }

    // Ball moves
    setBallVisualPos({ x: ballTargetPixelX, y: ballTargetPixelY - 70, scale: 0.35 });

    // Calculate Save
    setTimeout(() => {
      let saved = false;
      let opponentScored = false;
      let msg = '';

      if (isOutsideX || isOutsideY) {
        msg = `상대 슈터가 너무 구석을 노렸습니다! 차낸 공이 허공을 가릅니다!`;
        opponentScored = false;
        setBallVisualPos(prev => ({ ...prev, x: prev.x * 1.2, y: prev.y * 1.3, scale: 0.2 }));
      } else {
        // Inside Net. Glove shield calculation
        const dist = Math.sqrt(Math.pow(gkDefendAimX - aiShot.x, 2) + Math.pow(gkDefendAimY - aiShot.y, 2));
        
        // Glove item boost
        let saveSize = 14; // Default glove saving diameter
        if (selectedGlove.id === 'glove_lightning') {
          saveSize = 17; // Larger capture radius
          setEffectTrigger('g_lightning');
        } else if (selectedGlove.id === 'glove_matrix') {
          saveSize = 20; // Maximum capture matrix radius
          setEffectTrigger('g_matrix');
        }

        // Add player team reflex stat benefits
        const reflexBonus = (playerTeam.reflex - 80) / 10; // Extra save bubble
        const finalSaveRadius = Math.max(8, saveSize + reflexBonus);

        if (dist < finalSaveRadius) {
          saved = true;
          opponentScored = false;
          msg = '슈퍼 세이브!!! 당신의 반사신경이 팀을 위기에서 구해냈습니다!';
          setBallVisualPos(prev => ({ x: gkTargetPixelX + (Math.random() - 0.5) * 30, y: gkTargetPixelY + 20, scale: 0.42 }));
        } else {
          opponentScored = true;
          msg = `${opponentTeam.flag} ${opponentTeam.name}의 강력한 슛! 막아내지 못하고 골망에 빨려 들어갑니다.`;
        }
      }

      setLastGoalCounted(opponentScored);
      setShotComment(msg);
      setPhase('REVEALED');

      if (saved) {
        onTriggerStat('save');
        // Earn coins for saving
        const baseSaveReward = 25;
        onEarnCoins(baseSaveReward);
      }

      if (opponentScored) {
        setOpponentScore(o => o + 1);
        updateHistory(true, 'opponent');
      } else {
        updateHistory(false, 'opponent');
      }
    }, 1100);
  };

  // Helper to store shot indicators
  const updateHistory = (isGoal: boolean, side: 'player' | 'opponent') => {
    if (side === 'player') {
      setPlayerShotsHistory(prev => {
        const next = [...prev];
        const firstEmptyIdx = next.indexOf(null);
        if (firstEmptyIdx !== -1 && firstEmptyIdx < round) {
          next[firstEmptyIdx] = isGoal;
        } else {
          next.push(isGoal);
        }
        return next;
      });
    } else {
      setOpponentShotsHistory(prev => {
        const next = [...prev];
        const firstEmptyIdx = next.indexOf(null);
        if (firstEmptyIdx !== -1 && firstEmptyIdx < round) {
          next[firstEmptyIdx] = isGoal;
        } else {
          next.push(isGoal);
        }
        return next;
      });
    }
  };

  // Continue to next turn
  const handleNextTurn = () => {
    resetBallAndGk();

    if (mode === 'SHOOT') {
      // Finished SHOOT, move to SAVE
      setMode('SAVE');
    } else {
      // Finished both SHOOT and SAVE for this round. Check if match is finished or continue to next round
      const nextRound = round + 1;
      
      // Check standard 5-round rule
      const remainingRounds = 5 - round;
      const playerDiff = playerScore - opponentScore;

      // Mathematical impossibility check (e.g. 3-0 after round 3)
      const canOpponentCatchUp = playerDiff <= remainingRounds;
      const canPlayerCatchUp = -playerDiff <= remainingRounds;

      if (round >= 5) {
        // Tie breaker sudden death
        if (playerScore !== opponentScore) {
          triggerMatchFinish();
        } else {
          // Enter sudden death
          setRound(nextRound);
          setMode('SHOOT');
          // Extend history indicators
          setPlayerShotsHistory(prev => [...prev, null]);
          setOpponentShotsHistory(prev => [...prev, null]);
        }
      } else {
        if (!canOpponentCatchUp || !canPlayerCatchUp) {
          // Game over mathematically
          triggerMatchFinish();
        } else {
          setRound(nextRound);
          setMode('SHOOT');
        }
      }
    }
  };

  const triggerMatchFinish = () => {
    setMatchOver(true);
    const playerWon = playerScore > opponentScore;
    setWinner(playerWon ? 'player' : 'opponent');
  };

  // Notify parent component on exit
  const handleExitMatch = () => {
    onMatchFinished(winner === 'player', { player: playerScore, opponent: opponentScore });
  };

  // Get field green tone background styled dynamically from selected stadium
  const getStadiumBgClass = () => {
    return selectedStadium.value;
  };

  return (
    <div className="w-full text-white bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
      
      {/* Stadium Special Stadium Theme Lighting Grid on Outer Header */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 z-10 opacity-30" />

      {/* Main Field Side - 60% Width */}
      <div className="flex-1 md:w-3/5 p-4 flex flex-col items-center justify-between relative bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 min-h-[480px]">
        
        {/* Dynamic Stadium BG Sky Layer behind */}
        <div className={`absolute inset-0 bg-gradient-to-b ${getStadiumBgClass()} opacity-95 transition-all duration-700 pointer-events-none`} />

        {/* Stadium Floodlights glow overlay */}
        <div className="absolute top-2 inset-x-0 flex justify-between px-8 pointer-events-none z-10 opacity-70">
          <div className="w-16 h-4 bg-white/20 rounded-full blur-md animate-pulse shadow-cyan-300 shadow-lg" />
          <div className="w-16 h-4 bg-white/20 rounded-full blur-md animate-pulse shadow-cyan-300 shadow-lg" />
        </div>

        {/* Crowds cheering indicator banner */}
        <div className="w-full flex justify-between items-center z-10 px-2 font-mono text-center">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs tracking-wider">
            🏟️ <span className="font-bold text-emerald-400">{selectedStadium.name}</span>
          </div>
          <div className="bg-black/70 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-yellow-400 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>라운드 {round} {round > 5 && <span className="text-red-500 animate-pulse font-mono">(SUDDEN DEATH)</span>}</span>
          </div>
        </div>

        {/* Stadium Goal Area Frame Container */}
        <div className="w-full max-w-[500px] aspect-[2.1/1] relative border-b border-dashed border-white/20 mt-4 select-none">
          
          {/* Sizing box inside which is the goal frame */}
          <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
            
            {/* The Goalposts Frame */}
            <div className="w-[70%] h-[75%] border-t-4 border-l-4 border-r-4 border-white relative shadow-[0_-15px_40px_-5px_rgba(255,255,255,0.1)]">
              {/* Back Goal netting texture using SVG grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />
              
              {/* Left & Right net metal supports */}
              <div className="absolute left-0 bottom-0 top-0 w-8 border-r border-[#ffffff30] bg-gradient-to-r from-transparent to-white/5" />
              <div className="absolute right-0 bottom-0 top-0 w-8 border-l border-[#ffffff30] bg-gradient-to-l from-transparent to-white/5" />
            </div>
            
          </div>

          {/* Goal Hit/Interactable Capture Area for aiming */}
          <div 
            id="goal-clickbase"
            className="absolute left-[15%] right-[15%] bottom-[12%] top-[20%] z-20 cursor-crosshair group"
            onClick={(e) => {
              if (phase !== 'IDLE' || mode !== 'SHOOT') return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickXPercentage = ((e.clientX - rect.left) / rect.width) * 100;
              const clickYPercentage = ((e.clientY - rect.top) / rect.height) * 100;
              
              // Map to original bounding ratios to prevent out of bounds
              setAimX(Math.max(5, Math.min(95, clickXPercentage * 0.7 + 15)));
              setAimY(Math.max(5, Math.min(95, clickYPercentage * 0.6 + 18)));
              playHaptic();
            }}
          >
            {/* Dynamic Interactive Aiming Sights Pointer inside SHOOT mode */}
            {mode === 'SHOOT' && phase === 'IDLE' && (
              <motion.div 
                className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-dashed border-yellow-400 rounded-full flex items-center justify-center animate-pulse shadow-md"
                style={{ left: `${(aimX - 15) / 0.7}%`, top: `${(aimY - 18) / 0.6}%` }}
                layoutId="userAimSights"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              </motion.div>
            )}

            {/* Dynamic Interactive GK Target Hand Sights Pointer inside SAVE mode */}
            {mode === 'SAVE' && phase === 'IDLE' && (
              <motion.div 
                className="absolute w-10 h-10 -ml-5 -mt-5 border-2 border-emerald-400 rounded-lg flex items-center justify-center bg-emerald-500/10 pointer-events-none"
                style={{ left: `${(gkDefendAimX - 15) / 0.7}%`, top: `${(gkDefendAimY - 18) / 0.6}%` }}
                layoutId="userDefSights"
              >
                <Shield className="w-5 h-5 text-emerald-400 animate-spin-slow" />
              </motion.div>
            )}
          </div>

          {/* Goalkeeper Avatar (rendered as a pair of Gloves) */}
          <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-20">
            <motion.div 
              className={`w-20 h-20 flex flex-col justify-center items-center transition-transform duration-300 ${gkBending}`}
              animate={{ 
                x: gkVisualPos.x, 
                y: gkVisualPos.y - 15 
              }}
              transition={{ type: 'spring', stiffness: 150, damping: 15 }}
            >
              {/* Goalkeeper icon head */}
              <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center border-2 border-slate-700 shadow-sm overflow-hidden mb-1">
                <span className="text-[10px] text-black">🧑</span>
              </div>
              
              {/* Custom Defensive Gloves visual */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center shadow-lg transform rotate-6 border ${selectedGlove.id === 'glove_lightning' ? 'bg-yellow-400 border-yellow-200 animate-pulse' : selectedGlove.id === 'glove_matrix' ? 'bg-emerald-500 border-emerald-200' : 'bg-rose-500 border-rose-300'}`}>
                  <span className="text-sm">🧤</span>
                </div>
                <div className={`w-8 h-8 rounded-md flex items-center justify-center shadow-lg transform -rotate-6 border ${selectedGlove.id === 'glove_lightning' ? 'bg-yellow-400 border-yellow-200 animate-pulse' : selectedGlove.id === 'glove_matrix' ? 'bg-emerald-500 border-emerald-200' : 'bg-rose-500 border-rose-300'}`}>
                  <span className="text-sm">🧤</span>
                </div>
              </div>
              {/* GK jersey */}
              <div className="bg-slate-800 text-[8px] font-bold px-2 py-0.5 rounded border border-white/20 mt-1 uppercase">
                {mode === 'SHOOT' ? opponentTeam.flag : playerTeam.flag} GK
              </div>
            </motion.div>
          </div>

          {/* Ball Object Element with animation physics */}
          <div className="absolute inset-x-0 bottom-0 h-10 flex items-center justify-center pointer-events-none z-30">
            <motion.div 
              style={{
                borderRadius: '50%',
              }}
              className={`w-12 h-12 flex items-center justify-center shadow-xl ${selectedBall.value}`}
              animate={{
                x: ballVisualPos.x,
                y: ballVisualPos.y,
                scale: ballVisualPos.scale,
              }}
              transition={{ 
                duration: phase === 'IDLE' ? 0 : 0.8,
                ease: phase === 'IDLE' ? 'easeOut' : [0.25, 1, 0.5, 1] 
              }}
            >
              {/* Ball internal line indicator */}
              <span className="text-sm pointer-events-none select-none">⚽</span>
            </motion.div>
          </div>

          {/* Special Visual FX Overlays */}
          <AnimatePresence>
            {effectTrigger && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none bg-black/30 backdrop-blur-sm"
              >
                {effectTrigger === 'fire' && (
                  <div className="text-center animate-bounce">
                    <Flame className="w-16 h-16 text-orange-500 mx-auto drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
                    <span className="text-orange-400 font-bold text-lg tracking-wider block mt-1">FIRE KICK! 🔥</span>
                  </div>
                )}
                {effectTrigger === 'neon' && (
                  <div className="text-center">
                    <Zap className="w-16 h-16 text-cyan-400 mx-auto drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]" />
                    <span className="text-cyan-400 font-bold text-lg tracking-wider block mt-1">CYBER VOLT! ⚡</span>
                  </div>
                )}
                {effectTrigger === 'gold' && (
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-yellow-400 mx-auto drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                    <span className="text-yellow-400 font-bold text-lg tracking-wider block mt-1">CHAMPION SPARK! ✨</span>
                  </div>
                )}
                {effectTrigger === 'g_lightning' && (
                  <div className="text-center">
                    <Zap className="w-16 h-16 text-yellow-300 mx-auto animate-pulse" />
                    <span className="text-yellow-300 font-bold text-md block mt-1">썬더 실드 세이브!</span>
                  </div>
                )}
                {effectTrigger === 'g_matrix' && (
                  <div className="text-center">
                    <Shield className="w-16 h-16 text-green-400 mx-auto" />
                    <span className="text-green-400 font-bold text-md block mt-1">매트릭스 완벽 차단!</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Score overlay banner during state change */}
          {phase === 'REVEALED' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/65 backdrop-blur-sm p-4 animate-fade-in pointer-events-auto">
              <motion.div 
                initial={{ transform: 'scale(0.8)', opacity: 0 }}
                animate={{ transform: 'scale(1)', opacity: 1 }}
                className="text-center"
              >
                {lastGoalCounted !== null && (
                  <div className={`text-xl md:text-2xl font-bold mb-2 uppercase ${lastGoalCounted ? 'text-yellow-400 animate-bounce' : 'text-slate-300'}`}>
                    {lastGoalCounted ? '🎉 GOAL!!! 골인! 🎉' : '❌ NO GOAL!! 막아냄! ❌'}
                  </div>
                )}
                <p className="text-xs text-slate-300 mb-4 font-medium px-4 max-w-sm mx-auto">
                  {shotComment}
                </p>
                <button
                  id="btn-next-action"
                  onClick={handleNextTurn}
                  className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold px-6 py-2 rounded-lg text-sm transition-all shadow-lg flex items-center justify-center gap-2 mx-auto active:scale-95"
                >
                  {mode === 'SHOOT' ? '수비하러 가기' : '다음 라운드로'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>
          )}

        </div>

        {/* Penalty Spot Line Markings */}
        <div className="w-12 h-1 bg-white/20 rounded-full mt-1 mb-2 shadow-sm pointer-events-none" />

        {/* Selected custom Ball visual label */}
        <div className="text-[11px] text-slate-400 capitalize mb-4 bg-slate-950/40 px-2 py-0.5 rounded border border-white/5 font-mono">
          활성 볼: <span className="text-yellow-400">{selectedBall.name}</span> | 장갑: <span className="text-cyan-400">{selectedGlove.name}</span>
        </div>

      </div>

      {/* Control Console Sidebar - 40% Width */}
      <div className="w-full md:w-2/5 p-5 flex flex-col justify-between bg-slate-950 shrink-0">
        
        {/* Score Board Header */}
        <div>
          <div className="text-center pb-3 border-b border-slate-800 mb-4">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest font-mono">LIVE SCOREBOARD</span>
            
            <div className="flex justify-center items-center gap-4 mt-2">
              <div className="text-right w-1/3">
                <div className="flex justify-end items-center gap-1.5">
                  <span className="text-xs text-slate-300 truncate font-semibold">{playerTeam.name}</span>
                  <span className="text-xl">{playerTeam.flag}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">MY TEAM</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-1.5 flex items-center gap-3 font-mono font-bold text-2xl shadow-inner text-yellow-300">
                <span>{playerScore}</span>
                <span className="text-slate-600 text-lg">:</span>
                <span>{opponentScore}</span>
              </div>

              <div className="text-left w-1/3">
                <div className="flex justify-start items-center gap-1.5">
                  <span className="text-xl">{opponentTeam.flag}</span>
                  <span className="text-xs text-slate-300 truncate font-semibold">{opponentTeam.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">OPPONENT</span>
              </div>
            </div>
          </div>

          {/* Individual round score indicators (penalty tracker dots) */}
          <div className="space-y-2 mb-5 bg-slate-900/50 p-2.5 rounded-xl border border-slate-900">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <span className="text-[12px]">{playerTeam.flag}</span> 슈팅 현황:
              </span>
              <div className="flex gap-1.5">
                {playerShotsHistory.map((val, idx) => (
                  <div 
                    key={`ps-${idx}`} 
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                      val === null ? 'bg-slate-800 border-slate-700' :
                      val ? 'bg-emerald-500 border-emerald-300 text-white' :
                      'bg-rose-500 border-rose-300 text-white'
                    }`}
                  >
                    {val === null ? idx + 1 : val ? '◯' : '✕'}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <span className="text-[12px]">{opponentTeam.flag}</span> 슈팅 현황:
              </span>
              <div className="flex gap-1.5">
                {opponentShotsHistory.map((val, idx) => (
                  <div 
                    key={`os-${idx}`} 
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                      val === null ? 'bg-slate-800 border-slate-700' :
                      val ? 'bg-emerald-500 border-emerald-300 text-white' :
                      'bg-rose-500 border-rose-300 text-white'
                    }`}
                  >
                    {val === null ? idx + 1 : val ? '◯' : '✕'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active Controls Container */}
        <div className="flex-1 flex flex-col justify-center">
          {phase === 'IDLE' ? (
            <>
              {mode === 'SHOOT' ? (
                /* SHOOTING GAME CONTROLS */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm font-bold text-yellow-400 uppercase">
                      <Target className="w-4 h-4" />
                      <span>슈팅 전술 설정</span>
                    </div>
                  </div>

                  {/* Shot presets - Quick aiming help */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-[11px] text-slate-400 font-mono block mb-2">과녁을 터치하거나 아래 추천 포지션을 클릭하세요</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        id="preset-tl"
                        onClick={() => applyPresetAim(20, 24)}
                        className={`text-xs py-1.5 px-2 rounded-lg bg-slate-800 border ${aimX < 35 && aimY < 40 ? 'border-yellow-400 text-yellow-400 font-bold' : 'border-slate-700 text-slate-300'}`}
                      >
                        ↖ 좌상단 구석
                      </button>
                      <button
                        id="preset-tc"
                        onClick={() => applyPresetAim(50, 22)}
                        className={`text-xs py-1.5 px-2 rounded-lg bg-slate-800 border ${aimX >= 35 && aimX <= 65 && aimY < 40 ? 'border-yellow-400 text-yellow-400 font-bold' : 'border-slate-700 text-slate-300'}`}
                      >
                        ⬆ 중앙 높은 컵
                      </button>
                      <button
                        id="preset-tr"
                        onClick={() => applyPresetAim(80, 24)}
                        className={`text-xs py-1.5 px-2 rounded-lg bg-slate-800 border ${aimX > 65 && aimY < 40 ? 'border-yellow-400 text-yellow-400 font-bold' : 'border-slate-700 text-slate-300'}`}
                      >
                        ↗ 우상단 구석
                      </button>
                      <button
                        id="preset-bl"
                        onClick={() => applyPresetAim(22, 75)}
                        className={`text-xs py-1.5 px-2 rounded-lg bg-slate-800 border ${aimX < 35 && aimY >= 60 ? 'border-yellow-400 text-yellow-400 font-bold' : 'border-slate-700 text-slate-300'}`}
                      >
                        ↙ 좌하단 땅볼
                      </button>
                      <button
                        id="preset-cc"
                        onClick={() => applyPresetAim(50, 52)}
                        className={`text-xs py-1.5 px-2 rounded-lg bg-slate-800 border ${aimX >= 35 && aimX <= 65 && aimY >= 40 && aimY < 60 ? 'border-yellow-400 text-yellow-400 font-bold' : 'border-slate-700 text-slate-300'}`}
                      >
                        🎯 한가운데
                      </button>
                      <button
                        id="preset-br"
                        onClick={() => applyPresetAim(78, 75)}
                        className={`text-xs py-1.5 px-2 rounded-lg bg-slate-800 border ${aimX > 65 && aimY >= 60 ? 'border-yellow-400 text-yellow-400 font-bold' : 'border-slate-700 text-slate-300'}`}
                      >
                        ↘ 우하단 땅볼
                      </button>
                    </div>
                  </div>

                  {/* Shoot physics selection tabs */}
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">슛 종류 선택 (KICK STYLE)</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                      <button
                        id="btn-style-finesse"
                        onClick={() => { setShotType('finesse'); playHaptic(); }}
                        className={`text-xs py-2 rounded-lg transition-all ${shotType === 'finesse' ? 'bg-yellow-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        감아차기🎯
                        <span className="text-[9px] block font-mono text-slate-600">정밀함/중속</span>
                      </button>
                      <button
                        id="btn-style-power"
                        onClick={() => { setShotType('power'); playHaptic(); }}
                        className={`text-xs py-2 rounded-lg transition-all ${shotType === 'power' ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        파워 슛🔥
                        <span className="text-[9px] block font-mono text-white/50">강속/낮은 정확도</span>
                      </button>
                      <button
                        id="btn-style-panenka"
                        onClick={() => { setShotType('panenka'); playHaptic(); }}
                        className={`text-xs py-2 rounded-lg transition-all ${shotType === 'panenka' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        파넨카 슛🌀
                        <span className="text-[9px] block font-mono text-white/50">느림/야바위</span>
                      </button>
                    </div>
                  </div>

                  {/* Shooting Power slider control */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs text-slate-400">
                      <span>슈팅 스피드 파워 조정</span>
                      <span className="font-mono text-yellow-400">{power}%</span>
                    </div>
                    <input
                      id="range-power-slider"
                      type="range"
                      min="30"
                      max="100"
                      value={power}
                      onChange={(e) => { setPower(Number(e.target.value)); }}
                      className="w-full accent-yellow-400 bg-slate-800 rounded-lg appearance-none h-2"
                    />
                  </div>

                  {/* Main Shoot Action Trigger */}
                  <button
                    id="btn-trigger-shoot"
                    onClick={handleUserShoot}
                    className="w-full bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-slate-950 text-base font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-red-500/10 active:scale-95 transition-all text-center flex items-center justify-center gap-2 mt-2"
                  >
                    <span>강력하게 슛! (KICK)</span>
                    <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
                  </button>
                </div>
              ) : (
                /* GOALKEEPER DEFENSIVE CONTROLS */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm font-bold text-cyan-400 uppercase">
                      <Shield className="w-4 h-4" />
                      <span>골키퍼 방어 방포진</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-[11px] text-slate-400 font-mono block mb-2">상대 공격수가 차기 전에 방어할 구역을 선택하세요</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        id="def-preset-tl"
                        onClick={() => applyPresetDefence(20, 24)}
                        className={`text-xs py-2 px-2 rounded-lg bg-slate-800 border ${gkDefendAimX < 35 && gkDefendAimY < 40 ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20' : 'border-slate-700 text-slate-300'}`}
                      >
                        ↖ 좌상문 다이빙
                      </button>
                      <button
                        id="def-preset-tc"
                        onClick={() => applyPresetDefence(50, 22)}
                        className={`text-xs py-2 px-2 rounded-lg bg-slate-800 border ${gkDefendAimX >= 35 && gkDefendAimX <= 65 && gkDefendAimY < 40 ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20' : 'border-slate-700 text-slate-300'}`}
                      >
                        ⬆ 제자리 수비
                      </button>
                      <button
                        id="def-preset-tr"
                        onClick={() => applyPresetDefence(80, 24)}
                        className={`text-xs py-2 px-2 rounded-lg bg-slate-800 border ${gkDefendAimX > 65 && gkDefendAimY < 40 ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20' : 'border-slate-700 text-slate-300'}`}
                      >
                        ↗ 우상문 다이빙
                      </button>
                      <button
                        id="def-preset-bl"
                        onClick={() => applyPresetDefence(22, 75)}
                        className={`text-xs py-2 px-2 rounded-lg bg-slate-800 border ${gkDefendAimX < 35 && gkDefendAimY >= 60 ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20' : 'border-slate-700 text-slate-300'}`}
                      >
                        ↙ 좌하 방향
                      </button>
                      <button
                        id="def-preset-cc"
                        onClick={() => applyPresetDefence(50, 52)}
                        className={`text-xs py-2 px-2 rounded-lg bg-slate-800 border ${gkDefendAimX >= 35 && gkDefendAimX <= 65 && gkDefendAimY >= 40 && gkDefendAimY < 60 ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20' : 'border-slate-700 text-slate-300'}`}
                      >
                        🎯 중앙 차단
                      </button>
                      <button
                        id="def-preset-br"
                        onClick={() => applyPresetDefence(78, 75)}
                        className={`text-xs py-2 px-2 rounded-lg bg-slate-800 border ${gkDefendAimX > 65 && gkDefendAimY >= 60 ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20' : 'border-slate-700 text-slate-300'}`}
                      >
                        ↘ 우하 방향
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-900 text-center">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      착용한 장갑 보정치: <strong className="text-cyan-400">{selectedGlove.name}</strong> 🖐️
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{selectedGlove.description}</span>
                  </div>

                  {/* Save Action Trigger */}
                  <button
                    id="btn-trigger-save"
                    onClick={handleUserSave}
                    className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-base font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-500/10 active:scale-95 transition-all text-center flex items-center justify-center gap-2 mt-2"
                  >
                    <span>수비 장갑 뻗기! (SAVE)</span>
                    <Shield className="w-5 h-5 text-white animate-spin-slow" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ANIMATING PITCH STRETCH LOG */
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full"
              />
              <p className="text-sm font-mono text-slate-300 tracking-wide animate-pulse">
                {phase === 'KICKING' ? '강력하게 킥보드를 딛고 슈팅하는 중...' : '공의 궤적을 소리 죽여 응시하는 중...'}
              </p>
            </div>
          )}
        </div>

        {/* Action Bottom Section Footing */}
        <div className="border-t border-slate-900 pt-4 mt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>경기 중 포기할 수 있습니다:</span>
          <button 
            id="btn-giveup"
            onClick={() => {
              if (window.confirm('정말 현재 경기를 포기하고 나가시겠습니까? 기권패 처리됩니다.')) {
                onMatchFinished(false, { player: 0, opponent: 5 });
              }
            }}
            className="text-red-400 hover:text-red-300 underline underline-offset-2 cursor-pointer font-bold"
          >
            기권 전송패
          </button>
        </div>

      </div>

      {/* MATCH OVER GRAND MODAL OVERLAY */}
      <AnimatePresence>
        {matchOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden"
            >
              
              {/* Gold light effects */}
              {winner === 'player' && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-yellow-500 via-yellow-300 to-amber-500 z-10" />
              )}

              <div className="w-20 h-20 mx-auto bg-slate-850 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                {winner === 'player' ? (
                  <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-bounce" />
                ) : (
                  <RotateCcw className="w-10 h-10 text-slate-400 animate-pulse" />
                )}
              </div>

              <h2 className="text-2xl font-bold tracking-tight mb-2">
                {winner === 'player' ? '🏆 경기 승리! 우수 플레이어' : '😞 아쉬운 경기 패배'}
              </h2>

              <p className="text-slate-300 text-sm mb-6">
                {winner === 'player' 
                  ? `축하합니다! ${opponentTeam.name}을(를) 상대로 스페셜 선방과 정교한 골을 구사하여 승리를 거머쥐었습니다!`
                  : `${opponentTeam.name}의 공세를 이겨내지 못했습니다. 훈련장에서 골 감각을 더 조율하고 컵 대회에 재도전하세요!`
                }
              </p>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 max-w-xs mx-auto mb-6 text-mono">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">최종 점수</span>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-bold block">{playerTeam.name}</span>
                    <span className="text-lg font-mono font-black text-rose-400">{playerScore}</span>
                  </div>
                  <span className="text-slate-600 font-bold text-lg">:</span>
                  <div className="text-left">
                    <span className="text-sm font-bold block">{opponentTeam.name}</span>
                    <span className="text-lg font-mono font-black text-slate-400">{opponentScore}</span>
                  </div>
                </div>
              </div>

              <button
                id="btn-exit-and-conclude"
                onClick={handleExitMatch}
                className={`w-full font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer ${
                  winner === 'player' 
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                메인센터 및 컵 진행 보관함으로
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
