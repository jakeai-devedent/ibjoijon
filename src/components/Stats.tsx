/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerProfile, Team } from '../types';
import { TEAMS } from '../constants';
import { Award, BarChart3, Star, Compass, User, Globe, Calendar } from 'lucide-react';

interface StatsProps {
  profile: PlayerProfile;
  onSelectTeam: (teamId: string) => void;
}

export default function Stats({ profile, onSelectTeam }: StatsProps) {
  // Find selected active team profile object configuration
  const activeTeam = TEAMS.find((t) => t.id === profile.selectedTeamId) || TEAMS[0];

  const winRate = profile.matchesPlayed > 0 
    ? Math.round((profile.matchesWon / profile.matchesPlayed) * 100) 
    : 0;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-6 self-stretch">
      
      {/* Upper info profile header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5.5 h-5.5 text-yellow-400" />
            <h2 className="text-lg font-black tracking-tight text-white">📋 국가대표 캐비닛 및 이력서</h2>
          </div>
          <p className="text-xs text-slate-400">
            축구 협회 소속 라이선스 국가대표 팀을 자유롭게 이적하거나 승부차기 커리어 성적통계표를 확인하세요.
          </p>
        </div>

        {/* Selected National details display */}
        <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850 text-xs font-mono flex items-center gap-2">
          <span className="text-slate-500">현재 대표팀:</span>
          <span className="text-sm">{activeTeam.flag}</span>
          <span className="font-bold text-white">{activeTeam.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. Career stats metrics indicators col */}
        <div className="md:col-span-2 space-y-4">
          <span className="text-[11px] uppercase tracking-widest font-mono font-black text-slate-500 block">
            역대 승부차기 성취 보고서
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Stat Item 1 */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">총 매치 참가</span>
              <span className="text-xl font-black font-mono text-white mt-1 block">
                {profile.matchesPlayed}회
              </span>
            </div>

            {/* Stat Item 2 */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">매치 승리</span>
              <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
                {profile.matchesWon}승
              </span>
              <span className="text-[9px] text-slate-500 block">승률: {winRate}%</span>
            </div>

            {/* Stat Item 3 */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">성공한 골 슛수</span>
              <span className="text-xl font-black font-mono text-yellow-400 mt-1 block">
                ⚽ {profile.careerGoals}
              </span>
              <span className="text-[9px] text-slate-500 block">환상원더슛 포함</span>
            </div>

            {/* Stat Item 4 */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-slate-500 block font-bold">골키퍼 선방</span>
              <span className="text-xl font-black font-mono text-cyan-400 mt-1 block">
                🧤 {profile.careerSaves}
              </span>
              <span className="text-[9px] text-slate-500 block">장갑 특화 보정</span>
            </div>

          </div>

          {/* National Team Selectors Box Grid */}
          <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-2xl">
            <span className="text-[11px] uppercase tracking-widest font-mono font-black text-slate-400 block mb-3">
              원하는 국가대표 스쿼드로 즉시 이적 (클릭 시 선택)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEAMS.map((team) => {
                const isSelected = profile.selectedTeamId === team.id;
                return (
                  <button
                    key={team.id}
                    id={`team-selector-${team.id}`}
                    onClick={() => onSelectTeam(team.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-yellow-400 bg-yellow-400/[0.04] shadow' 
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <span className="text-2xl mb-1">{team.flag}</span>
                    <span className="text-xs font-bold text-white truncate max-w-full">{team.name}</span>
                    
                    {/* Tiny stats representation helper */}
                    <div className="flex gap-1.5 mt-2 font-mono text-[9px] text-slate-500">
                      <span>P:{team.power}</span>
                      <span>R:{team.reflex}</span>
                    </div>

                    {isSelected && (
                      <span className="text-[8px] mt-1 bg-yellow-400 text-slate-950 font-bold px-1 rounded-sm">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Trophies Cabinet display Showcase */}
        <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-widest font-mono font-black text-slate-500 block mb-3">
              내 명예 트로피 전시장
            </span>

            <div className="space-y-3">
              {profile.trophies.length === 0 ? (
                <div className="py-12 text-center text-slate-600 flex flex-col items-center justify-center space-y-2">
                  <Award className="w-10 h-10 text-slate-800 stroke-1" />
                  <p className="text-xs">전시된 트로피가 없습니다.<br />토너먼트 컵에서 최종 우승하세요!</p>
                </div>
              ) : (
                profile.trophies.map((trophyId, idx) => (
                  <div 
                    key={`tr-${idx}`}
                    className="bg-slate-900 border border-yellow-500/20 p-3 rounded-xl flex items-center gap-3 relative overflow-hidden"
                  >
                    {/* Light diagonal pattern background shine */}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-yellow-400 opacity-20" />

                    <div className="w-10 h-10 bg-yellow-400/10 rounded-full border border-yellow-400/20 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-yellow-300">월드 토너먼트 컵 우승</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">국제 승부차기 대회 정복자</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900/60 text-[10px] text-slate-500 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>FIFA 라이선스 번호:</span>
              <span>#{profile.selectedTeamId}-{Math.round(profile.coins * 3.14)}</span>
            </div>
            <div className="flex justify-between">
              <span>기록 수집 일시:</span>
              <span className="flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" /> 2026-06
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
