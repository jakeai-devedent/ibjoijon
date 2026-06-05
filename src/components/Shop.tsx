/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShopItem, PlayerProfile, ItemType } from '../types';
import { INITIAL_SHOP_ITEMS } from '../constants';
import { CircleDot, ShieldCheck, Sparkles, Check, Lock, ShoppingBag } from 'lucide-react';

interface ShopProps {
  profile: PlayerProfile;
  onBuyItem: (itemId: string, price: number) => void;
  onEquipItem: (itemId: string, type: ItemType) => void;
  shopItemsList: ShopItem[];
}

export default function Shop({
  profile,
  onBuyItem,
  onEquipItem,
  shopItemsList,
}: ShopProps) {
  const [activeTab, setActiveTab] = useState<ItemType>('ball');

  const filteredItems = shopItemsList.filter((item) => item.type === activeTab);

  const getIsActiveEquipped = (item: ShopItem) => {
    if (item.type === 'ball') return profile.selectedBallId === item.id;
    if (item.type === 'glove') return profile.selectedGloveId === item.id;
    if (item.type === 'stadium') return profile.selectedStadiumId === item.id;
    return false;
  };

  const activeTabLabel = () => {
    if (activeTab === 'ball') return '매치 캘리버 축구공';
    if (activeTab === 'glove') return '골키퍼 반응 특화 장갑';
    return '슈퍼 메가 스타디움';
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-6 self-stretch">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5.5 h-5.5 text-yellow-400" />
            <h2 className="text-lg font-black tracking-tight text-white">🛍️ 프로 스타디움 커스텀 상점</h2>
          </div>
          <p className="text-xs text-slate-400">
            경기 승리 및 슛/방어 성공 보상으로 획득한 골드 코인을 사용해 스페셜 장비 스킨을 잠금 해제해 보세요.
          </p>
        </div>

        {/* Current Coin Balance Tracker Widget */}
        <div className="bg-slate-950 border border-yellow-500/20 px-4 py-2 rounded-xl flex items-center gap-2 shadow-inner">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">내 자금 잔액</span>
          <span className="text-yellow-400 font-extrabold font-mono text-base flex items-center gap-1">
            🪙 {profile.coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Navigation sub-tabs inside shop */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/70 border border-slate-850 rounded-xl">
        <button
          id="shop-tab-ball"
          onClick={() => setActiveTab('ball')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'ball' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <CircleDot className="w-4 h-4" />
          <span>축구공 ({shopItemsList.filter(i => i.type === 'ball' && i.unlocked).length}/{shopItemsList.filter(i => i.type === 'ball').length})</span>
        </button>

        <button
          id="shop-tab-glove"
          onClick={() => setActiveTab('glove')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'glove' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>골키퍼 장갑 ({shopItemsList.filter(i => i.type === 'glove' && i.unlocked).length}/{shopItemsList.filter(i => i.type === 'glove').length})</span>
        </button>

        <button
          id="shop-tab-stadium"
          onClick={() => setActiveTab('stadium')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'stadium' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="text-sm"> Stadium 🏟️ </span>
          <span>경기장 ({shopItemsList.filter(i => i.type === 'stadium' && i.unlocked).length}/{shopItemsList.filter(i => i.type === 'stadium').length})</span>
        </button>
      </div>

      {/* Tab description label and active grid listing */}
      <div>
        <span className="text-[11px] uppercase tracking-widest font-mono font-black text-slate-500 block mb-3">
          {activeTabLabel()} 스킨 컬렉션
        </span>

        {/* Shop Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isEquipped = getIsActiveEquipped(item);
            const isUnlocked = item.unlocked;
            const canAfford = profile.coins >= item.price;

            return (
              <div 
                key={item.id}
                className={`flex flex-col justify-between border rounded-2xl p-4 transition-all relative ${
                  isEquipped 
                    ? 'border-yellow-400 bg-yellow-400/[0.02] shadow-md shadow-yellow-500/5' 
                    : isUnlocked 
                      ? 'border-slate-800 bg-slate-950 hover:border-slate-700' 
                      : 'border-slate-900 bg-slate-950/70 p-[15px]'
                }`}
              >
                {/* Equipped Badge indicator corner representation */}
                {isEquipped && (
                  <span className="absolute top-2.5 right-2.5 bg-yellow-400 text-slate-950 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full uppercase">
                    활성 장착
                  </span>
                )}

                <div>
                  {/* Item Icon Asset Preview box */}
                  <div className="h-16 w-full rounded-xl flex items-center justify-center mb-4 bg-slate-900 border border-slate-800 relative overflow-hidden">
                    
                    {/* Background glows for premium locked skins */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-slate-600" />
                      </div>
                    )}

                    {/* Previews based on type */}
                    {item.type === 'ball' && (
                      <div className={`w-8 h-8 rounded-full ${item.value} flex items-center justify-center text-sm`}>
                        ⚽
                      </div>
                    )}
                    {item.type === 'glove' && (
                      <div className="flex gap-1">
                        <div className={`w-7 h-7 rounded border flex items-center justify-center text-xs ${item.value}`}>🧤</div>
                        <div className={`w-7 h-7 rounded border flex items-center justify-center text-xs ${item.value}`}>🧤</div>
                      </div>
                    )}
                    {item.type === 'stadium' && (
                      <div className={`w-12 h-6 rounded bg-gradient-to-tr ${item.value} border border-white/20`} />
                    )}
                  </div>

                  {/* Info text details */}
                  <h3 className="font-bold text-white text-sm flex items-center gap-1">
                    <span>{item.name}</span>
                    {item.price > 500 && <Sparkles className="w-3.5 h-3.5 text-yellow-400" />}
                  </h3>
                  
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 h-8">
                    {item.description}
                  </p>

                  {/* Special attribute bonus explanation */}
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-850 mt-3 flex items-center justify-between text-[10px] font-sans">
                    <span className="text-slate-500">기능 특수효과:</span>
                    <strong className="text-yellow-400">{item.perk}</strong>
                  </div>
                </div>

                {/* Operations trigger button */}
                <div className="mt-4 pt-3 border-t border-slate-900/80 flex items-center justify-between">
                  {isUnlocked ? (
                    isEquipped ? (
                      <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1 py-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>장착 완료</span>
                      </div>
                    ) : (
                      <button
                        id={`btn-equip-${item.id}`}
                        onClick={() => onEquipItem(item.id, item.type)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 px-3.5 rounded-lg border border-slate-700 transition-all cursor-pointer active:scale-95"
                      >
                        사용 장착하기
                      </button>
                    )
                  ) : (
                    <>
                      <span className="font-mono text-xs font-bold text-slate-400 flex items-center gap-0.5">
                        🪙 {item.price.toLocaleString()}
                      </span>
                      
                      <button
                        id={`btn-buy-${item.id}`}
                        disabled={!canAfford}
                        onClick={() => onBuyItem(item.id, item.price)}
                        className={`text-xs font-black py-1.5 px-4 rounded-lg transition-all active:scale-95 cursor-pointer ${
                          canAfford 
                            ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-md shadow-yellow-500/10' 
                            : 'bg-slate-800/50 text-slate-500 border border-slate-800/80 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? '잠금 장비 획득' : '코인 부족'}
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
