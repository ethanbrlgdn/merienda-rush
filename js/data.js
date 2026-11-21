/* Merienda Rush! — game data: foods, recipes, days, customers, lines, upgrades.
   Plain script (no modules) so the game also runs by double-clicking index.html. */
var MR = window.MR = window.MR || {};

MR.W = 1280;            // logical canvas size (16:9, landscape)
MR.H = 720;

// ---- Foods customers can order ------------------------------------------
// price in pesos; day = first day it appears on the menu; extra = extra patience (s)
MR.FOODS = {
  bananacue: { name: 'Banana Cue', price: 15, day: 1, extra: 5 },
  turon:     { name: 'Turon',      price: 15, day: 1, extra: 9 },
  maruya:    { name: 'Maruya',     price: 12, day: 1, extra: 5 },
  kamotecue: { name: 'Kamote Cue', price: 15, day: 2, extra: 6 },
  fishball:  { name: 'Fishball',   price: 10, day: 3, extra: 6, sauce: true },
  kikiam:    { name: 'Kikiam',     price: 12, day: 3, extra: 6, sauce: true },
  palamig:   { name: 'Palamig',    price: 20, day: 4, extra: 6 }
};
MR.SAUCES = {
  sweet:   { name: 'Sweet',  label: 'Sweet' },
  spicy:   { name: 'Spicy',  label: 'Spicy' },
  vinegar: { name: 'Suka',   label: 'Suka' }
};

// ---- Ingredient trays (infinite supply) ----------------------------------
// x positions are filled in by the layout in game.js
MR.TRAYS = [
  { id: 'saba',        item: 'saba',         label: 'Saba',        day: 1 },
  { id: 'langka',      item: 'langka',       label: 'Langka',      day: 1 },
  { id: 'wrapper',     item: 'wrapper',      label: 'Wrapper',     day: 1 },
  { id: 'batter',      item: 'batter',       label: 'Batter',      day: 1 },
  { id: 'sugar',       item: 'sugar',        label: 'Brown Sugar', day: 1 },
  { id: 'kamote',      item: 'kamote',       label: 'Kamote',      day: 2 },
  { id: 'fishball',    item: 'fishball_raw', label: 'Fishball',    day: 3 },
  { id: 'kikiam',      item: 'kikiam_raw',   label: 'Kikiam',      day: 3 },
  { id: 'jug',         item: 'jug',          label: 'Palamig',     day: 4 },
  { id: 'sagogulaman', item: 'sagogulaman',  label: "Sago't Gulaman", day: 4 },
  { id: 'ice',         item: 'ice',          label: 'Yelo',        day: 4 }
];
MR.SAUCE_TRAYS = [
  { id: 'sauce_sweet',   item: 'sauce_sweet',   label: 'Sweet', day: 3 },
  { id: 'sauce_spicy',   item: 'sauce_spicy',   label: 'Spicy', day: 3 },
  { id: 'sauce_vinegar', item: 'sauce_vinegar', label: 'Suka',  day: 3 }
];

// ---- Recipe rules ---------------------------------------------------------
// Prep board (sangkalan): what may go on an empty slot, and combos.
MR.BOARD_START = { saba: 1, kamote: 1 };
MR.COMBOS = {
  'saba+langka':        'saba_langka',
  'saba_langka+wrapper':'turon_raw',
  'saba+batter':        'maruya_raw',
  'saba+sugar':         'bcue_raw',
  'kamote+sugar':       'kcue_raw',
  'fishball_cup+sauce_sweet':   'fishball_sweet',
  'fishball_cup+sauce_spicy':   'fishball_spicy',
  'fishball_cup+sauce_vinegar': 'fishball_vinegar',
  'kikiam_cup+sauce_sweet':     'kikiam_sweet',
  'kikiam_cup+sauce_spicy':     'kikiam_spicy',
  'kikiam_cup+sauce_vinegar':   'kikiam_vinegar',
  'drink1+sagogulaman': 'drink2',
  'drink2+ice':         'palamig'
};
// Kawali: raw item -> base used for drawing and cook time (seconds)
MR.FRY = {
  turon_raw:    { base: 'turon',    cook: 6 },
  maruya_raw:   { base: 'maruya',   cook: 5 },
  bcue_raw:     { base: 'bcue',     cook: 6 },
  kcue_raw:     { base: 'kcue',     cook: 7 },
  fishball_raw: { base: 'fishball', cook: 4 },
  kikiam_raw:   { base: 'kikiam',   cook: 4.5 }
};
MR.GOLDEN = 5;          // seconds an item stays perfectly cooked before burning
// Single-step stations: empty slot + fried item -> finished/next item
MR.STEP = {
  sugar:  { turon_fried: 'turon', maruya_fried: 'maruya' },
  skewer: { bcue_fried: 'bananacue', kcue_fried: 'kamotecue' },
  cups:   { fishball_fried: 'fishball_cup', kikiam_fried: 'kikiam_cup' },
  drinks: { jug: 'drink1' }
};
// Combos allowed per station (slot content + held item)
MR.STATION_COMBOS = {
  board:  ['saba+langka', 'saba_langka+wrapper', 'saba+batter', 'saba+sugar', 'kamote+sugar'],
  cups:   ['fishball_cup+sauce_sweet', 'fishball_cup+sauce_spicy', 'fishball_cup+sauce_vinegar',
           'kikiam_cup+sauce_sweet', 'kikiam_cup+sauce_spicy', 'kikiam_cup+sauce_vinegar'],
  drinks: ['drink1+sagogulaman', 'drink2+ice']
};

// Finished items that can be served
MR.FINAL = {
  bananacue: 1, turon: 1, maruya: 1, kamotecue: 1, palamig: 1,
  fishball_sweet: 1, fishball_spicy: 1, fishball_vinegar: 1,
  kikiam_sweet: 1, kikiam_spicy: 1, kikiam_vinegar: 1
};

// Where does a held item go next? Shown under the held item.
MR.HINTS = {
  saba: 'Ilagay sa Sangkalan', kamote: 'Ilagay sa Sangkalan',
  langka: 'Ipatong sa saba (Sangkalan)', wrapper: 'Ibalot ang saba + langka',
  batter: 'Isawsaw ang saba (Sangkalan)', sugar: 'Lagyan ang saba o kamote',
  saba_langka: 'Lagyan ng wrapper', turon_raw: 'Iprito sa Kawali',
  maruya_raw: 'Iprito sa Kawali', bcue_raw: 'Iprito sa Kawali', kcue_raw: 'Iprito sa Kawali',
  fishball_raw: 'Iprito sa Kawali', kikiam_raw: 'Iprito sa Kawali',
  turon_fried: 'I-roll sa Karamelo', maruya_fried: 'Budburan ng Asukal',
  bcue_fried: 'Itusok sa Stick', kcue_fried: 'Itusok sa Stick',
  fishball_fried: 'Ilagay sa Baso', kikiam_fried: 'Ilagay sa Baso',
  fishball_cup: 'Lagyan ng sauce', kikiam_cup: 'Lagyan ng sauce',
  sauce_sweet: 'Ibuhos sa baso ng fishball/kikiam', sauce_spicy: 'Ibuhos sa baso ng fishball/kikiam',
  sauce_vinegar: 'Ibuhos sa baso ng fishball/kikiam',
  jug: 'Ibuhos sa Baso ng Palamig', drink1: "Lagyan ng sago't gulaman", sagogulaman: 'Ilagay sa baso ng palamig',
  drink2: 'Lagyan ng yelo', ice: 'Ilagay sa baso ng palamig',
  burnt: 'Itapon sa Basura'
};

// ---- Customers --------------------------------------------------------------
MR.CUSTOMERS = {
  student: { name: 'Estudyante',  patience: 0.9,  speed: 230 },
  driver:  { name: 'Jeepney Driver', patience: 0.8, speed: 210 },
  tita:    { name: 'Tita',        patience: 1.0,  speed: 170 },
  worker:  { name: 'Construction Worker', patience: 0.95, speed: 200 },
  lola:    { name: 'Lola',        patience: 1.3,  speed: 120 }
};
MR.LINES = {
  order: ['Isang {f} nga po!', 'Pabili po ng {f}!', 'Kuya, {f} po!', 'Ate, isang {f}!',
          '{f} nga, ’yung mainit!', 'Pa-order po ng {f}!'],
  order2: ['{f} at {g} po!', 'Isang {f}, isang {g}!', 'Pabili: {f} + {g}!'],
  special: {
    student: ['May klase pa ako, bilis po!', 'Baon ko ’to, ha!'],
    driver:  ['Bilisan mo, boss!', 'May pasahero ako!'],
    tita:    ['Ang init! Pabili, ’day!', 'Hay, gutom na si Tita!'],
    worker:  ['Break time na!', 'Pang-meryenda, boss!'],
    lola:    ['Apo, pabili nga...', 'Dahan-dahan lang, apo.']
  },
  impatient: ['Matagal pa ba?', 'Uy, bilis-bilis!', 'Gutom na ako...', 'Asan na po?'],
  angry: ['Ang tagal naman!', 'Hay naku!', 'Grabe, ang tagal!'],
  leave: ['Alis na ’ko!', 'Sa kabila na lang!', 'Sayang oras ko!'],
  happy: ['Salamat po!', 'Sarap!', 'Ang bilis! Salamat!', 'Lodi! Salamat!', 'Babalik ako!', 'Ayos ’to!'],
  wrong: ['Hindi ’yan ang order ko!', 'Mali po ’yan!', 'Ay, hindi ’yan!']
};

// ---- Days -----------------------------------------------------------------
// goal in pesos, time in seconds, spots = max customers at the counter,
// spawn = seconds between customers [min,max], patience = base seconds, multi = chance of 2-item order
MR.DAYS = [
  { name: 'Unang Bukas',        goal: 60,  time: 90,  spots: 2, spawn: [6, 9],     patience: 28, multi: 0 },
  { name: 'Kamote Day',         goal: 90,  time: 100, spots: 3, spawn: [5.5, 8],   patience: 27, multi: 0 },
  { name: 'Fishball Fever',     goal: 120, time: 110, spots: 3, spawn: [5, 7.5],   patience: 27, multi: 0.1 },
  { name: 'Palamig Time',       goal: 160, time: 120, spots: 3, spawn: [4.5, 7],   patience: 26, multi: 0.2 },
  { name: 'Uwian ng Estudyante',goal: 200, time: 120, spots: 4, spawn: [4.5, 6.5], patience: 25, multi: 0.25 },
  { name: 'Sweldo Day',         goal: 240, time: 130, spots: 4, spawn: [4, 6],     patience: 24, multi: 0.3 },
  { name: 'Pista sa Barangay',  goal: 280, time: 130, spots: 4, spawn: [3.8, 5.8], patience: 23, multi: 0.38 },
  { name: 'Paskong Merienda',   goal: 330, time: 140, spots: 4, spawn: [3.5, 5.5], patience: 22, multi: 0.45 }
];
MR.STAR_STEPS = [1, 1.3, 1.6];   // multiples of the goal for 1, 2 and 3 stars
MR.HEARTS = 3;
MR.BURN_COST = 5;
MR.TRASH_COST = 2;

// ---- Upgrades -----------------------------------------------------------------
MR.UPGRADES = [
  { id: 'speed', name: 'Mabilis na Kawali', desc: 'Mas mabilis maluto ang prito (−15% bawat level).', costs: [60, 120, 200] },
  { id: 'slots', name: 'Dagdag na Puwesto', desc: 'Isa pang puwesto sa kawali (3 → 5).',            costs: [80, 160] },
  { id: 'pan',   name: 'Kawaling Bakal',    desc: 'Mas matagal bago masunog (+2 seg bawat level).',     costs: [50, 110] },
  { id: 'radio', name: 'Radyong OPM',       desc: 'May tugtog! Mas pasensyoso ang customers (+15%).',   costs: [70, 150] },
  { id: 'flags', name: 'Banderitas',        desc: 'Dekorasyon: +10% tip.', costs: [50],  deco: true },
  { id: 'plants',name: 'Mga Halaman',       desc: 'Dekorasyon: +10% tip.', costs: [80],  deco: true },
  { id: 'parol', name: 'Parol na Ilaw',     desc: 'Dekorasyon: +10% tip.', costs: [130], deco: true }
];
