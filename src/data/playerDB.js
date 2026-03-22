const STORAGE_KEY = 'player_data';

function sanitizeBalance(value) {
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) return 0;
  return Math.max(0, Math.floor(asNumber));
}

export class PlayerDB {
  constructor(storageKey = STORAGE_KEY, storage = globalThis.localStorage) {
    this.storageKey = storageKey;
    this.storage = storage;
  }

  getData() {
    const raw = this.storage?.getItem(this.storageKey);
    if (!raw) return { balance: 0 };

    try {
      const parsed = JSON.parse(raw);
      return { balance: sanitizeBalance(parsed?.balance) };
    } catch {
      return { balance: 0 };
    }
  }

  setData(data) {
    const safeData = { balance: sanitizeBalance(data?.balance) };
    this.storage?.setItem(this.storageKey, JSON.stringify(safeData));
    return safeData;
  }

  getBalance() {
    return this.getData().balance;
  }

  addBalance(amount) {
    const nextBalance = this.getBalance() + sanitizeBalance(amount);
    this.setData({ balance: nextBalance });
    return nextBalance;
  }

  deductBalance(amount) {
    const deduction = sanitizeBalance(amount);
    const currentBalance = this.getBalance();
    if (currentBalance < deduction) return null;

    const nextBalance = currentBalance - deduction;
    this.setData({ balance: nextBalance });
    return nextBalance;
  }
}

export const playerDB = new PlayerDB();
