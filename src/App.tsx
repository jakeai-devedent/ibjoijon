/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Team, PlayerProfile, ShopItem, TournamentState, TournamentMatch } from './types';
import { TEAMS, INITIAL_SHOP_ITEMS, INITIAL_PROFILE } from './constants';
import Stadium from './components/Stadium';
import Tournament from './components/Tournament';
import Shop from './components/Shop';
import Stats from './components/Stats';
import { 
  Trophy, 
  ShoppingBag, 
  User, 
  Home, 
  CircleDot, 
  Play, 
  Info, 
  Coins, 
  Percent, 
  Sword, 
  CheckCircle,
  TrendingUp,
  Gift,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // --- Persistent States ---
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('soccer_profile_v1');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const saved = localStorage.getItem('soccer_shop_v1');
    if (saved) {
      return JSON.parse(saved);
    }
    return INITIAL_SHOP_ITEMS;
  });

  const [tournament, setTournament] = useState<TournamentState>(() => {
    const saved = localStorage.getItem('soccer_tournament_v1');
    if (saved) {
      return JSON.parse(saved);
    }
    return generateNewTournament(INITIAL_PROFILE.selectedTeamId);
  });

  // --- Active Tab State ---
  // Tabs: 'home' | 'match' | 'tournament' | 'shop' | 'stats'
  const [activeTab, setActiveTab] = useState<'home' | 'match' | 'tournament' | 'shop' | 'stats'>('home');

  // --- Match Config State (For Quick Friendlies or active tournament match) ---
  const [matchOpponent, setMatchOpponent] = useState<Team | null>(null);
  const [isTournamentMatch, setIsTournamentMatch] = useState(false);

  // Help info modal toggle
  const [showHelp, setShowHelp] = useState(false);

  // Daily coin reward checker
  const [lastDailyClaim, setLastDailyClaim] = useState(() => {
    return localStorage.getItem('soccer_last_daily_claim') || '';
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('soccer_profile_v1', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('soccer_shop_v1', JSON.stringify(shopItems));
  }, [shopItems]);

  useEffect(() => {
    localStorage.setItem('soccer_tournament_v1', JSON.stringify(tournament));
  }, [tournament]);

  // Utility to generate a randomized full bracket for the cup
  function generateNewTournament(userTeamId: string): TournamentState {
    // 1. Shuffle teams, make sure user selected team is included
    const activePlayerTeam = TEAMS.find((t) => t.id === userTeamId) || TEAMS[0];
    const otherTeams = TEAMS.filter((t) => t.id !== userTeamId);
    
    // Pick 7 other teams in random order
    const shuffledOthers = [...otherTeams].sort(() => Math.random() - 0.5);
    const participatingTeams: Team[] = [activePlayerTeam, ...shuffledOthers.slice(0, 7)];

    // Pair them up inside Quarter-finals (4 matches)
    const qMatches: TournamentMatch[] = [
      { id: 'q1', teamA: participatingTeams[0], teamB: participatingTeams[1], isPlayed: false },
      { id: 'q2', teamA: participatingTeams[2], teamB: participatingTeams[3], isPlayed: false },
      { id: 'q3', teamA: participatingTeams[4], teamB: participatingTeams[5], isPlayed: false },
      { id: 'q4', teamA: participatingTeams[6], teamB: participatingTeams[7], isPlayed: false },
    ];

    return {
      currentStageIdx: 0,
      stages: [
        { name: '8강전 (Quarterfinals)', matches: qMatches },
        { name: '4강 준결승 (Semifinals)', matches: [] },
        { name: '결승전 (Grand Finals)', matches: [] },
      ],
      isTournamentActive: true,
      userEliminated: false,
      userWonCup: false,
    };
  }

  // Claim Daily Soccer reward coins (150 coins once a day)
  const handleClaimDailyCoins = () => {
    const today = new Date().toISOString().split('T')[0];
    if (lastDailyClaim === today) {
      alert('이미 오늘의 무료 훈련 보조금을 받으셨습니다! 내일 다시 도전하세요.');
      return;
    }
    setLastDailyClaim(today);
    localStorage.setItem('soccer_last_daily_claim', today);
    setProfile(prev => ({
      ...prev,
      coins: prev.coins + 150
    }));
    alert('🎉 일일 훈련 보조금 150 코인이 지급되었습니다! 상점에서 더 좋은 장비를 활성화해 보세요.');
  };

  // Switch Active Squad
  const handleSelectTeam = (teamId: string) => {
    // Cannot change mid-tournament matches logically or we can restart the tournament for the new team which makes sense
    setProfile((prev) => ({
      ...prev,
      selectedTeamId: teamId,
    }));

    // Re-initialize tournament cup tree with the new team selection to remain immersive
    setTournament(generateNewTournament(teamId));
  };

  // Buy Shop Customizations
  const handleBuyShopItem = (itemId: string, price: number) => {
    if (profile.coins < price) {
      alert('골드 코인이 부족합니다!');
      return;
    }

    setProfile((prev) => ({
      ...prev,
      coins: prev.coins - price,
      unlockedItemIds: [...prev.unlockedItemIds, itemId],
    }));

    setShopItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, unlocked: true } : item))
    );
  };

  // Equip Shop Customizations
  const handleEquipItem = (itemId: string, type: 'ball' | 'glove' | 'stadium') => {
    setProfile((prev) => {
      const updated = { ...prev };
      if (type === 'ball') updated.selectedBallId = itemId;
      if (type === 'glove') updated.selectedGloveId = itemId;
      if (type === 'stadium') updated.selectedStadiumId = itemId;
      return updated;
    });
  };

  // Begin Match (Quick Friendly or Bracket play)
  const handleStartMatch = (opponent: Team, isCup: boolean = false) => {
    setMatchOpponent(opponent);
    setIsTournamentMatch(isCup);
    setActiveTab('match');
  };

  // Event Stats callback from Stadium
  const handleTriggerStat = (type: 'goal' | 'save') => {
    setProfile((prev) => ({
      ...prev,
      careerGoals: type === 'goal' ? prev.careerGoals + 1 : prev.careerGoals,
      careerSaves: type === 'save' ? prev.careerSaves + 1 : prev.careerSaves,
    }));
  };

  // Coin earning callback from Stadium (Goals, Saves, Wins)
  const handleEarnCoins = (amount: number) => {
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + amount,
    }));
  };

  // Conclude Penalty Match shootout Arena
  const handleMatchFinished = (isWin: boolean, score: { player: number; opponent: number }) => {
    // 1. Update Profile general statistics
    setProfile((prev) => ({
      ...prev,
      matchesPlayed: prev.matchesPlayed + 1,
      matchesWon: isWin ? prev.matchesWon + 1 : prev.matchesWon,
      coins: prev.coins + (isWin ? 100 : 30), // standard match rewards
    }));

    if (!isTournamentMatch) {
      // Friendly match, simply close and go back to home tab
      setMatchOpponent(null);
      setActiveTab('home');
      return;
    }

    // 2. Tournament Match progression
    const currentStageIdx = tournament.currentStageIdx;
    const currentStage = tournament.stages[currentStageIdx];

    const updatedMatches = currentStage.matches.map((m) => {
      const involvesUser = m.teamA.id === profile.selectedTeamId || m.teamB.id === profile.selectedTeamId;
      if (involvesUser) {
        const isTeamAUser = m.teamA.id === profile.selectedTeamId;
        return {
          ...m,
          scoreA: isTeamAUser ? score.player : score.opponent,
          scoreB: isTeamAUser ? score.opponent : score.player,
          winnerId: isWin ? profile.selectedTeamId : m.teamA.id === profile.selectedTeamId ? m.teamB.id : m.teamA.id,
          isPlayed: true,
        };
      }
      return m;
    });

    // Save stage and check user survival
    let userEliminated = !isWin;

    const nextStages = tournament.stages.map((stg, idx) => {
      if (idx === currentStageIdx) {
        return { ...stg, matches: updatedMatches };
      }
      return stg;
    });

    setTournament((prev) => ({
      ...prev,
      stages: nextStages,
      userEliminated: prev.userEliminated || userEliminated,
    }));

    // Clear active opponent state
    setMatchOpponent(null);
    setActiveTab('tournament');
  };

  // Reset Tournament Cup completely
  const handleResetTournament = () => {
    if (window.confirm('정말 현재 토너먼트 기록을 초기화하시겠습니까? 처음 대진표부터 대표팀 전적이 재시드됩니다.')) {
      setTournament(generateNewTournament(profile.selectedTeamId));
    }
  };

  // Simulate non-user matches in the active stage inside the Tournament
  const handleSimulateStageMatches = () => {
    const stageIdx = tournament.currentStageIdx;
    const currentStage = tournament.stages[stageIdx];

    // Helper simulation function based on team power & random factor
    const simulateMatch = (match: TournamentMatch) => {
      if (match.isPlayed) return match;

      const pA = match.teamA.power;
      const pB = match.teamB.power;
      
      // Calculate scores
      let scoreA = Math.floor(Math.random() * 4) + 1; // 1-4 goals
      let scoreB = Math.floor(Math.random() * 4) + 1;

      // Weighted score adjustment by power stat
      if (pA > pB + 5) {
        scoreA += 1;
      } else if (pB > pA + 5) {
        scoreB += 1;
      }

      // Tie resolution
      if (scoreA === scoreB) {
        if (Math.random() > 0.5) scoreA += 1;
        else scoreB += 1;
      }

      const winnerId = scoreA > scoreB ? match.teamA.id : match.teamB.id;

      return {
        ...match,
        scoreA,
        scoreB,
        winnerId,
        isPlayed: true,
      };
    };

    // 1. Resolve all matches of current stage
    const simulatedMatches = currentStage.matches.map((m) => simulateMatch(m));

    // Determine stage winners
    const stageWinners: Team[] = simulatedMatches.map((m) => {
      return m.winnerId === m.teamA.id ? m.teamA : m.teamB;
    });

    const nextStages = [...tournament.stages];
    nextStages[stageIdx].matches = simulatedMatches;

    // 2. Draft the next stage bracket matches if user is NOT eliminated and there is a next stage
    let nextStageIdx = stageIdx + 1;
    let userWonCup = false;

    if (!tournament.userEliminated && nextStageIdx < 3) {
      const winnersList = stageWinners;
      const userTeamObj = TEAMS.find((t) => t.id === profile.selectedTeamId) || TEAMS[0];

      if (stageIdx === 0) {
        // 8강 -> 4강 (4 winners paired into 2 matches)
        // Make sure user matches are correct. User team is one of winners.
        const otherWinners = winnersList.filter(w => w.id !== profile.selectedTeamId);
        
        const sfMatches: TournamentMatch[] = [
          { id: 's1', teamA: userTeamObj, teamB: otherWinners[0], isPlayed: false },
          { id: 's2', teamA: otherWinners[1], teamB: otherWinners[2], isPlayed: false },
        ];
        
        nextStages[1].matches = sfMatches;
      } else if (stageIdx === 1) {
        // 4강 -> 결승 (2 winners)
        const otherWinners = winnersList.filter(w => w.id !== profile.selectedTeamId);
        
        const fMatches: TournamentMatch[] = [
          { id: 'f1', teamA: userTeamObj, teamB: otherWinners[0], isPlayed: false },
        ];
        
        nextStages[2].matches = fMatches;
      }
    } else if (!tournament.userEliminated && nextStageIdx === 3) {
      // USER WON FINAL CUP!
      userWonCup = true;
      // Award premium trophy and 500 gold bonus!
      setProfile((prev) => ({
        ...prev,
        coins: prev.coins + 500,
        trophies: [...prev.trophies, `world_cup_${Date.now()}`],
      }));
    }

    setTournament((prev) => ({
      ...prev,
      stages: nextStages,
      currentStageIdx: Math.min(2, nextStageIdx),
      userWonCup: prev.userWonCup || userWonCup,
    }));
  };

  // Get equips
  const currentBall = shopItems.find((i) => i.id === profile.selectedBallId) || shopItems[0];
  const currentGlove = shopItems.find((i) => i.id === profile.selectedGloveId) || shopItems[4];
  const currentStadium = shopItems.find((i) => i.id === profile.selectedStadiumId) || shopItems[7];
  const userTeam = TEAMS.find((t) => t.id === profile.selectedTeamId) || TEAMS[0];

  // Random quick team opponent select for Quick Friendlies
  const initiateQuickFriendlyMatch = () => {
    const candidates = TEAMS.filter((t) => t.id !== profile.selectedTeamId);
    const randomOpponent = candidates[Math.floor(Math.random() * candidates.length)];
    handleStartMatch(randomOpponent, false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-yellow-400 selection:text-slate-950">
      
      {/* 1. Header Bar Navigation and Balance */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo & Slogan */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-yellow-500/20">
              ⚽
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1">
                페널티 킥 챔피언십 <span className="text-[10px] bg-red-500 text-white font-extrabold px-1 rounded-sm">V1.2</span>
              </h1>
              <p className="text-[9px] text-slate-400 tracking-wider">SHOOTOUT ARENA 2026</p>
            </div>
          </div>

          {/* Controls Bar Right */}
          <div className="flex items-center gap-3">
            
            {/* Currency Tracker Widget */}
            <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono font-bold text-yellow-400 flex items-center gap-1 shadow-inner">
              <span>🪙</span>
              <span>{profile.coins.toLocaleString()}</span>
            </div>

            {/* Help guidelines */}
            <button
              id="header-help-trigger"
              onClick={() => { setShowHelp(!showHelp); }}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 transition-all cursor-pointer"
              title="게임 규칙 및 가이드"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

          </div>

        </div>
      </header>

      {/* 2. Help Guideline Instructions Overlay Drawer */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full relative">
              <h3 className="text-base font-black mb-3 text-yellow-400">📖 승부차기 게임 가이드</h3>
              
              <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed mb-6 font-mono">
                <div>
                  <strong className="text-white block mb-0.5">1. 공격 모드 (슛 차기)</strong>
                  <p>수비 골문 안쪽에 슛 목표 조준점을 마우스/터치로 변경하세요. 다양한 슛 스타일 필터를 지정하거나 슛 세기를 알맞게 슬라이더로 조율한 뒤 "강력하게 슛!"을 타격하면, 수비 인공지능 대비 정확한 판정으로 골 결정 여부가 결정됩니다.</p>
                </div>
                <div>
                  <strong className="text-white block mb-0.5">2. 골키퍼 모드 (골 세이브)</strong>
                  <p>상대편 공격수의 킥 전, 본인이 다이빙하며 방어할 구역(↖ ↗ ↙ ↘ 🎯) 중 하나를 지정하세요. 상대 방향과 본인의 세이브 구역이 정확히 일치하거나 근접할 경우 장갑 아이콘을 쥐고 슈퍼 세이브를 선사합니다.</p>
                </div>
                <div>
                  <strong className="text-white block mb-0.5">3. 슛 종류 가이드</strong>
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-400">
                    <li><span className="text-yellow-400">감아차기:</span> 안정정밀하지만 속도가 다소 느립니다.</li>
                    <li><span className="text-orange-400">파워 슛:</span> 최고속 탄도로 선방 구역을 뚦으나 조준 오차가 커집니다.</li>
                    <li><span className="text-purple-400">파넨카 슛:</span> 골키퍼 타이밍을 역이용해 높은 확률로 허를 찌릅니다.</li>
                  </ul>
                </div>
              </div>

              <button
                id="btn-close-help"
                onClick={() => setShowHelp(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                가이드 닫기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Center Workspace Containers */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:py-6 flex flex-col items-center justify-start gap-6">
        
        {/* Play Action Match State Overrides Default Router Tabs */}
        {activeTab === 'match' && matchOpponent ? (
          <Stadium
            playerTeam={userTeam}
            opponentTeam={matchOpponent}
            selectedBall={currentBall}
            selectedGlove={currentGlove}
            selectedStadium={currentStadium}
            onMatchFinished={handleMatchFinished}
            onTriggerStat={handleTriggerStat}
            onEarnCoins={handleEarnCoins}
          />
        ) : (
          <>
            {/* Dynamic UI Tabs Renderer */}
            
            {/* LOBBY / HOME Tab */}
            {activeTab === 'home' && (
              <div className="w-full space-y-6">
                
                {/* Hero Showcase Layout Card */}
                <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  {/* Hexagon pattern or stadium net vibe */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                  <div className="space-y-4 max-w-xl text-center md:text-left z-10">
                    <span className="bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest font-mono">
                      ⚽ 승부차기 아카데미 오신 것을 환영합니다!
                    </span>
                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                      짜릿한 각도조율의 쾌감!<br />
                      국민 스포츠 <span className="text-yellow-400">페널티 킥 대결</span>
                    </h2>
                    <p className="text-xs md:text-sm text-slate-300">
                      당신은 팀의 에이스 전담 키커이자 골문을 수호하는 최후의 철벽 수문장입니다. 슛 탄도, 회전 궤적, 슈팅 슬라이드 파워 등을 정밀 세팅하여 각국 경쟁국을 차례차례 무찌르고 세계 정상의 황금 트로피를 직접 들어올 리세요!
                    </p>

                    {/* Quick Stat info */}
                    <div className="flex justify-center md:justify-start gap-4 text-xs font-mono text-slate-400">
                      <div>
                        🏆 우승 트로피: <span className="text-yellow-400 font-bold">{profile.trophies.length}개</span>
                      </div>
                      <div>
                        ⚽ 총 골 득점: <span className="text-white font-bold">{profile.careerGoals}골</span>
                      </div>
                      <div>
                        🧤 신들린 세이브: <span className="text-cyan-400 font-bold">{profile.careerSaves}회</span>
                      </div>
                    </div>
                  </div>

                  {/* Right quick starter CTA buttons box */}
                  <div className="bg-slate-930/95 border border-slate-800 p-5 rounded-2xl w-full md:w-80 space-y-3 z-10 shrink-0 shadow-lg">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block text-center">퀵 플레이 센터</span>
                    
                    <button
                      id="btn-fast-friendly"
                      onClick={initiateQuickFriendlyMatch}
                      className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>친선 빠른 경기 (100골드 보상)</span>
                    </button>

                    <button
                      id="btn-goto-cup"
                      onClick={() => setActiveTab('tournament')}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-slate-300" />
                      <span>월드 토너먼트 컵 입장</span>
                    </button>

                    <div className="border-t border-slate-850 pt-2 flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>내 액티브 대표팀:</span>
                      <strong className="text-slate-300 flex items-center gap-1">
                        <span>{userTeam.flag}</span>
                        <span>{userTeam.name}</span>
                      </strong>
                    </div>
                  </div>

                </div>

                {/* Dashboard Widgets Row layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Daily Reward / Upgrade Box */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-yellow-400">
                        <Gift className="w-5 h-5 text-yellow-400" />
                        <h3 className="font-bold text-sm text-white">매일 무료 일일 훈련 보조금</h3>
                      </div>
                      <p className="text-xs text-slate-400 font-mono leading-relaxed">
                        선수 양성을 우대하기 위해 하루 한번 150 코인의 무료 훈련 보조금을 지급합니다. 장비 강화를 위해 터치하여 수령하세요!
                      </p>
                    </div>

                    <button
                      id="btn-claim-daily"
                      onClick={handleClaimDailyCoins}
                      className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-xs py-2 px-4 rounded-lg mt-4 transition-all w-full cursor-pointer active:scale-95"
                    >
                      🎁 일일보조금 150 코인 받기
                    </button>
                  </div>

                  {/* Current Active Gear Layout */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-cyan-400">
                        <ShoppingBag className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-bold text-sm text-white">활성화 장비 파워업 현황</h3>
                      </div>
                      <div className="space-y-2 mt-2 text-xs font-mono">
                        <div className="flex justify-between border-b border-slate-850 pb-1.5">
                          <span className="text-slate-500">이펙트 축구공</span>
                          <strong className="text-slate-300">{currentBall.name}</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-850 pb-1.5">
                          <span className="text-slate-500">특화 수비장갑</span>
                          <strong className="text-slate-300">{currentGlove.name}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">홈 스킨 경기장</span>
                          <strong className="text-slate-300 truncate max-w-[120px]">{currentStadium.name}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      id="btn-home-custom-gear"
                      onClick={() => setActiveTab('shop')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-4 rounded-lg mt-4 transition-all w-full text-center border border-slate-700 cursor-pointer"
                    >
                      장착 상점 이동 교체
                    </button>
                  </div>

                  {/* Top Squad Stats widget info */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-indigo-400">
                        <TrendingUp className="w-5 h-5" />
                        <h3 className="font-bold text-sm text-white">{userTeam.name} 엔트리 스탯</h3>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                            <span>슈팅 스피드 파워</span>
                            <span className="text-slate-300 font-bold">{userTeam.power}/100</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${userTeam.power}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                            <span>골키퍼 선방 반사신경</span>
                            <span className="text-slate-300 font-bold">{userTeam.reflex}/100</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: `${userTeam.reflex}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      id="btn-home-switch-team"
                      onClick={() => setActiveTab('stats')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-4 rounded-lg mt-4 transition-all w-full text-center border border-slate-700 cursor-pointer"
                    >
                      국가대표 이적 캐비닛
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* TOURNAMENT TAB */}
            {activeTab === 'tournament' && (
              <Tournament
                playerTeam={userTeam}
                tournamentState={tournament}
                onStartMatch={(opp) => handleStartMatch(opp, true)}
                onResetTournament={handleResetTournament}
                onSimulateStageMatches={handleSimulateStageMatches}
              />
            )}

            {/* SHOP TAB */}
            {activeTab === 'shop' && (
              <Shop
                profile={profile}
                onBuyItem={handleBuyShopItem}
                onEquipItem={handleEquipItem}
                shopItemsList={shopItems}
              />
            )}

            {/* STATS & TEAM SELECT TAB */}
            {activeTab === 'stats' && (
              <Stats
                profile={profile}
                onSelectTeam={handleSelectTeam}
              />
            )}

          </>
        )}

      </main>

      {/* 4. Global Responsive Footer Tab Bar Controls */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3.5 px-4 sticky bottom-0 z-40 shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          
          <button
            id="tab-btn-home"
            disabled={activeTab === 'match'}
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'match' ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'home' ? 'text-yellow-400 font-bold' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-[10px]">로비 홈</span>
          </button>

          <button
            id="tab-btn-tournament"
            disabled={activeTab === 'match'}
            onClick={() => setActiveTab('tournament')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'match' ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'tournament' ? 'text-yellow-400 font-bold' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Trophy className="w-5 h-5 mb-1" />
            <span className="text-[10px]">토너먼트 컵</span>
          </button>

          <button
            id="tab-btn-shop"
            disabled={activeTab === 'match'}
            onClick={() => setActiveTab('shop')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'match' ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'shop' ? 'text-yellow-400 font-bold' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-1" />
            <span className="text-[10px]/tight">장비 상점</span>
          </button>

          <button
            id="tab-btn-stats"
            disabled={activeTab === 'match'}
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'match' ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'stats' ? 'text-yellow-400 font-bold' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-[10px]">엔트리 스쿼드</span>
          </button>

        </div>
      </footer>

    </div>
  );
}
