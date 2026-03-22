import { createChicken, generateStarterChicken, normalizeChickenRecord } from './chickenModel';

const STORAGE_KEY = 'chicken_collection';

function parseJsonl(jsonlText) {
  if (!jsonlText || !jsonlText.trim()) return [];

  return jsonlText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function serializeJsonl(records) {
  return records.map((record) => JSON.stringify(record)).join('\n');
}

export class ChickenDB {
  constructor(storageKey = STORAGE_KEY, storage = globalThis.localStorage) {
    this.storageKey = storageKey;
    this.storage = storage;
  }

  getAll() {
    const raw = this.storage?.getItem(this.storageKey) || '';

    try {
      return parseJsonl(raw).map(normalizeChickenRecord);
    } catch {
      return [];
    }
  }

  getById(id) {
    return this.getAll().find((chicken) => chicken.id === id) || null;
  }

  setAll(records) {
    this.storage?.setItem(this.storageKey, serializeJsonl(records));
  }

  add(chickenInput) {
    const chicken = chickenInput?.id
      ? normalizeChickenRecord(chickenInput)
      : createChicken(chickenInput);
    const records = this.getAll();
    records.push(chicken);
    this.setAll(records);
    return chicken;
  }

  update(id, changes) {
    const records = this.getAll();
    const index = records.findIndex((record) => record.id === id);
    if (index === -1) return null;

    const updated = normalizeChickenRecord({
      ...records[index],
      ...changes,
      stats: {
        ...records[index].stats,
        ...(changes?.stats || {}),
      },
    });

    records[index] = updated;
    this.setAll(records);
    return updated;
  }

  remove(id) {
    const records = this.getAll();
    const nextRecords = records.filter((record) => record.id !== id);
    if (nextRecords.length === records.length) return false;
    this.setAll(nextRecords);
    return true;
  }

  init() {
    const existing = this.getAll();
    if (existing.length > 0) return existing;

    const starter = generateStarterChicken();
    this.setAll([starter]);
    return [starter];
  }
}

export const chickenDB = new ChickenDB();
