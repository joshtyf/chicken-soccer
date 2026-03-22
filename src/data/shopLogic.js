import { chickenDB } from './chickenDB';
import { STAT_DEFS } from './statDefs';
import { playerDB } from './playerDB';

const SHOP_STORAGE_KEY = 'daily_shop_state_v1';
const MIN_SHOP_CHICKENS = 3;
const MAX_SHOP_CHICKENS = 10;
const MIN_PRICE = 100;
const MAX_PRICE = 500;

const FIRST_NAMES = ['Clucky', 'Pecky', 'Nugget', 'Flap', 'Sunny', 'Rusty', 'Poppy', 'Comet'];
const LAST_NAMES = ['Rocket', 'Dancer', 'Feather', 'Boots', 'Spark', 'Pepper', 'Wing', 'Blaze'];

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomChoice(rng, options) {
  return options[randomInt(rng, 0, options.length - 1)];
}

function buildShopChickenName(rng) {
  return `${randomChoice(rng, FIRST_NAMES)} ${randomChoice(rng, LAST_NAMES)}`;
}

function buildRandomStats(rng) {
  const stats = {};

  for (const [key, def] of Object.entries(STAT_DEFS)) {
    stats[key] = randomInt(rng, def.min, def.max);
  }

  return stats;
}

function getScoreForPricing(stats) {
  let score = 0;

  for (const [key, def] of Object.entries(STAT_DEFS)) {
    const value = Number(stats?.[key]);
    if (!Number.isFinite(value)) continue;
    const range = Math.max(1, def.max - def.min);
    score += (value - def.min) / range;
  }

  return score;
}

function priceListingsByRelativeStrength(listings) {
  const sorted = [...listings].sort((a, b) => {
    if (a._strength === b._strength) return a.id.localeCompare(b.id);
    return a._strength - b._strength;
  });

  const pricedById = new Map();
  const maxIndex = Math.max(1, sorted.length - 1);

  sorted.forEach((listing, index) => {
    const ratio = sorted.length === 1 ? 1 : index / maxIndex;
    const price = Math.round(MIN_PRICE + (MAX_PRICE - MIN_PRICE) * ratio);
    pricedById.set(listing.id, price);
  });

  return listings.map((listing) => ({
    id: listing.id,
    generatedName: listing.generatedName,
    stats: listing.stats,
    price: pricedById.get(listing.id) || MIN_PRICE,
  }));
}

function generateDailyShop(dateKey = getDateKey()) {
  const rng = mulberry32(hashString(`shop:${dateKey}`));
  const chickenCount = randomInt(rng, MIN_SHOP_CHICKENS, MAX_SHOP_CHICKENS);

  const rawListings = Array.from({ length: chickenCount }, (_, index) => {
    const id = `${dateKey}-${index}-${Math.floor(rng() * 1e6)}`;
    const stats = buildRandomStats(rng);

    return {
      id,
      generatedName: buildShopChickenName(rng),
      stats,
      _strength: getScoreForPricing(stats),
    };
  });

  return {
    dateKey,
    listings: priceListingsByRelativeStrength(rawListings),
  };
}

export class ShopLogic {
  constructor(storageKey = SHOP_STORAGE_KEY, storage = globalThis.localStorage) {
    this.storageKey = storageKey;
    this.storage = storage;
  }

  getRawState() {
    const raw = this.storage?.getItem(this.storageKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  saveState(state) {
    this.storage?.setItem(this.storageKey, JSON.stringify(state));
  }

  getDailyShop() {
    const todayKey = getDateKey();
    const saved = this.getRawState();

    if (saved?.dateKey === todayKey && Array.isArray(saved.listings)) {
      return saved;
    }

    const generated = generateDailyShop(todayKey);
    this.saveState(generated);
    return generated;
  }

  purchaseChicken(listingId, chickenName) {
    const shop = this.getDailyShop();
    const listingIndex = shop.listings.findIndex((listing) => listing.id === listingId);

    if (listingIndex === -1) {
      return { success: false, reason: 'listing_not_found' };
    }

    const trimmedName = String(chickenName || '').trim();
    if (!trimmedName) {
      return { success: false, reason: 'missing_name' };
    }

    const listing = shop.listings[listingIndex];
    const nextBalance = playerDB.deductBalance(listing.price);

    if (nextBalance === null) {
      return { success: false, reason: 'insufficient_funds' };
    }

    chickenDB.add({
      name: trimmedName,
      stats: listing.stats,
    });

    const nextListings = shop.listings.filter((item) => item.id !== listingId);
    const nextShop = {
      ...shop,
      listings: nextListings,
    };

    this.saveState(nextShop);

    return {
      success: true,
      balance: nextBalance,
      purchased: listing,
      listings: nextListings,
    };
  }
}

export const shopLogic = new ShopLogic();
