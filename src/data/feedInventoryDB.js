const STORAGE_KEY = 'feed_inventory_v1';

function sanitizeCount(value) {
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) return 0;
  return Math.max(0, Math.floor(asNumber));
}

function sanitizeInventory(data) {
  return {
    slowness: sanitizeCount(data?.slowness),
  };
}

export class FeedInventoryDB {
  constructor(storageKey = STORAGE_KEY, storage = globalThis.localStorage) {
    this.storageKey = storageKey;
    this.storage = storage;
  }

  getData() {
    const raw = this.storage?.getItem(this.storageKey);
    if (!raw) return sanitizeInventory();

    try {
      const parsed = JSON.parse(raw);
      return sanitizeInventory(parsed);
    } catch {
      return sanitizeInventory();
    }
  }

  setData(data) {
    const safeData = sanitizeInventory(data);
    this.storage?.setItem(this.storageKey, JSON.stringify(safeData));
    return safeData;
  }

  getCount(feedKey) {
    const data = this.getData();
    return sanitizeCount(data?.[feedKey]);
  }

  addCount(feedKey, amount = 1) {
    const addition = sanitizeCount(amount);
    const data = this.getData();
    const nextCount = sanitizeCount(data?.[feedKey]) + addition;
    const nextData = {
      ...data,
      [feedKey]: nextCount,
    };
    this.setData(nextData);
    return nextCount;
  }

  deductCount(feedKey, amount = 1) {
    const deduction = sanitizeCount(amount);
    if (deduction <= 0) return true;

    const data = this.getData();
    const currentCount = sanitizeCount(data?.[feedKey]);
    if (currentCount < deduction) return false;

    const nextData = {
      ...data,
      [feedKey]: currentCount - deduction,
    };

    this.setData(nextData);
    return true;
  }
}

export const feedInventoryDB = new FeedInventoryDB();