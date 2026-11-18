import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StoreLocatorModal,
  SupportChatDrawer,
  SupportDock,
  type ChatMessage,
} from './components/SupportFeatures';

const SHEET_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261116_132032_30242d8c-5062-4d60-8a3d-238f0a2ff788.png&w=3840&q=95';

const INTRO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261116_131908_b6239896-c077-450c-ad91-575153973fcf.mp4';

const SW = 2688;
const SH = 1520;
const BH = (849 + 8) / (403 + 8);
const WRAPPER_WORDMARK_INK = ['#4a2d16', '#2c2848', '#5c3710', '#194a3c', '#981b44'] as const;

interface NutritionRow {
  label: string;
  perBar: number;
  unit: string;
  dvPerBar?: number;
  kind?: 'major' | 'sub';
}

interface FlavourNutrition {
  calories: number;
  allergens: string;
  rows: NutritionRow[];
}

interface Flavour {
  id: number;
  name: string;
  lines: string;
  wrap: [number, number, number, number];
  color: string;
  bit: number;
  ingredients: string;
  nutrition: FlavourNutrition;
}

const FLAVOURS: Flavour[] = [
  {
    id: 0,
    name: 'Peanut Cocoa',
    lines: 'Peanut\nCocoa',
    wrap: [98, 145, 403, 849],
    color: '#b79474',
    bit: 1,
    ingredients: 'Peanuts, oats, dates, cocoa, pea protein, sea salt.',
    nutrition: {
      calories: 210,
      allergens: 'Contains peanuts. Made in a facility that handles tree nuts.',
      rows: [
        { label: 'Protein', perBar: 12, unit: 'g', dvPerBar: 24, kind: 'major' },
        { label: 'Total fat', perBar: 9, unit: 'g', dvPerBar: 12, kind: 'major' },
        { label: 'Saturated fat', perBar: 1.8, unit: 'g', dvPerBar: 9, kind: 'sub' },
        { label: 'Monounsaturated fat', perBar: 5.2, unit: 'g', kind: 'sub' },
        { label: 'Carbohydrate', perBar: 22, unit: 'g', dvPerBar: 8, kind: 'major' },
        { label: 'Dietary fibre', perBar: 6, unit: 'g', dvPerBar: 21, kind: 'sub' },
        { label: 'Total sugars', perBar: 8, unit: 'g', kind: 'sub' },
        { label: 'Added sugars', perBar: 0, unit: 'g', dvPerBar: 0, kind: 'sub' },
        { label: 'Salt', perBar: 0.2, unit: 'g', dvPerBar: 3, kind: 'major' },
        { label: 'Sodium', perBar: 80, unit: 'mg', dvPerBar: 3, kind: 'sub' },
        { label: 'Potassium', perBar: 240, unit: 'mg', dvPerBar: 5 },
        { label: 'Magnesium', perBar: 54, unit: 'mg', dvPerBar: 13 },
        { label: 'Iron', perBar: 2.1, unit: 'mg', dvPerBar: 12 },
      ],
    },
  },
  {
    id: 1,
    name: 'Berry Oat',
    lines: 'Berry\nOat',
    wrap: [620, 145, 402, 849],
    color: '#ab9ac4',
    bit: 0,
    ingredients: 'Oats, blueberries, raspberries, dates, pea protein, almonds.',
    nutrition: {
      calories: 210,
      allergens: 'Contains almonds (tree nuts).',
      rows: [
        { label: 'Protein', perBar: 12, unit: 'g', dvPerBar: 24, kind: 'major' },
        { label: 'Total fat', perBar: 9, unit: 'g', dvPerBar: 12, kind: 'major' },
        { label: 'Saturated fat', perBar: 1.1, unit: 'g', dvPerBar: 6, kind: 'sub' },
        { label: 'Monounsaturated fat', perBar: 5.8, unit: 'g', kind: 'sub' },
        { label: 'Carbohydrate', perBar: 22, unit: 'g', dvPerBar: 8, kind: 'major' },
        { label: 'Dietary fibre', perBar: 6, unit: 'g', dvPerBar: 21, kind: 'sub' },
        { label: 'Total sugars', perBar: 8, unit: 'g', kind: 'sub' },
        { label: 'Added sugars', perBar: 0, unit: 'g', dvPerBar: 0, kind: 'sub' },
        { label: 'Salt', perBar: 0.2, unit: 'g', dvPerBar: 3, kind: 'major' },
        { label: 'Sodium', perBar: 75, unit: 'mg', dvPerBar: 3, kind: 'sub' },
        { label: 'Potassium', perBar: 215, unit: 'mg', dvPerBar: 5 },
        { label: 'Vitamin C', perBar: 9, unit: 'mg', dvPerBar: 10 },
        { label: 'Iron', perBar: 1.9, unit: 'mg', dvPerBar: 11 },
      ],
    },
  },
  {
    id: 2,
    name: 'Salted Caramel',
    lines: 'Salted\nCaramel',
    wrap: [1137, 145, 402, 849],
    color: '#d1ad6c',
    bit: 2,
    ingredients: 'Dates, cashews, oats, pea protein, sea salt, vanilla.',
    nutrition: {
      calories: 210,
      allergens: 'Contains cashews (tree nuts).',
      rows: [
        { label: 'Protein', perBar: 12, unit: 'g', dvPerBar: 24, kind: 'major' },
        { label: 'Total fat', perBar: 9, unit: 'g', dvPerBar: 12, kind: 'major' },
        { label: 'Saturated fat', perBar: 1.7, unit: 'g', dvPerBar: 9, kind: 'sub' },
        { label: 'Monounsaturated fat', perBar: 5.5, unit: 'g', kind: 'sub' },
        { label: 'Carbohydrate', perBar: 22, unit: 'g', dvPerBar: 8, kind: 'major' },
        { label: 'Dietary fibre', perBar: 6, unit: 'g', dvPerBar: 21, kind: 'sub' },
        { label: 'Total sugars', perBar: 8, unit: 'g', kind: 'sub' },
        { label: 'Added sugars', perBar: 0, unit: 'g', dvPerBar: 0, kind: 'sub' },
        { label: 'Salt', perBar: 0.2, unit: 'g', dvPerBar: 3, kind: 'major' },
        { label: 'Sodium', perBar: 88, unit: 'mg', dvPerBar: 4, kind: 'sub' },
        { label: 'Potassium', perBar: 230, unit: 'mg', dvPerBar: 5 },
        { label: 'Magnesium', perBar: 48, unit: 'mg', dvPerBar: 11 },
        { label: 'Iron', perBar: 1.8, unit: 'mg', dvPerBar: 10 },
      ],
    },
  },
  {
    id: 3,
    name: 'Mint Chip',
    lines: 'Mint\nChip',
    wrap: [1661, 145, 402, 849],
    color: '#94bdb4',
    bit: 3,
    ingredients: 'Oats, dark chocolate, almonds, pea protein, peppermint oil.',
    nutrition: {
      calories: 210,
      allergens: 'Contains almonds (tree nuts).',
      rows: [
        { label: 'Protein', perBar: 12, unit: 'g', dvPerBar: 24, kind: 'major' },
        { label: 'Total fat', perBar: 9, unit: 'g', dvPerBar: 12, kind: 'major' },
        { label: 'Saturated fat', perBar: 2.2, unit: 'g', dvPerBar: 11, kind: 'sub' },
        { label: 'Monounsaturated fat', perBar: 4.9, unit: 'g', kind: 'sub' },
        { label: 'Carbohydrate', perBar: 22, unit: 'g', dvPerBar: 8, kind: 'major' },
        { label: 'Dietary fibre', perBar: 6, unit: 'g', dvPerBar: 21, kind: 'sub' },
        { label: 'Total sugars', perBar: 8, unit: 'g', kind: 'sub' },
        { label: 'Added sugars', perBar: 0, unit: 'g', dvPerBar: 0, kind: 'sub' },
        { label: 'Salt', perBar: 0.2, unit: 'g', dvPerBar: 3, kind: 'major' },
        { label: 'Sodium', perBar: 78, unit: 'mg', dvPerBar: 3, kind: 'sub' },
        { label: 'Potassium', perBar: 225, unit: 'mg', dvPerBar: 5 },
        { label: 'Calcium', perBar: 42, unit: 'mg', dvPerBar: 3 },
        { label: 'Iron', perBar: 2.3, unit: 'mg', dvPerBar: 13 },
      ],
    },
  },
  {
    id: 4,
    name: 'Strawberry',
    lines: 'Strawberry',
    wrap: [2184, 145, 403, 849],
    color: '#d396a7',
    bit: 4,
    ingredients: 'Oats, strawberries, dates, cashews, pea protein, lemon.',
    nutrition: {
      calories: 210,
      allergens: 'Contains cashews (tree nuts).',
      rows: [
        { label: 'Protein', perBar: 12, unit: 'g', dvPerBar: 24, kind: 'major' },
        { label: 'Total fat', perBar: 9, unit: 'g', dvPerBar: 12, kind: 'major' },
        { label: 'Saturated fat', perBar: 1.5, unit: 'g', dvPerBar: 8, kind: 'sub' },
        { label: 'Monounsaturated fat', perBar: 5.4, unit: 'g', kind: 'sub' },
        { label: 'Carbohydrate', perBar: 22, unit: 'g', dvPerBar: 8, kind: 'major' },
        { label: 'Dietary fibre', perBar: 6, unit: 'g', dvPerBar: 21, kind: 'sub' },
        { label: 'Total sugars', perBar: 8, unit: 'g', kind: 'sub' },
        { label: 'Added sugars', perBar: 0, unit: 'g', dvPerBar: 0, kind: 'sub' },
        { label: 'Salt', perBar: 0.2, unit: 'g', dvPerBar: 3, kind: 'major' },
        { label: 'Sodium', perBar: 76, unit: 'mg', dvPerBar: 3, kind: 'sub' },
        { label: 'Potassium', perBar: 210, unit: 'mg', dvPerBar: 4 },
        { label: 'Vitamin C', perBar: 14, unit: 'mg', dvPerBar: 16 },
        { label: 'Iron', perBar: 1.7, unit: 'mg', dvPerBar: 9 },
      ],
    },
  },
];

const BITS: [number, number, number, number][] = [
  [650, 1090, 340, 305], // 0: blueberries and raspberry
  [110, 1125, 280, 255], // 1: chocolate chunks and peanuts
  [1175, 1110, 320, 285], // 2: salted caramel cube
  [1680, 1085, 380, 305], // 3: mint leaves and dark chocolate
  [2280, 1095, 250, 295], // 4: half strawberry
];

interface HeroBitSpec {
  x: number;
  y: number;
  u: number;
  r: number;
  bit: number;
}

const HERO_BITS: HeroBitSpec[] = [
  { x: 0.12, y: 0.2, u: 120, r: -18, bit: 0 },
  { x: 0.86, y: 0.18, u: 96, r: 22, bit: 2 },
  { x: 0.07, y: 0.74, u: 84, r: 12, bit: 3 },
  { x: 0.655, y: 0.15, u: 78, r: -10, bit: 4 },
  { x: 0.205, y: 0.885, u: 70, r: 30, bit: 1 },
];

const ARC_SLOTS: Array<[number, number, number, number, number]> = [
  [0, 0, 430, 0, 0],
  [245, 24, 330, 4, 16],
  [452, 44, 312, 8, 26],
  [660, 80, 296, 12, 34],
  [860, 118, 280, 15, 40],
];

const STEP_ANGLES = [0, 180, 360, 720];

interface StepCopy {
  num: string;
  headLines: string[];
  capLines: [string, string];
}

const INSIDE_STEPS: StepCopy[] = [
  {
    num: '01',
    headLines: ['REAL FOOD,', 'FIRST'],
    capLines: ['Oats, nuts, fruit.', "Nothing you can't say."],
  },
  {
    num: '02',
    headLines: ['PRESSED,', 'NOT BAKED'],
    capLines: ['Real ingredients.', 'Clean energy.'],
  },
  {
    num: '03',
    headLines: ['WRAPPED', 'SAME DAY'],
    capLines: ['Cold-pressed at dawn.', 'Sealed by noon.'],
  },
  {
    num: '04',
    headLines: ['BERRY', 'OAT'],
    capLines: ['12g plant protein.', 'No crash.'],
  },
];

interface StormSeed {
  angle: number;
  ph: number;
  spin: number;
  size: number;
  useFlavBit: boolean;
  altBit: number;
}

function makeStormSeeds(): StormSeed[] {
  let s = 133742;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: 20 }, (_, i) => ({
    angle: rand() * Math.PI * 2,
    ph: i / 20 + rand() * 0.03,
    spin: (rand() < 0.5 ? -1 : 1) * 360,
    size: 0.7 + rand() * 0.7,
    useFlavBit: rand() < 0.7,
    altBit: Math.floor(rand() * 5),
  }));
}

const STORM_SEEDS = makeStormSeeds();

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function solveCubicBezier(p1x: number, p1y: number, p2x: number, p2y: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  let t = x;
  for (let i = 0; i < 6; i++) {
    const xt = ((ax * t + bx) * t + cx) * t - x;
    const dxt = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(xt) < 1e-5 || Math.abs(dxt) < 1e-6) break;
    t = clamp(t - xt / dxt, 0, 1);
  }
  return ((ay * t + by) * t + cy) * t;
}

function sprCrop(box: [number, number, number, number], pad = 0): React.CSSProperties {
  const x = box[0] - pad;
  const y = box[1] - pad;
  const w = box[2] + 2 * pad;
  const h = box[3] + 2 * pad;
  return {
    backgroundSize: `${(SW / w) * 100}% ${(SH / h) * 100}%`,
    backgroundPosition: `${(x / (SW - w)) * 100}% ${(y / (SH - h)) * 100}%`,
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function mixHex(hexA: string, hexB: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(hexA);
  const [br, bg, bb] = hexToRgb(hexB);
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const b = Math.round(lerp(ab, bb, t));
  return `rgb(${r}, ${g}, ${b})`;
}

function hexAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mod5(n: number): number {
  return ((n % 5) + 5) % 5;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface BarState {
  x: number;
  y: number;
  h: number;
  rz: number;
  ry: number;
  rx: number;
  z: number;
  op: number;
  sx: number;
  sy: number;
  shadow: number;
}

function lerpBarState(a: BarState, b: BarState, t: number): BarState {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    h: lerp(a.h, b.h, t),
    rz: lerp(a.rz, b.rz, t),
    ry: lerp(a.ry, b.ry, t),
    rx: lerp(a.rx, b.rx, t),
    z: lerp(a.z, b.z, t),
    op: lerp(a.op, b.op, t),
    sx: lerp(a.sx, b.sx, t),
    sy: lerp(a.sy, b.sy, t),
    shadow: lerp(a.shadow, b.shadow, t),
  };
}

interface CartEntry {
  kind: 'single' | 'pack';
  label: string;
  flavours: number[];
  price: number;
  qty: number;
}

export default function App() {
  const [activeFlavour, setActiveFlavour] = useState<number>(1);
  const [autoplay, setAutoplay] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return true;
  });
  const [insideStep, setInsideStep] = useState<number>(0);
  const [navTheme, setNavTheme] = useState<'flav' | 'light' | 'dark'>('flav');
  const [activeNavIdx, setActiveNavIdx] = useState<number>(0);
  const [shopRevealed, setShopRevealed] = useState<boolean>(false);
  const [rangeRevealed, setRangeRevealed] = useState<boolean>(false);

  // Pack builder state
  const [packSlots, setPackSlots] = useState<(number | null)[]>([null, null, null]);
  const [packGlowColor, setPackGlowColor] = useState<string>('rgba(148, 189, 180, 0.72)');
  const [glowPulseKey, setGlowPulseKey] = useState<number>(0);
  const [packAddedState, setPackAddedState] = useState<boolean>(false);
  const [slotEnterKeys, setSlotEnterKeys] = useState<number[]>([0, 0, 0]);

  // Cart & modals
  const [cartCount, setCartCount] = useState<number>(0);
  const [cartEntries, setCartEntries] = useState<CartEntry[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [dibsOpen, setDibsOpen] = useState<boolean>(false);
  const [dibsEmail, setDibsEmail] = useState<string>('');
  const [dibsSubmitted, setDibsSubmitted] = useState<boolean>(false);
  const [nutritionModalFlav, setNutritionModalFlav] = useState<number | null>(null);
  const [nutritionPer100g, setNutritionPer100g] = useState<boolean>(false);
  const [badgePopKey, setBadgePopKey] = useState<number>(0);
  const [basketBumpKey, setBasketBumpKey] = useState<number>(0);

  // Support features & Maps quota notice
  const [locatorOpen, setLocatorOpen] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState<string>('');
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);
  const [quotaBannerDismissed, setQuotaBannerDismissed] = useState<boolean>(false);

  // Refs for DOM & animation engine
  const introRef = useRef<HTMLDivElement>(null);
  const introVidRef = useRef<HTMLVideoElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const navPillRef = useRef<HTMLDivElement>(null);
  const navHiRef = useRef<HTMLSpanElement>(null);
  const navLinkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const basketRef = useRef<HTMLButtonElement>(null);

  const heroRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const autoBtnRef = useRef<HTMLButtonElement>(null);
  const bitRefs = useRef<(HTMLDivElement | null)[]>([]);

  const insideRef = useRef<HTMLElement>(null);
  const inDarkRef = useRef<HTMLDivElement>(null);
  const inBackFrameRef = useRef<HTMLDivElement>(null);
  const inFrontRef = useRef<HTMLDivElement>(null);
  const inFrontFrameRef = useRef<HTMLDivElement>(null);
  const inBarRef = useRef<HTMLDivElement>(null);
  const inNumRef = useRef<HTMLDivElement>(null);
  const inHeadRef = useRef<HTMLHeadingElement>(null);
  const inCapRef = useRef<HTMLParagraphElement>(null);
  const stormRefs = useRef<(HTMLDivElement | null)[]>([]);

  const shopRef = useRef<HTMLElement>(null);
  const cardsWrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pkRefs = useRef<(HTMLDivElement | null)[]>([]);

  const rangeRef = useRef<HTMLElement>(null);
  const slotBarRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mutable engine state
  const engineRef = useRef({
    entered: false,
    pos: -2.6,
    target: 1,
    activeFlavour: 1,
    autoplay: true,
    heroVisible: true,
    lastInteract: performance.now(),
    reducedMotion: false,
    dragging: false,
    // Slide tween
    slideActive: false,
    slideStart: 0,
    slideDur: 0,
    slideFrom: 1,
    slideTo: 1,
    slideDir: 1,
    slideSwapped: false,
    slideMode: 'glide' as 'glide' | 'enter',
    // Colour reveal
    revActive: false,
    revStart: 0,
    revColor: '#ab9ac4',
    revR: 1500,
    revCx: 720,
    revCy: 400,
    // Section 2 flip
    insideStep: 0,
    flipAngle: 0,
    flipFrom: 0,
    flipTo: 0,
    flipStart: 0,
    flipDur: 720,
    flipActive: false,
    textTimer: 0 as number,
    // Shop tilt & poke
    tiltX: new Array(5).fill(0) as number[],
    tiltY: new Array(5).fill(0) as number[],
    pokeStart: -1,
    pokeFlav: -1,
    phoneShopScrolled: false,
    // Pack builder
    userTouchedPack: false,
    autoFilledPack: false,
    // Smooth scroll
    smoothActive: false,
    smoothTargetY: 0,
    smoothCurrentY: 0,
    // Title measure cache
    measureCtx: null as CanvasRenderingContext2D | null,
    // Pointer raycast targets
    visibleHeroBars: [] as Array<{ j: number; mesh: unknown }>,
  });

  // Sync autoplay ref
  useEffect(() => {
    engineRef.current.autoplay = autoplay;
  }, [autoplay]);

  // Listen for Google Maps Platform Demo Key quota exceeded events
  useEffect(() => {
    const onQuotaExceeded = () => {
      setQuotaExceeded(true);
      setQuotaBannerDismissed(false);
    };
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  // Helper: measure text width at 100px Archivo Black
  const measureArchivoWidth = useCallback((text: string): number => {
    const eng = engineRef.current;
    if (!eng.measureCtx) {
      const c = document.createElement('canvas');
      eng.measureCtx = c.getContext('2d');
    }
    const ctx = eng.measureCtx;
    if (!ctx) return text.length * 60;
    ctx.font = '400 100px "Archivo Black", sans-serif';
    return Math.max(1, ctx.measureText(text.toUpperCase()).width);
  }, []);

  const computeTitleFontSize = useCallback(
    (name: string): string => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw < 820) {
        const words = name.toUpperCase().split(/\s+/);
        let maxW = 1;
        for (const w of words) {
          maxW = Math.max(maxW, measureArchivoWidth(w));
        }
        const base = clamp(vw * 0.125, 40, 64);
        const px = Math.min(base, ((vw - 36) * 100) / maxW);
        return `${px.toFixed(2)}px`;
      }
      const u = Math.min(vw / 1440, vh / 900);
      const w = measureArchivoWidth(name.toUpperCase());
      const px = Math.min(96 * u, (760 * u * 100) / w);
      return `${px.toFixed(2)}px`;
    },
    [measureArchivoWidth],
  );

  // Render hero title words & letters into DOM
  const setTitleHTML = useCallback(
    (el: HTMLElement, name: string) => {
      el.innerHTML = '';
      const layer = document.createElement('span');
      layer.className = 'title-layer';
      const words = name.toUpperCase().split(' ');
      words.forEach((word, wi) => {
        if (wi > 0) {
          layer.appendChild(document.createTextNode(' '));
        }
        const wSpan = document.createElement('span');
        wSpan.className = 'word';
        for (const ch of word) {
          const cSpan = document.createElement('span');
          cSpan.className = 'ch';
          cSpan.textContent = ch;
          wSpan.appendChild(cSpan);
        }
        layer.appendChild(wSpan);
      });
      el.appendChild(layer);
    },
    [],
  );

  // Title letter-rise swap
  const swapHeroTitle = useCallback(
    (flavIdx: number, dir: number, instant: boolean) => {
      const titleEl = titleRef.current;
      if (!titleEl) return;
      const flav = FLAVOURS[flavIdx];
      titleEl.style.fontSize = computeTitleFontSize(flav.name);

      if (instant) {
        setTitleHTML(titleEl, flav.name);
        return;
      }

      const oldLayer = titleEl.querySelector('.title-layer') as HTMLElement | null;
      let outgoing: HTMLElement | null = null;
      if (oldLayer) {
        outgoing = oldLayer.cloneNode(true) as HTMLElement;
        outgoing.className = 'title-outgoing';
      }

      setTitleHTML(titleEl, flav.name);
      const newLayer = titleEl.querySelector('.title-layer') as HTMLElement | null;

      if (outgoing) {
        titleEl.appendChild(outgoing);
        const outChars = Array.from(outgoing.querySelectorAll('.ch')) as HTMLElement[];
        const outY = dir >= 0 ? '-110%' : '110%';
        let doneCount = 0;
        if (outChars.length === 0) {
          outgoing.remove();
        } else {
          outChars.forEach((ch, i) => {
            const anim = ch.animate(
              [
                { transform: 'translateY(0%)', opacity: 1 },
                { transform: `translateY(${outY})`, opacity: 0 },
              ],
              {
                duration: 300,
                delay: i * 11,
                easing: 'cubic-bezier(0.45, 0, 0.75, 0.3)',
                fill: 'forwards',
              },
            );
            anim.onfinish = () => {
              doneCount++;
              if (doneCount >= outChars.length && outgoing?.parentNode) {
                outgoing.remove();
              }
            };
          });
        }
      }

      if (newLayer) {
        const inChars = Array.from(newLayer.querySelectorAll('.ch')) as HTMLElement[];
        const inStartY = dir >= 0 ? '110%' : '-110%';
        inChars.forEach((ch, i) => {
          ch.animate(
            [
              { transform: `translateY(${inStartY})`, opacity: 0 },
              { transform: 'translateY(0%)', opacity: 1 },
            ],
            {
              duration: 620,
              delay: 120 + i * 22,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              fill: 'both',
            },
          );
        });
      }
    },
    [computeTitleFontSize, setTitleHTML],
  );

  // Counter soft crossfade
  const swapHeroCounter = useCallback((flavIdx: number, instant: boolean) => {
    const countEl = countRef.current;
    if (!countEl) return;
    const text = `0${flavIdx + 1}`;
    if (instant) {
      countEl.textContent = text;
      return;
    }
    countEl.animate(
      [
        { translate: '0 0px', opacity: 1 },
        { translate: '0 -10px', opacity: 0 },
      ],
      {
        duration: 220,
        easing: 'cubic-bezier(0.5, 0, 0.75, 0)',
        fill: 'forwards',
      },
    );
    window.setTimeout(() => {
      if (!countRef.current) return;
      countRef.current.textContent = text;
      countRef.current.animate(
        [
          { translate: '0 14px', opacity: 0 },
          { translate: '0 0px', opacity: 1 },
        ],
        {
          duration: 380,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        },
      );
    }, 60);
  }, []);

  // Section 2 text crossfade helper
  const crossfadeInsideText = useCallback(
    (stepIdx: number, flavIdx: number, instant: boolean) => {
      const headEl = inHeadRef.current;
      const numEl = inNumRef.current;
      const capEl = inCapRef.current;
      if (!headEl || !numEl || !capEl) return;

      const renderContent = () => {
        const stepData = INSIDE_STEPS[stepIdx];
        numEl.textContent = stepData.num;
        capEl.innerHTML = `${stepData.capLines[0]}<br />${stepData.capLines[1]}`;

        if (stepIdx === 3) {
          const words = FLAVOURS[flavIdx].name.toUpperCase().split(' ');
          headEl.innerHTML = words
            .map((w) => (w.length > 9 ? `<span class="sm">${w}</span>` : w))
            .join('<br />');
        } else {
          headEl.innerHTML = stepData.headLines.join('<br />');
        }
      };

      if (instant) {
        renderContent();
        return;
      }

      const targets = [headEl, numEl, capEl];
      targets.forEach((el) => {
        el.animate(
          [
            { transform: 'translateY(0px)', opacity: 1 },
            { transform: 'translateY(-10px)', opacity: 0 },
          ],
          {
            duration: 240,
            easing: 'cubic-bezier(0.5, 0, 0.75, 0)',
            fill: 'forwards',
          },
        );
      });

      window.setTimeout(() => {
        renderContent();
        targets.forEach((el) => {
          el.animate(
            [
              { transform: 'translateY(14px)', opacity: 0 },
              { transform: 'translateY(0px)', opacity: 1 },
            ],
            {
              duration: 460,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              fill: 'forwards',
            },
          );
        });
      }, 40);
    },
    [],
  );

  // Trigger feathered colour circle reveal
  const startColourReveal = useCallback((newColor: string, instant: boolean) => {
    const eng = engineRef.current;
    const revEl = revealRef.current;
    const heroEl = heroRef.current;

    if (instant || !revEl || !heroEl) {
      document.documentElement.style.setProperty('--flav', newColor);
      if (revEl) {
        revEl.style.removeProperty('--rv');
        revEl.classList.remove('active');
        revEl.style.maskImage = '';
        revEl.style.webkitMaskImage = '';
      }
      eng.revActive = false;
      return;
    }

    // Finish any running reveal at once
    if (eng.revActive) {
      document.documentElement.style.setProperty('--flav', eng.revColor);
      revEl.style.removeProperty('--rv');
      revEl.classList.remove('active');
      revEl.style.maskImage = '';
      revEl.style.webkitMaskImage = '';
      eng.revActive = false;
    }

    const vw = window.innerWidth;
    const heroH = heroEl.clientHeight || window.innerHeight;
    const u = vw < 820 ? Math.min(vw / 560, heroH / 980) : Math.min(vw / 1440, window.innerHeight / 900);
    const cx = vw / 2;
    const cy = vw < 820 ? heroH * 0.4 : heroH / 2 - 78 * u;
    const maxDist = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(vw - cx, cy),
      Math.hypot(cx, heroH - cy),
      Math.hypot(vw - cx, heroH - cy),
    );

    eng.revActive = true;
    eng.revStart = performance.now();
    eng.revColor = newColor;
    eng.revR = 1.45 * maxDist;
    eng.revCx = cx;
    eng.revCy = cy;

    revEl.style.setProperty('--rv', newColor);
    revEl.classList.add('active');
  }, []);

  // Apply flavour visual swap (colour, title, counter, section 2 step 04, live card)
  const applyFlavourSwap = useCallback(
    (newFlav: number, dir: number, instant: boolean) => {
      const eng = engineRef.current;
      eng.activeFlavour = newFlav;
      setActiveFlavour(newFlav);

      startColourReveal(FLAVOURS[newFlav].color, instant);
      swapHeroTitle(newFlav, dir, instant);
      swapHeroCounter(newFlav, instant);

      if (eng.insideStep === 3) {
        crossfadeInsideText(3, newFlav, instant);
      }
    },
    [crossfadeInsideText, startColourReveal, swapHeroCounter, swapHeroTitle],
  );

  // Go to target bar index
  const goTo = useCallback(
    (newTarget: number, customDur?: number) => {
      const eng = engineRef.current;
      eng.lastInteract = performance.now();
      const prevTarget = eng.target;
      const slotsMoved = Math.abs(newTarget - eng.pos);
      const dir = newTarget >= prevTarget ? 1 : -1;
      eng.target = newTarget;

      const newFlav = mod5(Math.round(newTarget));
      const flavChanged = newFlav !== eng.activeFlavour;

      if (eng.reducedMotion) {
        eng.pos = newTarget;
        eng.slideActive = false;
        if (flavChanged) {
          applyFlavourSwap(newFlav, dir, true);
        }
        return;
      }

      const dur = customDur ?? 650 + Math.max(0, Math.round(slotsMoved) - 1) * 160;
      eng.slideActive = true;
      eng.slideStart = performance.now();
      eng.slideDur = Math.max(280, dur);
      eng.slideFrom = eng.pos;
      eng.slideTo = newTarget;
      eng.slideDir = dir;
      eng.slideSwapped = !flavChanged;
      eng.slideMode = 'glide';
    },
    [applyFlavourSwap],
  );

  // Move nav highlight pill under active link
  const positionNavHighlight = useCallback((idx: number) => {
    const hi = navHiRef.current;
    const pill = navPillRef.current;
    const link = navLinkRefs.current[idx];
    if (!hi || !pill || !link) return;
    hi.style.left = `${link.offsetLeft}px`;
    hi.style.width = `${link.offsetWidth}px`;
  }, []);

  useEffect(() => {
    positionNavHighlight(activeNavIdx);
  }, [activeNavIdx, positionNavHighlight]);

  // Smooth scroll helper
  const scrollToY = useCallback((y: number) => {
    const eng = engineRef.current;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const clamped = clamp(y, 0, maxScroll);
    if (eng.reducedMotion || window.innerWidth < 820) {
      window.scrollTo({ top: clamped, behavior: eng.reducedMotion ? 'auto' : 'smooth' });
      return;
    }
    eng.smoothCurrentY = window.scrollY;
    eng.smoothTargetY = clamped;
    eng.smoothActive = true;
  }, []);

  // Fly-to-cart animation
  const flyToCart = useCallback(
    (sources: Array<{ rect: DOMRect; flavourIdx: number }>, onAllLanded: () => void) => {
      const eng = engineRef.current;
      const basketEl = basketRef.current;
      if (eng.reducedMotion || !basketEl || sources.length === 0) {
        onAllLanded();
        return;
      }

      const bRect = basketEl.getBoundingClientRect();
      const targetCx = bRect.left + bRect.width / 2;
      const targetCy = bRect.top + bRect.height / 2;
      let remaining = sources.length;

      sources.forEach((src, i) => {
        const { rect, flavourIdx } = src;
        if (rect.width <= 0 || rect.height <= 0) {
          remaining--;
          if (remaining === 0) onAllLanded();
          return;
        }
        const flav = FLAVOURS[flavourIdx];
        const crop = sprCrop(flav.wrap, 4);
        const clone = document.createElement('div');
        clone.className = 'spr';
        clone.style.position = 'fixed';
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.backgroundSize = String(crop.backgroundSize);
        clone.style.backgroundPosition = String(crop.backgroundPosition);
        clone.style.zIndex = '70';
        clone.style.pointerEvents = 'none';
        clone.style.filter = 'drop-shadow(0 10px 14px rgba(0, 0, 0, 0.25))';
        document.body.appendChild(clone);

        const srcCx = rect.left + rect.width / 2;
        const srcCy = rect.top + rect.height / 2;
        const dx = targetCx - srcCx;
        const dy = targetCy - srcCy;
        const lift = Math.min(160, 0.35 * Math.abs(dy) + 60);
        const k = Math.min(0.2, 30 / rect.height);

        const anim = clone.animate(
          [
            {
              transform: 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)',
              opacity: 1,
              offset: 0,
            },
            {
              transform: `translate3d(${0.4 * dx}px, ${0.4 * dy - lift}px, 0px) scale(${0.45 + k}) rotate(-10deg)`,
              opacity: 1,
              offset: 0.45,
            },
            {
              transform: `translate3d(${dx}px, ${dy}px, 0px) scale(${k}) rotate(-18deg)`,
              opacity: 0.15,
              offset: 1,
            },
          ],
          {
            duration: 900,
            delay: i * 120,
            easing: 'cubic-bezier(0.5, 0, 0.2, 1)',
            fill: 'forwards',
          },
        );

        anim.onfinish = () => {
          clone.remove();
          setBasketBumpKey((n) => n + 1);
          remaining--;
          if (remaining === 0) {
            onAllLanded();
          }
        };
      });
    },
    [],
  );

  // Add item to cart state
  const commitToCart = useCallback((entry: Omit<CartEntry, 'qty'>) => {
    setCartCount((c) => c + 1);
    setBadgePopKey((n) => n + 1);
    setCartEntries((prev) => {
      const key = `${entry.kind}:${entry.flavours.join(',')}`;
      const existing = prev.find((p) => `${p.kind}:${p.flavours.join(',')}` === key);
      if (existing) {
        return prev.map((p) =>
          `${p.kind}:${p.flavours.join(',')}` === key ? { ...p, qty: p.qty + 1 } : p,
        );
      }
      return [...prev, { ...entry, qty: 1 }];
    });
  }, []);

  // Card "+" click
  const handleAddCard = useCallback(
    (flavIdx: number) => {
      const pkEl = pkRefs.current[flavIdx];
      const flav = FLAVOURS[flavIdx];
      const rect = pkEl ? pkEl.getBoundingClientRect() : new DOMRect(0, 0, 0, 0);
      flyToCart([{ rect, flavourIdx: flavIdx }], () => {
        commitToCart({
          kind: 'single',
          label: `${flav.name} Bar`,
          flavours: [flavIdx],
          price: 2.99,
        });
      });
    },
    [commitToCart, flyToCart],
  );

  // Card bar click (poke squash)
  const handlePokeCard = useCallback((flavIdx: number) => {
    const eng = engineRef.current;
    if (eng.reducedMotion) return;
    if (flavIdx === eng.activeFlavour) {
      eng.pokeStart = performance.now();
      eng.pokeFlav = flavIdx;
      return;
    }
    const pkEl = pkRefs.current[flavIdx];
    if (!pkEl) return;
    pkEl.animate(
      [
        { transform: 'translateX(-50%) translateZ(30px) scale(1, 1)', offset: 0 },
        { transform: 'translateX(-50%) translateZ(30px) scale(1.06, 0.93)', offset: 0.3 },
        { transform: 'translateX(-50%) translateZ(30px) scale(0.97, 1.04)', offset: 0.6 },
        { transform: 'translateX(-50%) translateZ(30px) scale(1, 1)', offset: 1 },
      ],
      { duration: 500, easing: 'ease-out' },
    );
  }, []);

  // Pack builder actions
  const handleThumbClick = useCallback((flavIdx: number) => {
    engineRef.current.userTouchedPack = true;
    setPackSlots((prev) => {
      const emptyIdx = prev.findIndex((v) => v === null);
      if (emptyIdx === -1) return prev;
      const next = [...prev];
      next[emptyIdx] = flavIdx;
      setSlotEnterKeys((sk) => sk.map((k, idx) => (idx === emptyIdx ? k + 1 : k)));
      setPackGlowColor(hexAlpha(FLAVOURS[flavIdx].color, 0.72));
      setGlowPulseKey((k) => k + 1);
      return next;
    });
  }, []);

  const handleRemoveSlot = useCallback((slotIdx: number) => {
    engineRef.current.userTouchedPack = true;
    setPackSlots((prev) => {
      if (prev[slotIdx] === null) return prev;
      const next = [...prev];
      next[slotIdx] = null;
      const lastFilled = [...next].reverse().find((v): v is number => v !== null);
      if (lastFilled !== undefined) {
        setPackGlowColor(hexAlpha(FLAVOURS[lastFilled].color, 0.72));
      }
      setGlowPulseKey((k) => k + 1);
      return next;
    });
  }, []);

  const handleBuyPack = useCallback(() => {
    if (packSlots.some((v) => v === null) || packAddedState) return;
    const filled = packSlots as number[];
    const sources = filled
      .map((flavIdx, i) => {
        const el = slotBarRefs.current[i];
        return el ? { rect: el.getBoundingClientRect(), flavourIdx: flavIdx } : null;
      })
      .filter((x): x is { rect: DOMRect; flavourIdx: number } => x !== null);

    flyToCart(sources, () => {
      commitToCart({
        kind: 'pack',
        label: `3-Pack (${filled.map((i) => FLAVOURS[i].name).join(', ')})`,
        flavours: [...filled],
        price: 7.48,
      });
    });

    window.setTimeout(() => {
      setPackSlots([null, null, null]);
      setPackAddedState(true);
      window.setTimeout(() => {
        setPackAddedState(false);
      }, 1600);
    }, 60);
  }, [commitToCart, flyToCart, packAddedState, packSlots]);

  // Main lifecycle: Intro, Three.js WebGL, RAF loop, Scroll, Pointer, Keyboard
  useEffect(() => {
    const eng = engineRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    eng.reducedMotion = reduced;
    if (reduced) {
      setAutoplay(false);
      eng.autoplay = false;
    }

    // Initialize hero title, counter, and section 2 step 01
    if (titleRef.current) {
      titleRef.current.style.fontSize = computeTitleFontSize(FLAVOURS[1].name);
      setTitleHTML(titleRef.current, FLAVOURS[1].name);
    }
    if (countRef.current) {
      countRef.current.textContent = '02';
    }
    crossfadeInsideText(0, 1, true);

    document.fonts.ready.then(() => {
      if (titleRef.current) {
        titleRef.current.style.fontSize = computeTitleFontSize(FLAVOURS[eng.activeFlavour].name);
      }
      positionNavHighlight(activeNavIdx);
    });

    // Intro & hero entrance
    const introTimers: number[] = [];
    const enterHero = () => {
      if (eng.entered) return;
      eng.entered = true;
      eng.lastInteract = performance.now();
      document.body.classList.remove('locked');

      const introEl = introRef.current;
      if (introEl) {
        introEl.classList.add('done');
        introTimers.push(
          window.setTimeout(() => {
            introEl.classList.add('gone');
          }, 480),
        );
      }

      navRef.current?.classList.add('entered');
      ringsRef.current?.classList.add('entered');
      playBtnRef.current?.classList.add('entered');
      countRef.current?.classList.add('entered');
      autoBtnRef.current?.classList.add('entered');

      // Entrance slide: pos -2.6 -> 1 over 1700ms
      if (reduced) {
        eng.pos = 1;
        eng.target = 1;
        eng.slideActive = false;
      } else {
        eng.pos = -2.6;
        eng.target = 1;
        eng.slideActive = true;
        eng.slideStart = performance.now();
        eng.slideDur = 1700;
        eng.slideFrom = -2.6;
        eng.slideTo = 1;
        eng.slideDir = 1;
        eng.slideSwapped = true;
        eng.slideMode = 'enter';
      }

      // Hero bits fade-in and infinite drift
      bitRefs.current.forEach((bitEl, i) => {
        if (!bitEl) return;
        const spec = HERO_BITS[i];
        if (reduced) {
          bitEl.style.opacity = '0.55';
          return;
        }
        const fade = bitEl.animate([{ opacity: 0 }, { opacity: 0.6 }], {
          duration: 900,
          delay: 300 + 90 * i,
          easing: 'ease-out',
          fill: 'forwards',
        });
        fade.onfinish = () => {
          bitEl.style.opacity = '0.6';
          const dx = (i % 2 === 0 ? 1 : -1) * (12 + (i % 3));
          const dy = -(22 + 3 * i);
          const drot = (i % 2 === 0 ? 1 : -1) * (10 + (i % 3));
          bitEl.animate(
            [
              { transform: `translate(-50%, -50%) rotate(${spec.r}deg)` },
              {
                transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${spec.r + drot}deg)`,
              },
              { transform: `translate(-50%, -50%) rotate(${spec.r}deg)` },
            ],
            {
              duration: 7000 + 900 * i,
              iterations: Infinity,
              easing: 'ease-in-out',
            },
          );
        };
      });

      window.setTimeout(() => positionNavHighlight(0), 60);
    };

    const showLogoStamp = () => {
      if (eng.entered) return;
      const vid = introVidRef.current;
      const introEl = introRef.current;
      if (vid) vid.pause();
      if (introEl && !introEl.classList.contains('cream')) {
        introEl.classList.add('cream');
        introTimers.push(window.setTimeout(enterHero, 380 + 650));
      }
    };

    if (reduced) {
      enterHero();
    } else {
      const vid = introVidRef.current;
      let started = false;
      const startVid = () => {
        if (started || !vid || eng.entered) return;
        started = true;
        try {
          vid.currentTime = 0.55;
        } catch {
          // Ignore seek errors before metadata settles
        }
        vid.play().catch(() => {
          showLogoStamp();
        });
      };

      if (vid) {
        if (vid.readyState >= 3) {
          startVid();
        } else {
          vid.addEventListener('canplay', startVid, { once: true });
        }
        vid.addEventListener('timeupdate', () => {
          if (vid.currentTime >= 4.6) {
            showLogoStamp();
          }
        });
        vid.addEventListener('ended', showLogoStamp, { once: true });
        vid.addEventListener('error', showLogoStamp, { once: true });
      }

      introTimers.push(
        window.setTimeout(() => {
          if (!started || (vid && vid.paused)) {
            showLogoStamp();
          }
        }, 3500),
      );

      introTimers.push(window.setTimeout(enterHero, 9000));
    }

    // Store enterHero on window-less ref callback for skip button
    const skipBtn = document.getElementById('skipIntro');
    const onSkipClick = () => enterHero();
    skipBtn?.addEventListener('click', onSkipClick);

    // Hero visibility & Section observers
    const heroObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          eng.heroVisible = e.intersectionRatio >= 0.6;
        }
      },
      { threshold: [0, 0.5, 0.6, 1] },
    );
    if (heroRef.current) heroObs.observe(heroRef.current);

    const shopObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.18) {
            setShopRevealed(true);
            shopObs.disconnect();
          }
        }
      },
      { threshold: [0.18] },
    );
    if (shopRef.current) shopObs.observe(shopRef.current);

    const rangeObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.3) {
            setRangeRevealed(true);
            if (!eng.userTouchedPack && !eng.autoFilledPack) {
              eng.autoFilledPack = true;
              const base = eng.activeFlavour;
              [250, 410, 570].forEach((delay, slotIdx) => {
                window.setTimeout(() => {
                  if (eng.userTouchedPack) return;
                  const fIdx = (base + slotIdx) % 5;
                  setPackSlots((prev) => {
                    if (prev[slotIdx] !== null) return prev;
                    const next = [...prev];
                    next[slotIdx] = fIdx;
                    return next;
                  });
                  setSlotEnterKeys((sk) => sk.map((k, idx) => (idx === slotIdx ? k + 1 : k)));
                  setPackGlowColor(hexAlpha(FLAVOURS[fIdx].color, 0.72));
                  setGlowPulseKey((k) => k + 1);
                }, delay);
              });
            }
            rangeObs.disconnect();
          }
        }
      },
      { threshold: [0.3] },
    );
    if (rangeRef.current) rangeObs.observe(rangeRef.current);

    // Autoplay interval
    const autoTimer = window.setInterval(() => {
      if (!eng.entered || !eng.autoplay || eng.dragging || eng.reducedMotion) return;
      if (!eng.heroVisible || document.visibilityState !== 'visible') return;
      if (performance.now() - eng.lastInteract < 3200) return;
      goTo(eng.target + 1);
    }, 250);

    // Smooth wheel scrolling (desktop fine pointer only)
    const isTouchDevice = 'ontouchstart' in window && navigator.maxTouchPoints > 0;
    const onWheel = (e: WheelEvent) => {
      if (
        e.ctrlKey ||
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ||
        isTouchDevice ||
        eng.reducedMotion ||
        document.body.classList.contains('locked') ||
        (e.target instanceof Element &&
          e.target.closest('.nutri-modal, .modal-card, .nav-popover, .locator-modal, .support-drawer'))
      ) {
        return;
      }
      e.preventDefault();
      const mult = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const dy = e.deltaY * mult;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (!eng.smoothActive) {
        eng.smoothCurrentY = window.scrollY;
        eng.smoothTargetY = window.scrollY;
      }
      eng.smoothTargetY = clamp(eng.smoothTargetY + dy, 0, maxScroll);
      eng.smoothActive = true;
    };

    const stopSmoothOnInput = () => {
      eng.smoothActive = false;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointerdown', stopSmoothOnInput, { passive: true });

    // Keyboard navigation
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNutritionModalFlav(null);
        setDibsOpen(false);
        setCartOpen(false);
        setLocatorOpen(false);
        setChatOpen(false);
        return;
      }
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const heroEl = heroRef.current;
        if (!heroEl) return;
        const rect = heroEl.getBoundingClientRect();
        const visibleRatio =
          Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)) /
          Math.max(1, rect.height);
        if (visibleRatio >= 0.5 && eng.entered) {
          goTo(eng.target + (e.key === 'ArrowRight' ? 1 : -1));
        }
      } else if (
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === ' '
      ) {
        eng.smoothActive = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // ======================== THREE.JS SETUP ========================
    let disposed = false;
    let rafId = 0;
    let cleanupThree: (() => void) | null = null;

    (async () => {
      const threeSpec: string = 'three';
      const roomEnvSpec: string = 'three/addons/environments/RoomEnvironment.js';
      const THREE = (await import(/* @vite-ignore */ threeSpec)) as typeof import('three');
      const { RoomEnvironment } = (await import(
        /* @vite-ignore */ roomEnvSpec
      )) as typeof import('three/addons/environments/RoomEnvironment.js');
      if (disposed) return;

      const canvas = document.getElementById('gl') as HTMLCanvasElement | null;
      if (!canvas) return;

      // Detect software WebGL
      const isSoftwareGl = (() => {
        try {
          const probe = document.createElement('canvas').getContext('webgl2');
          if (!probe) return true;
          const ext = probe.getExtension('WEBGL_debug_renderer_info');
          const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
          const gpu = String(probe.getParameter(param));
          probe.getExtension('WEBGL_lose_context')?.loseContext();
          return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        } catch {
          return false;
        }
      })();

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;

      document.body.classList.add('gl');

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      pmrem.dispose();

      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
      keyLight.position.set(-0.6, 0.9, 1.4);
      scene.add(keyLight);

      const camera = new THREE.PerspectiveCamera(40, 1, 10, 10000);

      // Shared pillow geometry (front + back) — 4K smooth tessellation
      const buildPillowGeos = () => {
        const frontGeo = new THREE.PlaneGeometry(1, BH, 48, 96);
        const backGeo = new THREE.PlaneGeometry(1, BH, 48, 96);
        const CR = 0.062;

        const displace = (geo: InstanceType<typeof THREE.PlaneGeometry>, sign: 1 | -1) => {
          const pos = geo.attributes.position;
          const uv = geo.attributes.uv;
          for (let i = 0; i < pos.count; i++) {
            const u = uv.getX(i);
            const v = uv.getY(i);
            const ex = Math.abs(2 * u - 1);
            const ev = Math.min(v, 1 - v);
            let z: number;
            if (ev < CR) {
              z = 0.006 + 0.006 * Math.abs(Math.sin(u * Math.PI * 34));
            } else {
              const across = Math.pow(Math.max(0, 1 - Math.pow(ex, 2.6)), 0.62);
              const along = Math.pow(clamp((ev - CR) / 0.11, 0, 1), 0.7);
              z =
                0.012 +
                0.118 * across * along +
                0.004 * Math.sin(23 * u + 31 * v) * across;
            }
            pos.setZ(i, sign * z);
            if (sign === -1) {
              uv.setX(i, 1 - u);
            }
          }
          if (sign === -1 && geo.index) {
            const idx = geo.index;
            for (let i = 0; i < idx.count; i += 3) {
              const b = idx.getX(i + 1);
              const c = idx.getX(i + 2);
              idx.setX(i + 1, c);
              idx.setX(i + 2, b);
            }
            idx.needsUpdate = true;
          }
          uv.needsUpdate = true;
          pos.needsUpdate = true;
          geo.computeVertexNormals();
        };

        displace(frontGeo, 1);
        displace(backGeo, -1);
        return { frontGeo, backGeo };
      };

      const { frontGeo, backGeo } = buildPillowGeos();
      const shadowGeo = new THREE.PlaneGeometry(1.25, 1.04 * BH);

      // Shadow radial gradient texture (hi-res 256x512)
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 512;
      const sctx = shadowCanvas.getContext('2d')!;
      sctx.save();
      sctx.translate(128, 256);
      sctx.scale(1, 2);
      const grad = sctx.createRadialGradient(0, 0, 12, 0, 0, 116);
      grad.addColorStop(0, 'rgba(30, 18, 40, 0.55)');
      grad.addColorStop(0.55, 'rgba(30, 18, 40, 0.22)');
      grad.addColorStop(1, 'rgba(30, 18, 40, 0)');
      sctx.fillStyle = grad;
      sctx.beginPath();
      sctx.arc(0, 0, 116, 0, Math.PI * 2);
      sctx.fill();
      sctx.restore();
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      shadowTex.colorSpace = THREE.SRGBColorSpace;

      // Per-flavour front & back textures
      const frontTextures: Array<InstanceType<typeof THREE.CanvasTexture> | null> = new Array(5).fill(
        null,
      );
      const backTextures: Array<InstanceType<typeof THREE.CanvasTexture> | null> = new Array(5).fill(
        null,
      );
      let patchedSheetBlobUrl: string | null = null;

      interface BarUnit {
        group: InstanceType<typeof THREE.Group>;
        frontMesh: InstanceType<typeof THREE.Mesh>;
        backMesh: InstanceType<typeof THREE.Mesh>;
        frontMat: InstanceType<typeof THREE.MeshPhysicalMaterial>;
        backMat: InstanceType<typeof THREE.MeshPhysicalMaterial>;
        shadowMesh: InstanceType<typeof THREE.Mesh>;
        shadowMat: InstanceType<typeof THREE.MeshBasicMaterial>;
        flavourIdx: number;
      }

      const makeBarUnit = (): BarUnit => {
        const group = new THREE.Group();
        const frontMat = new THREE.MeshPhysicalMaterial({
          transparent: true,
          alphaTest: 0.5,
          roughness: 0.4,
          metalness: 0,
          clearcoat: 0.56,
          clearcoatRoughness: 0.26,
          envMapIntensity: 0.48,
        });
        const backMat = new THREE.MeshPhysicalMaterial({
          transparent: true,
          alphaTest: 0.5,
          roughness: 0.4,
          metalness: 0,
          clearcoat: 0.56,
          clearcoatRoughness: 0.26,
          envMapIntensity: 0.48,
        });
        const frontMesh = new THREE.Mesh(frontGeo, frontMat);
        const backMesh = new THREE.Mesh(backGeo, backMat);
        group.add(frontMesh, backMesh);
        group.visible = false;
        scene.add(group);

        const shadowMat = new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          depthWrite: false,
          opacity: 0,
        });
        const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
        shadowMesh.renderOrder = -1;
        shadowMesh.visible = false;
        scene.add(shadowMesh);

        return {
          group,
          frontMesh,
          backMesh,
          frontMat,
          backMat,
          shadowMesh,
          shadowMat,
          flavourIdx: -1,
        };
      };

      const poolBars: BarUnit[] = Array.from({ length: 11 }, () => makeBarUnit());
      const travellerBar: BarUnit = makeBarUnit();

      const setBarFlavour = (unit: BarUnit, fIdx: number) => {
        if (unit.flavourIdx === fIdx && unit.frontMat.map && unit.backMat.map) return;
        unit.flavourIdx = fIdx;
        const ft = frontTextures[fIdx];
        const bt = backTextures[fIdx];
        if (ft && unit.frontMat.map !== ft) {
          unit.frontMat.map = ft;
          unit.frontMat.needsUpdate = true;
        }
        if (bt && unit.backMat.map !== bt) {
          unit.backMat.map = bt;
          unit.backMat.needsUpdate = true;
        }
      };

      // Build textures once sheet image and all 4 fonts are ready
      const sheetImg = new Image();
      sheetImg.crossOrigin = 'anonymous';
      const imgLoaded = new Promise<void>((resolve) => {
        sheetImg.onload = () => resolve();
        sheetImg.onerror = () => resolve();
      });
      sheetImg.src = SHEET_URL;

      const fontsLoaded = Promise.all([
        document.fonts.load('400 32px "Archivo Black"'),
        document.fonts.load('400 16px "DM Mono"'),
        document.fonts.load('500 16px "DM Mono"'),
        document.fonts.load('700 16px "Inter"'),
      ]).catch(() => []);

      Promise.all([imgLoaded, fontsLoaded]).then(() => {
        if (disposed || sheetImg.naturalWidth === 0) return;
        const scale = sheetImg.naturalWidth / SW;
        const maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy() || 8);

        // Build a patched 4K sheet replacing STRIDE -> JACKIE SWEET on every wrapper
        const patchedSheet = document.createElement('canvas');
        patchedSheet.width = sheetImg.naturalWidth;
        patchedSheet.height = sheetImg.naturalHeight;
        const psCtx = patchedSheet.getContext('2d')!;
        psCtx.imageSmoothingEnabled = true;
        psCtx.imageSmoothingQuality = 'high';
        psCtx.drawImage(sheetImg, 0, 0);

        FLAVOURS.forEach((flav, idx) => {
          const [bx, by, bw, bh] = flav.wrap;
          const wx = bx * scale;
          const wy = by * scale;
          const ww = bw * scale;
          const wh = bh * scale;

          const xStart = Math.max(0, Math.round(wx + 0.14 * ww));
          const xWidth = Math.max(1, Math.round(0.72 * ww));
          const yTopSample = Math.max(0, Math.round(wy + 0.135 * wh));
          const yBotSample = Math.min(patchedSheet.height - 1, Math.round(wy + 0.243 * wh));
          const yPatchStart = Math.max(0, Math.round(wy + 0.140 * wh));
          const yPatchEnd = Math.min(patchedSheet.height - 1, Math.round(wy + 0.238 * wh));
          const patchH = Math.max(1, yPatchEnd - yPatchStart + 1);

          const topData = psCtx.getImageData(xStart, yTopSample, xWidth, 1).data;
          const botData = psCtx.getImageData(xStart, yBotSample, xWidth, 1).data;
          const fillImg = psCtx.createImageData(xWidth, patchH);
          const fd = fillImg.data;
          for (let row = 0; row < patchH; row++) {
            const t = patchH > 1 ? row / (patchH - 1) : 0;
            for (let col = 0; col < xWidth; col++) {
              const sOff = col * 4;
              const dOff = (row * xWidth + col) * 4;
              fd[dOff] = Math.round(topData[sOff] * (1 - t) + botData[sOff] * t);
              fd[dOff + 1] = Math.round(topData[sOff + 1] * (1 - t) + botData[sOff + 1] * t);
              fd[dOff + 2] = Math.round(topData[sOff + 2] * (1 - t) + botData[sOff + 2] * t);
              fd[dOff + 3] = Math.round(topData[sOff + 3] * (1 - t) + botData[sOff + 3] * t);
            }
          }
          psCtx.putImageData(fillImg, xStart, yPatchStart);

          // Stamp JACKIE SWEET onto the seamlessly blended foil band
          psCtx.save();
          psCtx.fillStyle = WRAPPER_WORDMARK_INK[idx] ?? mixHex(flav.color, '#1c1a1f', 0.8);
          psCtx.textAlign = 'center';
          psCtx.textBaseline = 'middle';
          psCtx.font = `400 ${Math.round(0.1 * ww)}px "Archivo Black", sans-serif`;
          psCtx.fillText('JACKIE SWEET', wx + ww / 2, wy + 0.193 * wh, 0.74 * ww);
          psCtx.restore();
        });

        // Apply patched sheet to CSS --sheet so all shop cards, thumbs, & mini-bars show JACKIE SWEET
        patchedSheet.toBlob(
          (blob) => {
            if (disposed || !blob) return;
            const nextUrl = URL.createObjectURL(blob);
            if (patchedSheetBlobUrl) URL.revokeObjectURL(patchedSheetBlobUrl);
            patchedSheetBlobUrl = nextUrl;
            document.documentElement.style.setProperty('--sheet', `url("${nextUrl}")`);
          },
          'image/webp',
          0.95,
        );

        FLAVOURS.forEach((flav, idx) => {
          const [bx, by, bw, bh] = flav.wrap;
          // 4K-grade texture resolution per 3D bar (~1024 x 2138 px)
          const W = 1024;
          const H = Math.round(W * BH);
          const sx = (bx - 4) * scale;
          const sy = (by - 4) * scale;
          const sw = (bw + 8) * scale;
          const sh = (bh + 8) * scale;

          // Front canvas (from patchedSheet with JACKIE SWEET)
          const fc = document.createElement('canvas');
          fc.width = W;
          fc.height = H;
          const fctx = fc.getContext('2d')!;
          fctx.imageSmoothingEnabled = true;
          fctx.imageSmoothingQuality = 'high';
          fctx.drawImage(patchedSheet, sx, sy, sw, sh, 0, 0, W, H);
          const fTex = new THREE.CanvasTexture(fc);
          fTex.colorSpace = THREE.SRGBColorSpace;
          fTex.anisotropy = maxAniso;
          fTex.minFilter = THREE.LinearMipmapLinearFilter;
          fTex.magFilter = THREE.LinearFilter;
          frontTextures[idx] = fTex;

          // Back canvas (4K-grade)
          const bc = document.createElement('canvas');
          bc.width = W;
          bc.height = H;
          const ctx = bc.getContext('2d')!;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 1. Mirrored crop
          ctx.save();
          ctx.translate(W, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(patchedSheet, sx, sy, sw, sh, 0, 0, W, H);
          ctx.restore();

          // 2. source-atop body + seal fill
          ctx.save();
          ctx.globalCompositeOperation = 'source-atop';
          const sealH = 0.075 * H;
          ctx.fillStyle = hexAlpha(flav.color, 0.35);
          ctx.fillRect(0, 0, W, sealH);
          ctx.fillRect(0, H - sealH, W, sealH);
          ctx.fillStyle = hexAlpha(flav.color, 0.9);
          ctx.fillRect(0, sealH, W, H - 2 * sealH);

          // 3. Horizontal sheen gradient over body
          const sheen = ctx.createLinearGradient(0, 0, W, 0);
          sheen.addColorStop(0, 'rgba(0,0,0,0.10)');
          sheen.addColorStop(0.28, 'rgba(255,255,255,0.14)');
          sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
          sheen.addColorStop(0.8, 'rgba(0,0,0,0.04)');
          sheen.addColorStop(1, 'rgba(0,0,0,0.14)');
          ctx.fillStyle = sheen;
          ctx.fillRect(0, sealH, W, H - 2 * sealH);
          ctx.restore();

          // 4. Typography & panels
          const ink = mixHex(flav.color, '#1c1a1f', 0.78);
          ctx.fillStyle = ink;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.font = `400 ${0.062 * W}px "Archivo Black", sans-serif`;
          ctx.fillText('JACKIE SWEET', W / 2, 0.148 * H, 0.72 * W);

          ctx.font = `500 ${0.042 * W}px "DM Mono", monospace`;
          ctx.fillText(`${flav.name.toUpperCase()} · 50 G`, W / 2, 0.185 * H);

          // Nutrition panel
          const px = 0.15 * W;
          const py = 0.215 * H;
          const pw = 0.7 * W;
          const ph = 0.36 * H;
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          drawRoundedRect(ctx, px, py, pw, ph, 0.03 * W);
          ctx.fill();
          ctx.restore();

          const xL = 0.19 * W;
          const xR = 0.81 * W;
          ctx.fillStyle = ink;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.font = `400 ${0.058 * W}px "Archivo Black", sans-serif`;
          ctx.fillText('NUTRITION', xL, 0.232 * H);

          ctx.font = `400 ${0.032 * W}px "DM Mono", monospace`;
          ctx.fillText('Serving size 1 bar (50 g)', xL, 0.271 * H);

          // Solid rule
          ctx.fillRect(xL, 0.298 * H, xR - xL, Math.max(2, 0.0028 * H));

          const rows: Array<[string, string, boolean]> = [
            ['Calories', '210', true],
            ['Protein', '12 g', true],
            ['Total fat', '9 g', false],
            ['Carbohydrate', '22 g', false],
            ['Fibre', '6 g', false],
            ['Sugars', '8 g', false],
            ['Salt', '0.2 g', false],
          ];

          rows.forEach(([label, val, bold], rIdx) => {
            const ry = (0.314 + rIdx * 0.034) * H;
            ctx.font = `${bold ? 500 : 400} ${0.032 * W}px "DM Mono", monospace`;
            ctx.fillStyle = ink;
            ctx.textAlign = 'left';
            ctx.fillText(label, xL, ry);
            ctx.textAlign = 'right';
            ctx.fillText(val, xR, ry);
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.fillRect(xL, ry + 0.025 * H, xR - xL, Math.max(1.5, 0.0012 * H));
            ctx.restore();
          });

          // Ingredients
          ctx.fillStyle = ink;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `500 ${0.034 * W}px "DM Mono", monospace`;
          ctx.fillText('INGREDIENTS', W / 2, 0.618 * H);

          ctx.font = `400 ${0.034 * W}px "DM Mono", monospace`;
          const ingLines = wrapTextLines(ctx, flav.ingredients, 0.7 * W);
          ingLines.forEach((ln, li) => {
            ctx.fillText(ln, W / 2, (0.648 + li * 0.022) * H);
          });

          // Barcode white rounded card
          const bcX = 0.21 * W;
          const bcY = 0.735 * H;
          const bcW = 0.58 * W;
          const bcH = 0.112 * H;
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          drawRoundedRect(ctx, bcX, bcY, bcW, bcH, 0.025 * W);
          ctx.fill();
          ctx.restore();

          let seed = 7919 + idx * 977;
          const bRand = () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
          };
          const barScale = W / 462;
          let cursor = bcX + 0.05 * W;
          const endX = bcX + bcW - 0.05 * W;
          const barTop = bcY + 0.015 * H;
          const barH = 0.064 * H;
          ctx.fillStyle = '#1c1a1f';
          while (cursor < endX - 3 * barScale) {
            const bwBar = Math.max(1.5 * barScale, Math.round((bRand() * 4.5 + 1) * barScale));
            if (cursor + bwBar <= endX) {
              ctx.fillRect(cursor, barTop, bwBar, barH);
            }
            cursor += bwBar + Math.max(1.5 * barScale, Math.round((bRand() * 4 + 1.5) * barScale));
          }
          ctx.font = `400 ${0.026 * W}px "DM Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(`5 060912 3400${idx + 1}7`, W / 2, barTop + barH + 0.005 * H);

          // Bottom slogan
          ctx.fillStyle = ink;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `500 ${0.034 * W}px "DM Mono", monospace`;
          ctx.fillText('PRESSED, NOT BAKED', W / 2, 0.885 * H);

          const bTex = new THREE.CanvasTexture(bc);
          bTex.colorSpace = THREE.SRGBColorSpace;
          bTex.anisotropy = maxAniso;
          bTex.minFilter = THREE.LinearMipmapLinearFilter;
          bTex.magFilter = THREE.LinearFilter;
          backTextures[idx] = bTex;
        });

        // Update any bars already assigned
        poolBars.forEach((b) => {
          if (b.flavourIdx >= 0) setBarFlavour(b, b.flavourIdx);
        });
        if (travellerBar.flavourIdx >= 0) setBarFlavour(travellerBar, travellerBar.flavourIdx);
      });

      // Resize handler
      let vw = window.innerWidth;
      let vh = window.innerHeight;
      const updateCameraAndSize = () => {
        vw = window.innerWidth;
        vh = window.innerHeight;
        canvas.style.height = `${vh}px`;
        renderer.setSize(vw, vh, false);
        renderer.setPixelRatio(
          isSoftwareGl
            ? 1
            : Math.min(Math.max(window.devicePixelRatio || 1, 1.5), vw < 820 ? 2.5 : 3),
        );

        const D = clamp(1500 * Math.min(vw / 1440, vh / 900), 1000, 2200);
        camera.fov = (2 * Math.atan(vh / 2 / D) * 180) / Math.PI;
        camera.aspect = vw / Math.max(1, vh);
        camera.near = 10;
        camera.far = 4 * D;
        camera.position.set(0, 0, D);
        camera.updateProjectionMatrix();

        // Update Section 2 scaled frames
        const k = vw < 820 ? Math.min(vw / 390, vh / 780) : Math.min(vw / 1440, vh / 900);
        const tf = `translate(-50%, -50%) scale(${k})`;
        if (inBackFrameRef.current) inBackFrameRef.current.style.transform = tf;
        if (inFrontFrameRef.current) inFrontFrameRef.current.style.transform = tf;

        // Recompute hero title size
        if (titleRef.current) {
          titleRef.current.style.fontSize = computeTitleFontSize(FLAVOURS[eng.activeFlavour].name);
        }
        positionNavHighlight(activeNavIdx);
      };

      updateCameraAndSize();
      window.addEventListener('resize', updateCameraAndSize);

      // Place a BarUnit from screen-space BarState
      const placeBar = (unit: BarUnit, st: BarState) => {
        if (st.op <= 0.01 || st.h <= 0.5) {
          unit.group.visible = false;
          unit.shadowMesh.visible = false;
          return;
        }
        unit.group.visible = true;
        const gx = st.x - vw / 2;
        const gy = vh / 2 - st.y;
        const gz = st.z;
        const sBase = st.h / BH;
        unit.group.position.set(gx, gy, gz);
        unit.group.scale.set(sBase * st.sx, sBase * st.sy, sBase);

        const rxRad = (st.rx * Math.PI) / 180;
        const ryRad = (st.ry * Math.PI) / 180;
        const rzRad = (-st.rz * Math.PI) / 180;
        unit.group.rotation.set(rxRad, ryRad, rzRad, 'ZYX');

        unit.frontMat.opacity = st.op;
        unit.backMat.opacity = st.op;

        const shOp = 0.5 * st.op * st.shadow;
        if (shOp > 0.005) {
          unit.shadowMesh.visible = true;
          unit.shadowMesh.position.set(gx, gy - 0.05 * st.h, gz - 0.32 * st.h);
          unit.shadowMesh.rotation.set(0, 0, rzRad, 'ZYX');
          const wScale = Math.max(0.3, Math.abs(Math.cos(ryRad)));
          unit.shadowMesh.scale.set(sBase * st.sx * wScale, sBase * st.sy, 1);
          unit.shadowMat.opacity = shOp;
        } else {
          unit.shadowMesh.visible = false;
        }
      };

      // Arc layout evaluator
      const evalArcState = (j: number, pos: number, now: number, opMult = 1): BarState => {
        const heroH = heroRef.current ? heroRef.current.clientHeight || vh : vh;
        const isPhone = vw < 820;
        const u = isPhone ? Math.min(vw / 560, heroH / 980) : Math.min(vw / 1440, vh / 900);
        const xSpread = isPhone ? 1.02 : 1;
        const cx = vw / 2;
        const cy = isPhone ? heroH * 0.4 : heroH / 2 - 78 * u;

        const k = j - pos;
        const ak = Math.min(Math.abs(k), 4);
        const s = k === 0 ? 0 : k > 0 ? 1 : -1;
        const i0 = Math.floor(ak);
        const i1 = Math.min(4, Math.ceil(ak));
        const f = ak - i0;

        const slot0 = ARC_SLOTS[i0];
        const slot1 = ARC_SLOTS[i1];
        const dx = lerp(slot0[0], slot1[0], f);
        const dy = lerp(slot0[1], slot1[1], f);
        const hU = lerp(slot0[2], slot1[2], f);
        const rzU = lerp(slot0[3], slot1[3], f);
        const ryU = lerp(slot0[4], slot1[4], f);

        let y = cy + dy * u;
        let rz = s * rzU;
        if (!eng.reducedMotion) {
          const b = Math.sin((now / 4600) * Math.PI * 2 + 1.37 * j);
          y -= (0.5 * b + 0.5) * 9 * u;
          rz += 0.4 * b;
        }

        const fade = clamp(1 - (Math.abs(k) - 3.3) / 0.6, 0, 1);
        return {
          x: cx + s * dx * u * xSpread,
          y,
          h: hU * u,
          rz,
          ry: s * ryU,
          rx: 0,
          z: -Math.abs(k) * 34 * u,
          op: fade * opMult,
          sx: 1,
          sy: 1,
          shadow: 1,
        };
      };

      // Drag & tap pointer handlers on .arc
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const arcEl = arcRef.current;

      const pickHeroBarAt = (clientX: number, clientY: number): number | null => {
        ndc.set((clientX / vw) * 2 - 1, -(clientY / vh) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const meshes: Array<InstanceType<typeof THREE.Object3D>> = [];
        const map = new Map<unknown, number>();
        for (const b of eng.visibleHeroBars) {
          const m = b.mesh as InstanceType<typeof THREE.Object3D>;
          meshes.push(m);
          map.set(m, b.j);
        }
        const hits = raycaster.intersectObjects(meshes, true);
        if (hits.length === 0) return null;
        let obj: InstanceType<typeof THREE.Object3D> | null = hits[0].object;
        for (const [group, jVal] of map.entries()) {
          if (obj === group || (group as InstanceType<typeof THREE.Group>).children?.includes?.(obj as never)) {
            return jVal;
          }
          // Check parent match
          for (const [g, jv] of map.entries()) {
            const grp = g as InstanceType<typeof THREE.Group>;
            if (grp.children && grp.children.some((c: unknown) => c === obj)) {
              return jv;
            }
          }
        }
        return null;
      };

      let downActive = false;
      let pointerId = -1;
      let startX = 0;
      let startY = 0;
      let pos0 = 0;
      let lastX = 0;
      let lastT = 0;
      let vel = 0;

      const onArcPointerDown = (e: PointerEvent) => {
        if (e.button !== 0 || !eng.entered) return;
        downActive = true;
        pointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        pos0 = eng.pos;
        lastX = e.clientX;
        lastT = performance.now();
        vel = 0;
        eng.dragging = false;
        eng.lastInteract = performance.now();
      };

      const onArcPointerMove = (e: PointerEvent) => {
        if (downActive && e.pointerId === pointerId) {
          eng.lastInteract = performance.now();
          const dx = e.clientX - startX;
          if (!eng.dragging && Math.abs(dx) > 6) {
            eng.dragging = true;
            eng.slideActive = false;
            try {
              arcEl?.setPointerCapture(pointerId);
            } catch {
              // ignore
            }
            document.body.classList.add('dragging');
          }
          if (eng.dragging) {
            const heroH = heroRef.current ? heroRef.current.clientHeight || vh : vh;
            const isPhone = vw < 820;
            const u = isPhone ? Math.min(vw / 560, heroH / 980) : Math.min(vw / 1440, vh / 900);
            const xSpread = isPhone ? 1.02 : 1;
            const slotPx = Math.max(40, 245 * u * xSpread);
            eng.pos = pos0 - dx / slotPx;

            const now = performance.now();
            const dt = Math.max(1, now - lastT);
            const instVel = -(e.clientX - lastX) / slotPx / dt;
            vel = vel * 0.6 + instVel * 0.4;
            lastX = e.clientX;
            lastT = now;
          }
          return;
        }

        if (e.pointerType === 'mouse' && eng.entered && arcEl) {
          const hit = pickHeroBarAt(e.clientX, e.clientY);
          arcEl.classList.toggle('pointer', hit !== null);
        }
      };

      const finishDrag = (e: PointerEvent, isCancel: boolean) => {
        if (!downActive || e.pointerId !== pointerId) return;
        downActive = false;
        if (eng.dragging) {
          eng.dragging = false;
          document.body.classList.remove('dragging');
          try {
            arcEl?.releasePointerCapture(pointerId);
          } catch {
            // ignore
          }
          if (isCancel && Math.abs(eng.pos - Math.round(eng.pos)) <= 0.02) {
            return;
          }
          const to = Math.round(eng.pos + clamp(vel * 220, -2, 2));
          const dist = Math.abs(to - eng.pos);
          const dur = Math.max(380, 650 * Math.min(1, dist + 0.35));
          goTo(to, dur);
        } else if (!isCancel) {
          const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
          if (moved <= 6) {
            const hitJ = pickHeroBarAt(e.clientX, e.clientY);
            if (hitJ !== null && hitJ !== Math.round(eng.target)) {
              goTo(hitJ);
            }
          }
        }
      };

      const onArcPointerUp = (e: PointerEvent) => finishDrag(e, false);
      const onArcPointerCancel = (e: PointerEvent) => finishDrag(e, true);

      arcEl?.addEventListener('pointerdown', onArcPointerDown);
      arcEl?.addEventListener('pointermove', onArcPointerMove);
      arcEl?.addEventListener('pointerup', onArcPointerUp);
      arcEl?.addEventListener('pointercancel', onArcPointerCancel);

      // Frame loop
      let lastFrameNow = performance.now();
      let lastNavTheme: 'flav' | 'light' | 'dark' = 'flav';
      let lastActiveNav = 0;

      const afterDraw = (cb: () => void) => {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (gl && typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) return;
            const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (state === gl.UNSIGNALED) {
              rafId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              rafId = window.setTimeout(cb, 80);
            }
          };
          rafId = window.setTimeout(poll, 5);
        } else {
          rafId = window.setTimeout(cb, 80);
        }
      };

      const tick = () => {
        if (disposed) return;
        const now = performance.now();
        const dt = Math.min(64, Math.max(1, now - lastFrameNow));
        lastFrameNow = now;

        // 1. Smooth scroll step
        if (eng.smoothActive) {
          eng.smoothCurrentY += (eng.smoothTargetY - eng.smoothCurrentY) * (1 - Math.exp(-dt / 120));
          if (Math.abs(eng.smoothTargetY - eng.smoothCurrentY) < 0.5) {
            window.scrollTo(0, eng.smoothTargetY);
            eng.smoothActive = false;
          } else {
            window.scrollTo(0, eng.smoothCurrentY);
          }
        }

        // 2. Slide tween
        if (eng.slideActive) {
          const t = clamp((now - eng.slideStart) / eng.slideDur, 0, 1);
          const eased =
            eng.slideMode === 'enter'
              ? solveCubicBezier(0.16, 1, 0.3, 1, t)
              : solveCubicBezier(0.25, 0.75, 0.2, 1, t);
          eng.pos = lerp(eng.slideFrom, eng.slideTo, eased);

          if (!eng.slideSwapped && t >= 0.12) {
            eng.slideSwapped = true;
            const newFlav = mod5(Math.round(eng.slideTo));
            applyFlavourSwap(newFlav, eng.slideDir, false);
          }
          if (t >= 1) {
            eng.pos = eng.slideTo;
            eng.slideActive = false;
          }
        }

        // 3. Colour reveal feathered circle
        if (eng.revActive && revealRef.current) {
          const t = clamp((now - eng.revStart) / 420, 0, 1);
          const eased = solveCubicBezier(0.25, 0.75, 0.2, 1, t);
          const r = eng.revR * eased;
          const f = Math.max(60, 0.35 * r);
          const mask = `radial-gradient(circle at ${eng.revCx}px ${eng.revCy}px, #000 ${Math.max(0, r - f).toFixed(1)}px, transparent ${r.toFixed(1)}px)`;
          revealRef.current.style.maskImage = mask;
          revealRef.current.style.webkitMaskImage = mask;

          if (t >= 1) {
            document.documentElement.style.setProperty('--flav', eng.revColor);
            revealRef.current.style.removeProperty('--rv');
            revealRef.current.classList.remove('active');
            revealRef.current.style.maskImage = '';
            revealRef.current.style.webkitMaskImage = '';
            eng.revActive = false;
          }
        }

        // 4. Nav active link & theme
        const secEls = [heroRef.current, insideRef.current, shopRef.current, rangeRef.current];
        let navIdx = 0;
        secEls.forEach((sec, idx) => {
          if (sec && sec.getBoundingClientRect().top <= 0.35 * vh) {
            navIdx = idx;
          }
        });
        if (navIdx !== lastActiveNav) {
          lastActiveNav = navIdx;
          setActiveNavIdx(navIdx);
        }
        const nextTheme: 'flav' | 'light' | 'dark' =
          navIdx === 2 ? 'light' : navIdx === 3 ? 'dark' : 'flav';
        if (nextTheme !== lastNavTheme) {
          lastNavTheme = nextTheme;
          setNavTheme(nextTheme);
        }

        // 5. Section 2 pin, steps, flip, storm
        const insideEl = insideRef.current;
        const shopEl = shopRef.current;
        const inRect = insideEl ? insideEl.getBoundingClientRect() : null;
        const shopRect = shopEl ? shopEl.getBoundingClientRect() : null;

        let p = 0;
        let q = 0;
        if (inRect && inFrontRef.current) {
          if (inRect.bottom <= 0 || inRect.top >= vh) {
            inFrontRef.current.style.visibility = 'hidden';
          } else {
            inFrontRef.current.style.visibility = 'visible';
            const pinY =
              inRect.top > 0
                ? inRect.top
                : inRect.bottom < vh
                  ? inRect.bottom - vh
                  : 0;
            inFrontRef.current.style.transform = `translate3d(0, ${pinY}px, 0)`;
          }

          p = clamp(-inRect.top / Math.max(1, inRect.height - vh), 0, 1);
          const step = Math.floor(Math.min(p, 0.759) / 0.19);
          q = clamp((p - 0.76) / 0.24, 0, 1);

          if (step !== eng.insideStep) {
            const prevStep = eng.insideStep;
            eng.insideStep = step;
            setInsideStep(step);

            const targetAng = STEP_ANGLES[step];
            if (eng.reducedMotion) {
              eng.flipAngle = targetAng;
              eng.flipActive = false;
              crossfadeInsideText(step, eng.activeFlavour, true);
            } else {
              const halfTurns = clamp(Math.abs(targetAng - eng.flipAngle) / 180, 0.4, 2);
              const dur = halfTurns * 720;
              eng.flipFrom = eng.flipAngle;
              eng.flipTo = targetAng;
              eng.flipStart = now;
              eng.flipDur = dur;
              eng.flipActive = true;

              if (eng.textTimer) window.clearTimeout(eng.textTimer);
              const textDelay = 0.38 * Math.min(dur, 720);
              const snapStep = step;
              const snapFlav = eng.activeFlavour;
              eng.textTimer = window.setTimeout(() => {
                crossfadeInsideText(snapStep, snapFlav, false);
              }, textDelay);
            }
            void prevStep;
          }

          if (eng.flipActive) {
            const ft = clamp((now - eng.flipStart) / eng.flipDur, 0, 1);
            const easedFlip = -(Math.cos(Math.PI * ft) - 1) / 2;
            eng.flipAngle = lerp(eng.flipFrom, eng.flipTo, easedFlip);
            if (ft >= 1) {
              eng.flipAngle = eng.flipTo;
              eng.flipActive = false;
            }
          }

          // Storm & front fade
          const frontOp = String(1 - clamp(4 * q, 0, 1));
          if (inFrontFrameRef.current) inFrontFrameRef.current.style.opacity = frontOp;
          if (inNumRef.current) inNumRef.current.style.opacity = frontOp;
          if (inDarkRef.current) inDarkRef.current.style.opacity = String(clamp(3.5 * q, 0, 1) * 0.42);

          // 20 storm pieces
          const R = 0.55 * Math.hypot(vw, vh);
          const baseSize = 0.085 * Math.min(vw, vh);
          const activeBit = FLAVOURS[eng.activeFlavour].bit;

          for (let i = 0; i < 20; i++) {
            const el = stormRefs.current[i];
            if (!el) continue;
            if (q <= 0 || q >= 1 || eng.reducedMotion) {
              el.style.opacity = '0';
              continue;
            }
            const seed = STORM_SEEDS[i];
            const s = clamp((q - 0.45 * seed.ph) / 0.55, 0, 1);
            if (s <= 0 || s >= 1) {
              el.style.opacity = '0';
              continue;
            }
            const bitIdx = seed.useFlavBit ? activeBit : seed.altBit;
            const box = BITS[bitIdx];
            const crop = sprCrop(box, 0);
            el.style.backgroundSize = String(crop.backgroundSize);
            el.style.backgroundPosition = String(crop.backgroundPosition);
            el.style.width = `${baseSize}px`;
            el.style.height = `${baseSize * (box[3] / box[2])}px`;

            const rad = (0.06 + Math.pow(s, 1.5) * 0.95) * R;
            const px = vw / 2 + Math.cos(seed.angle) * rad;
            const py = vh / 2 + Math.sin(seed.angle) * rad * 0.8;
            const sc = (0.2 + 1.7 * s) * seed.size;
            const rot = seed.spin * s;
            const op = Math.sin(Math.PI * s) * clamp(5 * q, 0, 1) * clamp(6 * (1 - q), 0, 1);

            el.style.opacity = String(op);
            el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${sc}) rotate(${rot}deg)`;
          }
        }

        // 6. Traveller & Hero 3D bars
        const p1 = inRect ? clamp(1 - inRect.top / vh, 0, 1) : 0;
        const p3 = shopRect ? clamp((vh - shopRect.top) / (0.7 * vh), 0, 1) : 0;

        // On phones, first time p3 > 0, scroll cards strip to centre live card
        if (vw < 820 && p3 > 0 && !eng.phoneShopScrolled) {
          eng.phoneShopScrolled = true;
          const liveCard = cardRefs.current[eng.activeFlavour];
          const strip = cardsWrapRef.current;
          if (liveCard && strip) {
            const targetScroll =
              liveCard.offsetLeft - strip.clientWidth / 2 + liveCard.clientWidth / 2;
            strip.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
          }
        }

        const jT = Math.round(eng.target);
        const otherOpMult = 1 - clamp(1.6 * p1, 0, 1);

        // Pool of 11 hero bars: floor(pos) - 5 ... floor(pos) + 5
        const jStart = Math.floor(eng.pos) - 5;
        eng.visibleHeroBars.length = 0;

        for (let idx = 0; idx < 11; idx++) {
          const j = jStart + idx;
          const unit = poolBars[idx];
          if (j === jT || otherOpMult <= 0.01) {
            unit.group.visible = false;
            unit.shadowMesh.visible = false;
            continue;
          }
          const fIdx = mod5(j);
          setBarFlavour(unit, fIdx);
          const st = evalArcState(j, eng.pos, now, otherOpMult);
          placeBar(unit, st);
          if (unit.group.visible && p1 < 0.5) {
            eng.visibleHeroBars.push({ j, mesh: unit.group });
          }
        }

        // Traveller state: Anchor A -> Anchor B -> Anchor C
        const anchorA = evalArcState(jT, eng.pos, now, 1);

        let barState = anchorA;

        if (p1 > 0) {
          const inBarRect = inBarRef.current?.getBoundingClientRect();
          const bYBob = eng.reducedMotion ? 0 : Math.sin((now / 2600) * Math.PI * 2) * 6;
          const bRy = eng.flipAngle + (eng.reducedMotion ? 0 : 720 * q);
          const anchorB: BarState = inBarRect
            ? {
                x: inBarRect.left + inBarRect.width / 2,
                y: inBarRect.top + inBarRect.height / 2 + bYBob,
                h: inBarRect.height,
                rz: 14,
                ry: bRy,
                rx: 0,
                z: 0,
                op: 1,
                sx: 1,
                sy: 1,
                shadow: 1,
              }
            : anchorA;

          barState = lerpBarState(anchorA, anchorB, easeInOut(p1));

          if (p3 > 0) {
            const pkEl = pkRefs.current[eng.activeFlavour];
            const pkRect = pkEl?.getBoundingClientRect();
            // Squash poke on live card
            let pokeSx = 1;
            let pokeSy = 1;
            if (eng.pokeStart > 0 && eng.pokeFlav === eng.activeFlavour) {
              const pt = (now - eng.pokeStart) / 500;
              if (pt >= 1) {
                eng.pokeStart = -1;
              } else if (pt < 0.3) {
                const k = pt / 0.3;
                pokeSx = lerp(1, 1.06, k);
                pokeSy = lerp(1, 0.93, k);
              } else if (pt < 0.6) {
                const k = (pt - 0.3) / 0.3;
                pokeSx = lerp(1.06, 0.97, k);
                pokeSy = lerp(0.93, 1.04, k);
              } else {
                const k = (pt - 0.6) / 0.4;
                pokeSx = lerp(0.97, 1, k);
                pokeSy = lerp(1.04, 1, k);
              }
            }

            const tx = eng.tiltX[eng.activeFlavour] || 0;
            const ty = eng.tiltY[eng.activeFlavour] || 0;
            const anchorC: BarState = pkRect
              ? {
                  x: pkRect.left + pkRect.width / 2,
                  y: pkRect.top + pkRect.height / 2,
                  h: pkRect.height,
                  rz: 0,
                  ry: Math.round(anchorB.ry / 360) * 360 + tx * 14,
                  rx: -ty * 14,
                  z: 30,
                  op: 1,
                  sx: pokeSx,
                  sy: pokeSy,
                  shadow: 0.7,
                }
              : anchorB;

            barState = lerpBarState(barState, anchorC, easeInOut(p3));
          }
        }

        setBarFlavour(travellerBar, eng.activeFlavour);
        placeBar(travellerBar, barState);
        if (travellerBar.group.visible && p1 < 0.5) {
          eng.visibleHeroBars.push({ j: jT, mesh: travellerBar.group });
        }

        renderer.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          rafId = requestAnimationFrame(tick);
        }
      };

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        rafId = requestAnimationFrame(tick);
      }

      cleanupThree = () => {
        window.removeEventListener('resize', updateCameraAndSize);
        arcEl?.removeEventListener('pointerdown', onArcPointerDown);
        arcEl?.removeEventListener('pointermove', onArcPointerMove);
        arcEl?.removeEventListener('pointerup', onArcPointerUp);
        arcEl?.removeEventListener('pointercancel', onArcPointerCancel);

        if (patchedSheetBlobUrl) {
          URL.revokeObjectURL(patchedSheetBlobUrl);
          patchedSheetBlobUrl = null;
        }
        frontGeo.dispose();
        backGeo.dispose();
        shadowGeo.dispose();
        shadowTex.dispose();
        envRT.dispose();
        frontTextures.forEach((t) => t?.dispose());
        backTextures.forEach((t) => t?.dispose());
        [...poolBars, travellerBar].forEach((b) => {
          b.frontMat.dispose();
          b.backMat.dispose();
          b.shadowMat.dispose();
        });
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(rafId);
      introTimers.forEach((t) => clearTimeout(t));
      clearInterval(autoTimer);
      skipBtn?.removeEventListener('click', onSkipClick);
      heroObs.disconnect();
      shopObs.disconnect();
      rangeObs.disconnect();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', stopSmoothOnInput);
      window.removeEventListener('keydown', onKeyDown);
      cleanupThree?.();
    };
  }, [
    activeNavIdx,
    applyFlavourSwap,
    computeTitleFontSize,
    crossfadeInsideText,
    goTo,
    positionNavHighlight,
    setTitleHTML,
  ]);

  // Card tilt & press handlers (fine pointer only)
  const handleCardPointerMove = useCallback((idx: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }
    const card = cardRefs.current[idx];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
    const y = clamp((e.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
    engineRef.current.tiltX[idx] = x;
    engineRef.current.tiltY[idx] = y;
    card.classList.add('tilting');
    card.style.transform = `translateY(-8px) rotateX(${(-y * 12).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg)`;
  }, []);

  const handleCardPointerLeave = useCallback((idx: number) => {
    const card = cardRefs.current[idx];
    engineRef.current.tiltX[idx] = 0;
    engineRef.current.tiltY[idx] = 0;
    if (card) {
      card.classList.remove('tilting', 'pressing');
      card.style.transform = '';
    }
  }, []);

  const handleCardPointerDown = useCallback((idx: number, e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    cardRefs.current[idx]?.classList.add('pressing');
  }, []);

  const handleCardPointerUp = useCallback((idx: number) => {
    cardRefs.current[idx]?.classList.remove('pressing');
  }, []);

  // Pack slot counts per flavour
  const packCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    packSlots.forEach((v) => {
      if (v !== null) counts[v]++;
    });
    return counts;
  }, [packSlots]);

  const remainingToPick = packSlots.filter((v) => v === null).length;
  const packFull = remainingToPick === 0;

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, idx: number, ref: React.RefObject<HTMLElement | null>) => {
      e.preventDefault();
      setActiveNavIdx(idx);
      const targetEl = ref.current;
      if (!targetEl) return;
      const top = targetEl.getBoundingClientRect().top + window.scrollY;
      scrollToY(top);
    },
    [scrollToY],
  );

  const handleInsideIconClick = useCallback(
    (stepIdx: number) => {
      const el = insideRef.current;
      if (!el) return;
      const docTop = el.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(1, el.offsetHeight - window.innerHeight);
      const pTarget = (stepIdx + 0.5) * 0.19;
      scrollToY(docTop + pTarget * travel);
    },
    [scrollToY],
  );

  const cartTotal = useMemo(
    () => cartEntries.reduce((acc, e) => acc + e.price * e.qty, 0),
    [cartEntries],
  );

  return (
    <>
      {/* DEMO KEY QUOTA BANNER (CASE A) */}
      {quotaExceeded && !quotaBannerDismissed && (
        <div className="gmp-quota-banner" role="alert">
          <span>
            This app uses a Google Maps Platform demo key, which has reached its daily quota. Switch to your own Cloud-billed API key to continue using Maps features uninterrupted.{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              Learn more
            </a>
          </span>
          <button
            type="button"
            onClick={() => setQuotaBannerDismissed(true)}
            className="px-2.5 py-1 rounded-full bg-amber-900/15 hover:bg-amber-900/25 text-amber-950 text-xs font-semibold border-0 cursor-pointer shrink-0"
            aria-label="Dismiss quota warning"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* INTRO OVERLAY */}
      <div id="intro" ref={introRef}>
        <video
          id="introVid"
          ref={introVidRef}
          src={INTRO_VIDEO_URL}
          muted
          playsInline
          preload="auto"
        />
        <button id="skipIntro" type="button">
          Skip intro
        </button>
        <div className="intro-stamp" aria-hidden="true">
          <svg className="intro-mark" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="60" fill="#1c1a1f" />
            <path d="M25 83 L49 42 L61 62 L73 48 L95 83 Z" fill="#f0e8e0" />
          </svg>
          <span className="intro-word">JACKIE SWEETS</span>
        </div>
      </div>

      {/* NAV */}
      <nav
        id="nav"
        ref={navRef}
        className={navTheme === 'dark' ? 'dark' : navTheme === 'light' ? 'light' : ''}
        aria-label="Primary"
      >
        <a
          href="#flavors"
          className="nav-brand"
          onClick={(e) => handleNavClick(e, 0, heroRef)}
        >
          <svg className="nav-mark" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <circle className="disc" cx="18" cy="18" r="18" />
            <path className="peak" d="M7.5 25 L14.7 12.6 L18.3 18.6 L21.9 14.4 L28.5 25 Z" />
          </svg>
          <span className="nav-word">JACKIE SWEETS</span>
        </a>

        <div className="nav-pill" ref={navPillRef}>
          <span className="nav-hi" ref={navHiRef} aria-hidden="true" />
          {[
            { label: 'Flavors', href: '#flavors', ref: heroRef },
            { label: 'Inside', href: '#inside', ref: insideRef },
            { label: 'Shop', href: '#shop', ref: shopRef },
            { label: 'Range', href: '#range', ref: rangeRef },
          ].map((item, idx) => (
            <a
              key={item.href}
              href={item.href}
              ref={(el) => {
                navLinkRefs.current[idx] = el;
              }}
              className={`nav-link${activeNavIdx === idx ? ' active' : ''}`}
              onClick={(e) => handleNavClick(e, idx, item.ref)}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="nav-right">
          <button
            type="button"
            className="nav-chip nav-off"
            onClick={() => {
              const el = rangeRef.current;
              if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY);
            }}
          >
            % OFF
          </button>

          <button
            ref={basketRef}
            key={basketBumpKey}
            type="button"
            className={`nav-chip nav-basket${basketBumpKey > 0 ? ' bump' : ''}`}
            aria-label={`Basket, ${cartCount} items`}
            onClick={() => setCartOpen((o) => !o)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 10h14l-1.5 9h-11Z" />
              <path d="M9 10V7a3 3 0 0 1 6 0v3" />
            </svg>
            {cartCount > 0 && (
              <span key={badgePopKey} className="cart-badge pop">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="nav-dibs"
            onClick={() => {
              setDibsSubmitted(false);
              setDibsOpen(true);
            }}
          >
            First dibs
          </button>
        </div>
      </nav>

      {/* BASKET POPOVER */}
      {cartOpen && (
        <div className="nav-popover" role="dialog" aria-label="Your basket">
          <div className="flex items-center justify-between mb-3">
            <span className="disp text-lg tracking-tight">Your Bag ({cartCount})</span>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="w-7 h-7 rounded-full border border-black/15 flex items-center justify-center text-sm cursor-pointer bg-transparent"
              aria-label="Close basket"
            >
              ×
            </button>
          </div>
          {cartEntries.length === 0 ? (
            <p className="text-xs opacity-70 m-0">Your bag is empty. Add a bar or build a 3-pack below.</p>
          ) : (
            <>
              <ul className="list-none p-0 m-0 space-y-2 max-h-48 overflow-y-auto">
                {cartEntries.map((entry, idx) => (
                  <li key={idx} className="flex items-center justify-between text-xs border-b border-black/10 pb-2">
                    <span className="font-medium pr-2">
                      {entry.qty}× {entry.label}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace" }}>
                      ${(entry.price * entry.qty).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between mt-3 pt-2 text-sm font-bold">
                <span>Subtotal</span>
                <span style={{ fontFamily: "'DM Mono', monospace" }}>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setCartEntries([]);
                    setCartCount(0);
                    setCartOpen(false);
                  }}
                  className="flex-1 py-2 rounded-full border border-black/20 text-xs font-semibold cursor-pointer bg-transparent"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCartEntries([]);
                    setCartCount(0);
                    setCartOpen(false);
                    setDibsSubmitted(false);
                    setDibsOpen(true);
                  }}
                  className="flex-1 py-2 rounded-full bg-[#1c1a1f] text-[#f0e8e0] text-xs font-semibold cursor-pointer border-0"
                >
                  Reserve Order
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* FIRST DIBS MODAL */}
      {dibsOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDibsOpen(false);
          }}
        >
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="dibs-title">
            <div className="flex items-center justify-between mb-3">
              <h2 id="dibs-title" className="disp text-2xl m-0">
                FIRST DIBS
              </h2>
              <button
                type="button"
                onClick={() => setDibsOpen(false)}
                className="w-8 h-8 rounded-full border border-black/15 flex items-center justify-center text-base cursor-pointer bg-transparent"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            {dibsSubmitted ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed m-0">
                  You&apos;re on the list. Watch your inbox for our next small-batch cold press drop.
                </p>
                <button
                  type="button"
                  onClick={() => setDibsOpen(false)}
                  className="w-full py-2.5 rounded-full bg-[#1c1a1f] text-[#f0e8e0] text-sm font-semibold border-0 cursor-pointer"
                >
                  Back to Jackie Sweets
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (dibsEmail.trim()) setDibsSubmitted(true);
                }}
                className="space-y-3"
              >
                <p className="text-sm opacity-80 leading-relaxed m-0">
                  Get early access to limited cold-pressed drops and 15% off your first box.
                </p>
                <input
                  type="email"
                  required
                  value={dibsEmail}
                  onChange={(e) => setDibsEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-full border border-black/20 bg-white text-sm outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#1c1a1f] text-[#f0e8e0] text-sm font-semibold border-0 cursor-pointer"
                >
                  Claim First Dibs
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* NUTRITIONAL FACTS MODAL */}
      {nutritionModalFlav !== null && (() => {
        const flav = FLAVOURS[nutritionModalFlav];
        const mult = nutritionPer100g ? 2 : 1;
        const servingLabel = nutritionPer100g ? 'Per 100 g (2 bars)' : '1 bar (50 g)';
        const formatVal = (n: number) => {
          const val = n * mult;
          return Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.0$/, '');
        };

        return (
          <div
            className="modal-backdrop"
            style={{ zIndex: 95 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setNutritionModalFlav(null);
            }}
          >
            <div
              className="nutri-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="nutri-modal-title"
            >
              <div className="nutri-header" style={{ background: flav.color }}>
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="spr shrink-0"
                    style={{
                      width: 36,
                      height: 75,
                      ...sprCrop(flav.wrap, 4),
                      filter: 'drop-shadow(0 4px 8px rgba(28, 26, 31, 0.25))',
                    }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="nutri-mono text-[11px] uppercase tracking-[0.14em] text-[#1c1a1f]/80 mb-1">
                      Nutrition Facts · 50 g Bar
                    </div>
                    <h2
                      id="nutri-modal-title"
                      className="disp text-2xl sm:text-3xl m-0 text-[#fbf7f2]"
                    >
                      {flav.name}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setNutritionModalFlav(mod5(nutritionModalFlav - 1))}
                    className="w-8 h-8 rounded-full border border-[#fbf7f2]/60 text-[#fbf7f2] bg-black/15 hover:bg-black/25 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Previous flavour nutrition facts"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setNutritionModalFlav(mod5(nutritionModalFlav + 1))}
                    className="w-8 h-8 rounded-full border border-[#fbf7f2]/60 text-[#fbf7f2] bg-black/15 hover:bg-black/25 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Next flavour nutrition facts"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    onClick={() => setNutritionModalFlav(null)}
                    className="w-8 h-8 rounded-full bg-[#1c1a1f] text-[#f0e8e0] border-0 flex items-center justify-center text-base cursor-pointer ml-1"
                    aria-label="Close nutritional facts modal"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="nutri-body">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#1c1a1f]">
                  <div>
                    <div className="nutri-mono text-xs text-[#1c1a1f]/75">
                      Serving size: <strong className="text-[#1c1a1f]">{servingLabel}</strong>
                    </div>
                  </div>
                  <div
                    className="inline-flex rounded-full p-0.5 border border-[#1c1a1f]/20 bg-black/5"
                    role="group"
                    aria-label="Serving basis"
                  >
                    <button
                      type="button"
                      onClick={() => setNutritionPer100g(false)}
                      className={`nutri-mono text-[11px] px-2.5 py-1 rounded-full border-0 cursor-pointer transition-colors ${
                        !nutritionPer100g
                          ? 'bg-[#1c1a1f] text-[#f0e8e0]'
                          : 'bg-transparent text-[#1c1a1f]/75 hover:text-[#1c1a1f]'
                      }`}
                    >
                      50 g bar
                    </button>
                    <button
                      type="button"
                      onClick={() => setNutritionPer100g(true)}
                      className={`nutri-mono text-[11px] px-2.5 py-1 rounded-full border-0 cursor-pointer transition-colors ${
                        nutritionPer100g
                          ? 'bg-[#1c1a1f] text-[#f0e8e0]'
                          : 'bg-transparent text-[#1c1a1f]/75 hover:text-[#1c1a1f]'
                      }`}
                    >
                      100 g
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between py-2.5 border-b-4 border-[#1c1a1f]">
                  <span className="disp text-xl">Calories</span>
                  <span className="disp text-3xl nutri-mono">
                    {flav.nutrition.calories * mult}
                  </span>
                </div>

                <table className="nutri-table" aria-label={`${flav.name} nutritional facts`}>
                  <thead>
                    <tr>
                      <th className="text-left text-[11px] uppercase tracking-[0.12em] opacity-65 font-normal">
                        Nutrient
                      </th>
                      <th className="text-right text-[11px] uppercase tracking-[0.12em] opacity-65 font-normal">
                        Amount
                      </th>
                      <th className="text-right text-[11px] uppercase tracking-[0.12em] opacity-65 font-normal w-16">
                        % DV*
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {flav.nutrition.rows.map((row) => (
                      <tr key={row.label} className={row.kind ?? ''}>
                        <td>{row.label}</td>
                        <td className="text-right">
                          {formatVal(row.perBar)} {row.unit}
                        </td>
                        <td className="text-right opacity-80">
                          {row.dvPerBar !== undefined ? `${row.dvPerBar * mult}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="nutri-mono text-[11px] opacity-65 mt-2.5 mb-4 leading-relaxed">
                  * Percent Daily Values (% DV) are based on a 2,000 kcal diet.
                </p>

                <div className="rounded-xl bg-black/5 p-3.5 space-y-1.5 mb-4">
                  <div className="nutri-mono text-[11px] uppercase tracking-[0.12em] font-medium">
                    Ingredients
                  </div>
                  <p className="text-xs leading-relaxed m-0 text-[#1c1a1f]/90">
                    {flav.ingredients}
                  </p>
                  <p className="nutri-mono text-[11px] m-0 text-[#1c1a1f]/70 pt-1">
                    {flav.nutrition.allergens}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      commitToCart({
                        kind: 'single',
                        label: `${flav.name} Bar`,
                        flavours: [flav.id],
                        price: 2.99,
                      });
                      setNutritionModalFlav(null);
                    }}
                    className="flex-1 py-2.5 px-5 rounded-full bg-[#1c1a1f] text-[#f0e8e0] text-sm font-semibold border-0 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    Add {flav.name} to bag · $2.99
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <main>
        {/* SECTION 1: HERO CAROUSEL */}
        <section id="flavors" ref={heroRef} aria-label="Flavours">
          <div className="reveal" ref={revealRef} aria-hidden="true" />
          <div className="rings" ref={ringsRef} aria-hidden="true" />
          <div className="bits" aria-hidden="true">
            {HERO_BITS.map((spec, idx) => {
              const box = BITS[spec.bit];
              const crop = sprCrop(box, 0);
              const hidePhone = spec.bit === 1 || spec.bit === 3 || spec.bit === 4;
              const aspect = box[3] / box[2];
              return (
                <div
                  key={idx}
                  ref={(el) => {
                    bitRefs.current[idx] = el;
                  }}
                  className={`bit spr${hidePhone ? ' bit-hide-phone' : ''}`}
                  style={
                    {
                      left: `${spec.x * 100}%`,
                      top: `${spec.y * 100}%`,
                      width: `calc(${spec.u} * var(--u))`,
                      height: `calc(${spec.u * aspect} * var(--u))`,
                      '--r': `${spec.r}deg`,
                      ...crop,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>

          <div className="arc" ref={arcRef} aria-label="Drag or click a bar to switch flavour" />

          <button
            id="play"
            ref={playBtnRef}
            type="button"
            aria-label="Next flavour"
            onClick={() => goTo(engineRef.current.target + 1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>

          <h1 id="title" ref={titleRef} className="disp" aria-live="polite" />

          <div id="count" ref={countRef} className="disp" aria-hidden="true">
            02
          </div>

          <button
            id="auto"
            ref={autoBtnRef}
            type="button"
            aria-pressed={autoplay}
            onClick={() => {
              engineRef.current.lastInteract = performance.now();
              setAutoplay((a) => !a);
            }}
          >
            <span className="auto-ring" aria-hidden="true">
              {autoplay ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="2" y="1.5" width="2" height="7" rx="1" />
                  <rect x="6" y="1.5" width="2" height="7" rx="1" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M2.5 1.5 L8.5 5 L2.5 8.5 Z" />
                </svg>
              )}
            </span>
            <span className="auto-lbl">AUTOPLAY</span>
          </button>
        </section>

        {/* SECTION 2: INSIDE (PINNED) */}
        <section id="inside" ref={insideRef} aria-label="What's inside">
          <div className="pin">
            <div className="in-dark" ref={inDarkRef} aria-hidden="true" />
            <div className="in-frame back" ref={inBackFrameRef}>
              <div className="in-num disp" ref={inNumRef}>
                01
              </div>
              <div id="inBar" ref={inBarRef} />
            </div>
          </div>
        </section>

        {/* SECTION 2 FRONT LAYER (FIXED ABOVE CANVAS) */}
        <div id="inFront" ref={inFrontRef}>
          <div className="in-storm" aria-hidden="true">
            {STORM_SEEDS.map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  stormRefs.current[i] = el;
                }}
                className="storm-piece spr"
              />
            ))}
          </div>
          <div className="in-frame front" ref={inFrontFrameRef}>
            <h2 className="in-head disp" ref={inHeadRef}>
              REAL FOOD,
              <br />
              FIRST
            </h2>
            <div className="in-icons" role="tablist" aria-label="Bar story steps">
              {/* 01 Leaf */}
              <button
                type="button"
                className={`in-ic${insideStep === 0 ? ' on' : ''}`}
                aria-label="Step 1: Real food first"
                aria-selected={insideStep === 0}
                onClick={() => handleInsideIconClick(0)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 5c-7 0-12 4.5-12 12 7.5 0 12-5 12-12Z" />
                  <path d="M7 17c3-3 6-6 10-10" />
                </svg>
              </button>
              {/* 02 Four grains */}
              <button
                type="button"
                className={`in-ic${insideStep === 1 ? ' on' : ''}`}
                aria-label="Step 2: Pressed, not baked"
                aria-selected={insideStep === 1}
                onClick={() => handleInsideIconClick(1)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <ellipse cx="8" cy="8" rx="2.3" ry="3.6" transform="rotate(-25 8 8)" />
                  <ellipse cx="16" cy="8" rx="2.3" ry="3.6" transform="rotate(25 16 8)" />
                  <ellipse cx="8" cy="16" rx="2.3" ry="3.6" transform="rotate(25 8 16)" />
                  <ellipse cx="16" cy="16" rx="2.3" ry="3.6" transform="rotate(-25 16 16)" />
                </svg>
              </button>
              {/* 03 Heart */}
              <button
                type="button"
                className={`in-ic${insideStep === 2 ? ' on' : ''}`}
                aria-label="Step 3: Wrapped same day"
                aria-selected={insideStep === 2}
                onClick={() => handleInsideIconClick(2)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
                </svg>
              </button>
              {/* 04 Bolt */}
              <button
                type="button"
                className={`in-ic${insideStep === 3 ? ' on' : ''}`}
                aria-label="Step 4: Active flavour"
                aria-selected={insideStep === 3}
                onClick={() => handleInsideIconClick(3)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7Z" />
                </svg>
              </button>
            </div>
            <p className="in-cap" ref={inCapRef}>
              Oats, nuts, fruit.
              <br />
              Nothing you can&apos;t say.
            </p>
          </div>
        </div>

        {/* SECTION 3: GRAB A BAG */}
        <section
          id="shop"
          ref={shopRef}
          className={shopRevealed ? 'revealed' : ''}
          aria-label="Shop"
        >
          <h2 className="shop-head disp">
            <span className="rev-line">
              <span>GRAB</span>
            </span>
            <span className="rev-line d2">
              <span>A BAG</span>
            </span>
          </h2>
          <p className="shop-cap">
            Five bold flavours. Same
            <br />
            real ingredients. Pick your
            <br />
            favourite (or try them all).
          </p>

          <div className="cards" ref={cardsWrapRef}>
            {FLAVOURS.map((flav, idx) => {
              const isLive = activeFlavour === idx;
              const crop = sprCrop(flav.wrap, 4);
              return (
                <div
                  key={flav.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  className={`card${isLive ? ' live' : ''}`}
                  style={{ background: flav.color, '--ci': idx } as React.CSSProperties}
                  onPointerMove={(e) => handleCardPointerMove(idx, e)}
                  onPointerLeave={() => handleCardPointerLeave(idx)}
                  onPointerDown={(e) => handleCardPointerDown(idx, e)}
                  onPointerUp={() => handleCardPointerUp(idx)}
                >
                  <h3 className="card-name disp">
                    <button
                      type="button"
                      className="card-name-btn"
                      aria-label={`View nutritional facts and ingredients for ${flav.name}`}
                      onClick={() => {
                        setNutritionPer100g(false);
                        setNutritionModalFlav(idx);
                      }}
                    >
                      {flav.lines}
                    </button>
                  </h3>
                  <div
                    ref={(el) => {
                      pkRefs.current[idx] = el;
                    }}
                    className="pk spr"
                    style={crop}
                    role="button"
                    tabIndex={0}
                    aria-label={`Bounce ${flav.name} bar`}
                    onClick={() => handlePokeCard(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePokeCard(idx);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="card-add"
                    aria-label={`Add one ${flav.name} protein bar to your bag`}
                    onClick={() => handleAddCard(idx)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: BUILD YOUR 3 PACK */}
        <section
          id="range"
          ref={rangeRef}
          className={rangeRevealed ? 'revealed' : ''}
          aria-label="Build your 3 pack"
        >
          <div className="range-left">
            <h2 className="range-head disp">
              <span className="rev-line">
                <span>BUILD YOUR</span>
              </span>
              <span className="rev-line d2">
                <span>
                  <span className="pack-num">3</span> PACK &amp;
                </span>
              </span>
              <span className="rev-line d2">
                <span>SAVE $1.49</span>
              </span>
            </h2>

            <div className="thumbs" role="group" aria-label="Choose flavours for your 3 pack">
              {FLAVOURS.map((flav, idx) => {
                const count = packCounts[idx];
                const crop = sprCrop(flav.wrap, 4);
                return (
                  <button
                    key={flav.id}
                    type="button"
                    className="thumb"
                    onClick={() => handleThumbClick(idx)}
                    aria-label={`Add ${flav.name} to pack`}
                  >
                    <span className="thumb-box" style={{ background: flav.color }}>
                      <span className="thumb-spr spr" style={crop} />
                    </span>
                    <span className="thumb-name">{flav.name}</span>
                    <span className={`thumb-ring${count > 0 ? ' has' : ''}`} aria-hidden="true">
                      {count === 1 ? '✓' : count > 1 ? count : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              id="buy"
              type="button"
              disabled={!packFull && !packAddedState}
              className={packAddedState ? 'added' : ''}
              onClick={handleBuyPack}
            >
              {packAddedState ? (
                <span>Added to cart</span>
              ) : packFull ? (
                <>
                  <span>Add 3-pack to cart</span>
                  <span className="buy-price">$7.48</span>
                </>
              ) : (
                <>
                  <span>Pick {remainingToPick} more</span>
                  <span className="buy-price">$7.48</span>
                </>
              )}
            </button>
          </div>

          <div
            key={glowPulseKey}
            className={`glow${glowPulseKey > 0 ? ' pulse' : ''}`}
            style={{ '--g': packGlowColor } as React.CSSProperties}
          >
            {packSlots.map((flavIdx, slotIdx) => {
              const filled = flavIdx !== null;
              const flav = filled ? FLAVOURS[flavIdx] : null;
              return (
                <div key={slotIdx} className={`slot slot-${slotIdx}`}>
                  {filled && flav && (
                    <div
                      key={slotEnterKeys[slotIdx]}
                      ref={(el) => {
                        slotBarRefs.current[slotIdx] = el;
                      }}
                      className="slot-bar spr enter"
                      style={sprCrop(flav.wrap, 4)}
                    />
                  )}
                  <button
                    type="button"
                    className={`slot-x ${filled ? 'filled' : 'empty'}`}
                    aria-label={filled && flav ? `Remove ${flav.name} from slot ${slotIdx + 1}` : `Empty slot ${slotIdx + 1}`}
                    tabIndex={filled ? 0 : -1}
                    onClick={() => handleRemoveSlot(slotIdx)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* FLOATING SUPPORT DOCK */}
      <SupportDock
        darkTheme={navTheme === 'dark'}
        onOpenLocator={() => setLocatorOpen(true)}
        onOpenChat={() => setChatOpen(true)}
      />

      {/* STORE LOCATOR MODAL */}
      {locatorOpen && (
        <StoreLocatorModal
          accentColor={FLAVOURS[activeFlavour].color}
          onClose={() => setLocatorOpen(false)}
          onAskChatAboutStores={(locationText) => {
            setChatDraft(`Find health food stores or organic grocers near ${locationText} where I can look for plant protein bars`);
            setChatOpen(true);
          }}
        />
      )}

      {/* AI SUPPORT CHAT DRAWER */}
      {chatOpen && (
        <SupportChatDrawer
          accentColor={FLAVOURS[activeFlavour].color}
          messages={chatMessages}
          setMessages={setChatMessages}
          initialDraft={chatDraft}
          onClearInitialDraft={() => setChatDraft('')}
          onClose={() => setChatOpen(false)}
          onOpenLocator={() => setLocatorOpen(true)}
        />
      )}
    </>
  );
}
