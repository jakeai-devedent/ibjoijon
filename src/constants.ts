/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, ShopItem, PlayerProfile } from './types';

export const TEAMS: Team[] = [
  {
    id: 'KOR',
    name: '대한민국',
    flag: '🇰🇷',
    power: 88,
    reflex: 85,
    speed: 92,
    color: '#e21a1a', // Red
    secondaryColor: '#0a1d37', // Blue
  },
  {
    id: 'BRA',
    name: '브라질',
    flag: '🇧🇷',
    power: 94,
    reflex: 90,
    speed: 95,
    color: '#ffe110', // Yellow
    secondaryColor: '#009b3a', // Green
  },
  {
    id: 'FRA',
    name: '프랑스',
    flag: '🇫🇷',
    power: 93,
    reflex: 92,
    speed: 94,
    color: '#002395', // Blue
    secondaryColor: '#ed2939', // Red
  },
  {
    id: 'ARG',
    name: '아르헨티나',
    flag: '🇦🇷',
    power: 95,
    reflex: 89,
    speed: 91,
    color: '#75aadb', // Sky blue
    secondaryColor: '#ffffff',
  },
  {
    id: 'ENG',
    name: '잉글랜드',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    power: 90,
    reflex: 88,
    speed: 89,
    color: '#ffffff', // White
    secondaryColor: '#cf081f', // Red
  },
  {
    id: 'JPN',
    name: '일본',
    flag: '🇯🇵',
    power: 82,
    reflex: 87,
    speed: 88,
    color: '#0005b3', // Indigo
    secondaryColor: '#ffffff',
  },
  {
    id: 'GER',
    name: '독일',
    flag: '🇩🇪',
    power: 91,
    reflex: 93,
    speed: 86,
    color: '#2b2b2b', // Dark Gray
    secondaryColor: '#ffcc00', // Yellow
  },
  {
    id: 'ESP',
    name: '스페인',
    flag: '🇪🇸',
    power: 89,
    reflex: 91,
    speed: 90,
    color: '#c60b1e', // Red
    secondaryColor: '#ffc400', // Gold
  },
];

export const INITIAL_SHOP_ITEMS: ShopItem[] = [
  // BALLS
  {
    id: 'ball_classic',
    name: '클래식 피버',
    type: 'ball',
    price: 0,
    unlocked: true,
    value: 'bg-white border-2 border-black border-dashed radial-classic',
    description: '기본에 충실한 32면체 표준 디자인 축구공',
    perk: '기본 제공',
  },
  {
    id: 'ball_fire',
    name: '메테오 파이어',
    type: 'ball',
    price: 300,
    unlocked: false,
    value: 'bg-gradient-to-tr from-amber-600 via-orange-500 to-red-500 animate-pulse border border-yellow-300 shadow-lg shadow-orange-500/50',
    description: '맹렬한 불꽃을 내뿜으며 슛 속도가 상승하는 듯한 느낌을 줍니다',
    perk: '슛 이펙트 활성화',
  },
  {
    id: 'ball_neon',
    name: '네온 볼텍스',
    type: 'ball',
    price: 600,
    unlocked: false,
    value: 'bg-gradient-to-tr from-cyan-400 via-purple-600 to-pink-500 border border-cyan-300 shadow-md shadow-purple-500/50',
    description: '공간 정보를 휘감고 날아가는 미래지향형 사이버풍 축구공',
    perk: '네온 파티클 이펙트',
  },
  {
    id: 'ball_gold',
    name: '골드 챔피언',
    type: 'ball',
    price: 1200,
    unlocked: false,
    value: 'bg-gradient-to-r from-yellow-600 via-yellow-400 to-amber-500 border border-yellow-200 animate-spin-slow shadow-xl shadow-yellow-500/50',
    description: '챔피언들에게만 허락된 황금 광택 광원의 궁극의 전설적인 볼',
    perk: '골드 스파크 발생 & 보상 코인 +20%',
  },

  // GLOVES
  {
    id: 'glove_classic',
    name: '스타터 글러브',
    type: 'glove',
    price: 0,
    unlocked: true,
    value: 'bg-indigo-300 border border-indigo-500',
    description: '안정적인 마찰력을 지닌 신입 골키퍼용 폼 장갑',
    perk: '기본 제공',
  },
  {
    id: 'glove_lightning',
    name: '썬더 볼트',
    type: 'glove',
    price: 400,
    unlocked: false,
    value: 'bg-gradient-to-b from-yellow-300 to-amber-500 border border-yellow-100 shadow-yellow-400/50 shadow-md',
    description: '번개 같은 반사 신경을 돋보이게 하는 일렉트릭 글러브',
    perk: '방어 성공 이펙트',
  },
  {
    id: 'glove_matrix',
    name: '사이버 네트',
    type: 'glove',
    price: 800,
    unlocked: false,
    value: 'bg-gradient-to-tr from-green-400 to-emerald-999 border-2 border-green-200 shadow-green-500/50 shadow-lg',
    description: '공의 궤적을 실시간 디지털 데이터로 예측해 철벽 방어를 돕는 세트 장갑',
    perk: '디지털 쉴드 연출',
  },

  // STADIUMS
  {
    id: 'stadium_classic',
    name: '풀뿌리 운동장',
    type: 'stadium',
    price: 0,
    unlocked: true,
    value: 'from-emerald-700 via-green-600 to-emerald-800',
    description: '잘 관리된 전형적인 전원 마을의 아늑한 인조잔디 경기장',
    perk: '기본 제공',
  },
  {
    id: 'stadium_desert',
    name: '야간 오아시스 돔',
    type: 'stadium',
    price: 500,
    unlocked: false,
    value: 'from-amber-900 via-amber-800 to-amber-950',
    description: '새벽녘 사막 위에 세워진 웅장한 아라비안 나이트풍 모래빛 피치',
    perk: '커스텀 사막 경기장 테마',
  },
  {
    id: 'stadium_cosmic',
    name: '우주 정거장 아레나',
    type: 'stadium',
    price: 1000,
    unlocked: false,
    value: 'from-purple-950 via-slate-900 to-indigo-950',
    description: '지구를 우주에서 바라보며 플레이할 수 있는 웅장한 미래형 축구장',
    perk: '별무리 밤하늘 경기장 테마',
  },
];

export const INITIAL_PROFILE: PlayerProfile = {
  coins: 200, // Starts with some setup coins to afford a small purchase soon
  selectedTeamId: 'KOR',
  selectedBallId: 'ball_classic',
  selectedGloveId: 'glove_classic',
  selectedStadiumId: 'stadium_classic',
  careerGoals: 0,
  careerSaves: 0,
  matchesPlayed: 0,
  matchesWon: 0,
  unlockedItemIds: ['ball_classic', 'glove_classic', 'stadium_classic'],
  trophies: [],
};
