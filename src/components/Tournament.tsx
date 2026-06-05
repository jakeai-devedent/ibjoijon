/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Team, TournamentState, TournamentMatch } from '../types';
import { TEAMS } from '../constants';
import { Award, Play, ChevronRight, RefreshCw, Trophy, Zap, AlertCircle } from 'lucide-react';

interface TournamentProps {
  playerTeam: Team;
  tournamentState: TournamentState;
  onStartMatch: (opponent: Team) => void;
  onResetTournament: () => void;
  onSimulateStageMatches: () => void;
}

export default function Tournament({
  playerTeam,
  tournamentState,
  onStartMatch,
  onResetTournament,
  onSimulateStageMatches,
}: TournamentProps) {
  const { currentStageIdx, stages, isTournamentActive, userEliminated, userWonCup } = tournamentState;

  // Active match of the user in the current stage
  const currentStage = stages[currentStageIdx];
  const userMatchInStage = currentStage?.matches.find(
    (m) => m.teamA.id === playerTeam.id || m.teamB.id === playerTeam.id
  );

  const getOpponent = (match: TournamentMatch) => {
    return match.teamA.id === playerTeam.id ? match.teamB : match.teamA;
  };

  const isUserStageFinished = userMatchInStage ? userMatchInStage.isPlayed : false;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 self-stretch shadow-xl flex flex-col space-y-6">
      
      {/* Banner Intro Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-yellow-400 animate-bounce" />
            <h2 className="text-xl font-black text-white tracking-tight">🏆 월드 토너먼트 컵</h2>
          </div>
          <p className="text-xs text-slate-400">
            총 8개의 글로벌 강호들이 모여 최종 우승 컵을 다투는 축구 페널티 킬 승부차기 토너먼트입니다.
          </p>
        </div>

        <button
          id="btn-restart-cup"
          onClick={onResetTournament}
          className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>토너먼트 초기화 재도전</span>
        </button>
      </div>

      {/* Main Status & Banner Alert */}
      {userEliminated && (
        <div className="bg-red-950/40 border border-red-900 rounded-xl p-4 flex gap-3 text-red-300 items-start">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">탈락 고배를 마셨습니다</h4>
            <p className="text-xs text-red-400 mt-1">
              토너먼트 대진에서 밀려났습니다. 하지만 언제든지 축구 상점에서 더 좋은 장비를 활성화시킨 뒤, 위 상단 버튼을 클릭해 새 시드를 받아 다시 도전할 수 있습니다!
            </p>
          </div>
        </div>
      )}

      {userWonCup && (
        <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-amber-950/40 border border-yellow-700/50 rounded-xl p-5 flex gap-4 text-yellow-200 items-start animate-pulse">
          <Award className="w-10 h-10 text-yellow-400 shrink-0 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <div>
            <h4 className="text-base font-black text-yellow-300">🎉 축하합니다! 최종 우승 달성!</h4>
            <p className="text-xs text-yellow-400/80 mt-1">
              승부차기의 신이 되셨습니다! 트로피 캐비닛에 월드 컵 트로피가 박 박혀 보관되며 보상 축하 코인인 500 코인을 획득하셨습니다!
            </p>
          </div>
        </div>
      )}

      {/* Play Controls and actions */}
      {!userEliminated && !userWonCup && currentStage && (
        <div className="bg-slate-950/50 border border-slate-850 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
          
          {/* Pulse background lines */}
          <div className="absolute inset-0 bg-yellow-400/5 opacity-[0.02] pointer-events-none" />

          {userMatchInStage && !userMatchInStage.isPlayed ? (
            <>
              <div className="flex items-center gap-4">
                <div className="text-center font-mono shrink-0">
                  <span className="text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded px-2 py-0.5 font-bold uppercase tracking-wide">
                    {currentStage.name} 준수
                  </span>
                  <div className="text-lg font-black text-white mt-1">NEXT MATCH</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="text-2xl block">{playerTeam.flag}</span>
                    <span className="text-xs font-bold block truncate max-w-[80px] text-slate-300">{playerTeam.name}</span>
                  </div>
                  <span className="font-mono text-slate-600 font-bold">VS</span>
                  <div className="text-center">
                    <span className="text-2xl block">{getOpponent(userMatchInStage).flag}</span>
                    <span className="text-xs font-bold block truncate max-w-[80px] text-slate-300">{getOpponent(userMatchInStage).name}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button
                  id="btn-play-shootout"
                  onClick={() => onStartMatch(getOpponent(userMatchInStage))}
                  className="bg-yellow-400 hover:bg-yellow-300 font-extrabold px-6 py-2.5 rounded-xl text-slate-950 text-sm transition-all shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>경기 시작하기</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-emerald-400">당신의 매치는 완료되었습니다!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  라운드 승리를 쟁취하셨습니다. 다른 조의 경쟁 팀 경기 결과를 시뮬레이션하여 대진표를 완성하세요!
                </p>
              </div>
              <button
                id="btn-simulate-round"
                onClick={onSimulateStageMatches}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>주변 조 경기 동시 시뮬레이션</span>
              </button>
            </>
          )}

        </div>
      )}

      {/* Visual Bracket tree visualization */}
      <div className="w-full overflow-x-auto py-4">
        <div className="min-w-[650px] grid grid-cols-3 gap-6 relative">
          
          {/* Quarter-Finals Column (Stage 0) */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-500 text-center uppercase tracking-widest border-b border-slate-800 pb-1.5">
              8강전 (Quarter-Finals)
            </h3>
            
            <div className="space-y-4 flex flex-col justify-around h-[340px]">
              {stages[0].matches.map((match, idx) => (
                <div 
                  key={`qf-${match.id}`}
                  className={`bg-slate-950/70 border rounded-xl p-2.5 transition-all flex flex-col space-y-1.5 relative ${
                    match.isPlayed ? 'border-slate-800' : 'border-slate-800/40'
                  } ${
                    (match.teamA.id === playerTeam.id || match.teamB.id === playerTeam.id)
                      ? 'ring-1 ring-yellow-400/40 bg-yellow-500/[0.02]' 
                      : ''
                  }`}
                >
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 bg-slate-800 text-[9px] text-slate-500 font-mono px-1 rounded border border-slate-700">
                    Q{idx + 1}
                  </div>

                  {/* Team A */}
                  <div className="flex justify-between items-center text-xs">
                    <span className={`flex items-center gap-1 filter ${match.winnerId && match.winnerId !== match.teamA.id ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-sm">{match.teamA.flag}</span>
                      <span className="truncate max-w-[75px] font-medium text-slate-300">{match.teamA.name}</span>
                      {match.teamA.id === playerTeam.id && <span className="text-[9px] bg-yellow-400/20 text-yellow-400 px-1 rounded-sm">MY</span>}
                    </span>
                    <span className="font-mono text-xs font-bold text-yellow-500">
                      {match.isPlayed ? match.scoreA : '-'}
                    </span>
                  </div>

                  {/* Team B */}
                  <div className="flex justify-between items-center text-xs">
                    <span className={`flex items-center gap-1 filter ${match.winnerId && match.winnerId !== match.teamB.id ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-sm">{match.teamB.flag}</span>
                      <span className="truncate max-w-[75px] font-medium text-slate-300">{match.teamB.name}</span>
                      {match.teamB.id === playerTeam.id && <span className="text-[9px] bg-yellow-400/20 text-yellow-400 px-1 rounded-sm">MY</span>}
                    </span>
                    <span className="font-mono text-xs font-bold text-yellow-500">
                      {match.isPlayed ? match.scoreB : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Semi-Finals Column (Stage 1) */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-500 text-center uppercase tracking-widest border-b border-slate-800 pb-1.5">
              4강 준결승 (Semi-Finals)
            </h3>
            
            <div className="space-y-12 flex flex-col justify-around h-[340px]">
              {stages[1].matches.map((match, idx) => (
                <div 
                  key={`sf-${match.id}`}
                  className={`bg-slate-950/70 border rounded-xl p-2.5 transition-all flex flex-col space-y-1.5 relative ${
                    match.isPlayed ? 'border-slate-800' : 'border-slate-800/40'
                  } ${
                    (match.teamA.id === playerTeam.id || match.teamB.id === playerTeam.id)
                      ? 'ring-1 ring-yellow-400/40 bg-yellow-500/[0.02]' 
                      : ''
                  }`}
                >
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 bg-slate-800 text-[9px] text-slate-500 font-mono px-1 rounded border border-slate-700">
                    S{idx + 1}
                  </div>

                  {/* Team A */}
                  <div className="flex justify-between items-center text-xs">
                    <span className={`flex items-center gap-1 filter ${match.winnerId && match.winnerId !== match.teamA.id ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-sm">{match.teamA.flag}</span>
                      <span className="truncate max-w-[75px] font-medium text-slate-300">{match.teamA.name}</span>
                      {match.teamA.id === playerTeam.id && <span className="text-[9px] bg-yellow-400/20 text-yellow-400 px-1 rounded-sm">MY</span>}
                    </span>
                    <span className="font-mono text-xs font-bold text-yellow-500">
                      {match.isPlayed ? match.scoreA : '-'}
                    </span>
                  </div>

                  {/* Team B */}
                  <div className="flex justify-between items-center text-xs">
                    <span className={`flex items-center gap-1 filter ${match.winnerId && match.winnerId !== match.teamB.id ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-sm">{match.teamB.flag}</span>
                      <span className="truncate max-w-[75px] font-medium text-slate-300">{match.teamB.name}</span>
                      {match.teamB.id === playerTeam.id && <span className="text-[9px] bg-yellow-400/20 text-yellow-400 px-1 rounded-sm">MY</span>}
                    </span>
                    <span className="font-mono text-xs font-bold text-yellow-500">
                      {match.isPlayed ? match.scoreB : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finals Column (Stage 2) */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-500 text-center uppercase tracking-widest border-b border-slate-800 pb-1.5">
              결승전 (Grand Finals)
            </h3>
            
            <div className="space-y-4 flex flex-col justify-center h-[340px]">
              {stages[2].matches.map((match) => (
                <div 
                  key={`gf-${match.id}`}
                  className={`bg-slate-950/90 border rounded-2xl p-4 transition-all flex flex-col space-y-3 relative shadow-lg ${
                    match.isPlayed ? 'border-yellow-500/50 bg-yellow-500/[0.01]' : 'border-slate-800'
                  } ${
                    (match.teamA.id === playerTeam.id || match.teamB.id === playerTeam.id)
                      ? 'ring-2 ring-yellow-400/40 bg-yellow-500/[0.02]' 
                      : ''
                  }`}
                >
                  <div className="absolute top-0 right-3 -translate-y-1/2 bg-yellow-400 text-[9px] text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    CHAMPIONSHIP MATCH
                  </div>

                  {/* Team A */}
                  <div className="flex justify-between items-center text-sm">
                    <span className={`flex items-center gap-1.5 filter ${match.winnerId && match.winnerId !== match.teamA.id ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-lg">{match.teamA.flag}</span>
                      <span className="truncate max-w-[90px] font-bold text-slate-200">{match.teamA.name}</span>
                      {match.teamA.id === playerTeam.id && <span className="text-[9px] bg-yellow-400/20 text-yellow-400 px-1 rounded-sm">MY</span>}
                    </span>
                    <span className="font-mono text-sm font-black text-yellow-400">
                      {match.isPlayed ? match.scoreA : '-'}
                    </span>
                  </div>

                  {/* Verses Separator line */}
                  <div className="border-t border-slate-800/80 my-1 font-mono text-[9px] text-center text-slate-600">
                    VS
                  </div>

                  {/* Team B */}
                  <div className="flex justify-between items-center text-sm">
                    <span className={`flex items-center gap-1.5 filter ${match.winnerId && match.winnerId !== match.teamB.id ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-lg">{match.teamB.flag}</span>
                      <span className="truncate max-w-[90px] font-bold text-slate-200">{match.teamB.name}</span>
                      {match.teamB.id === playerTeam.id && <span className="text-[9px] bg-yellow-400/20 text-yellow-400 px-1 rounded-sm">MY</span>}
                    </span>
                    <span className="font-mono text-sm font-black text-yellow-400">
                      {match.isPlayed ? match.scoreB : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
