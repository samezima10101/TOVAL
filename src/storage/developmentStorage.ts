import type { StorageLike } from "./appStateRepository";

// Manual acceptance controls, installed only in development builds. Nothing is
// injected until the developer explicitly calls a control from DevTools.
type StorageDebug = {
  failNextWrites: (count?: number) => void;
  holdNextWrite: () => void;
  releaseWrite: () => void;
  readRaw: () => Promise<string | null>;
  readBackups: () => Promise<{ key: string; raw: string | null }[]>;
  replaceRaw: (raw: string) => Promise<string | null>;
};

export function developmentStorage(
  storage: StorageLike & { getAllKeys?: () => Promise<readonly string[]> },
  key: string,
): StorageLike {
  if (!__DEV__) return storage;
  let failures = 0;
  let hold = false;
  let replacementLocked = false;
  let release: (() => void) | undefined;
  const debug: StorageDebug = {
    failNextWrites(count = 1) {
      if (!Number.isSafeInteger(count) || count < 0) throw new Error("count must be a non-negative integer");
      failures = count;
    },
    holdNextWrite() { hold = true; },
    releaseWrite() { release?.(); release = undefined; hold = false; },
    readRaw: () => storage.getItem(key),
    async readBackups() {
      const keys = await storage.getAllKeys?.() ?? [];
      return Promise.all(keys.filter((itemKey) => itemKey.startsWith("@my-june/recovery/") || itemKey.startsWith("@my-june/manual-backup/"))
        .map(async (itemKey) => ({ key: itemKey, raw: await storage.getItem(itemKey) })));
    },
    async replaceRaw(raw) {
      // Developer replacement also retains the prior bytes. Use a dedicated
      // simulator/device: the fixtures intentionally replace the active data.
      const previous = await storage.getItem(key);
      const backupKey = previous === null ? null : `@my-june/manual-backup/${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (backupKey !== null && previous !== null) {
        await storage.setItem(backupKey, previous);
        if (await storage.getItem(backupKey) !== previous) throw new Error("Backup verification failed");
      }
      replacementLocked = true;
      await storage.setItem(key, raw);
      return backupKey;
    },
  };
  (globalThis as typeof globalThis & { __MY_JUNE_STORAGE_DEBUG__?: StorageDebug })
    .__MY_JUNE_STORAGE_DEBUG__ = debug;
  return {
    getItem: (itemKey) => storage.getItem(itemKey),
    async setItem(itemKey, raw) {
      if (hold) {
        hold = false;
        await new Promise<void>((resolve) => { release = resolve; });
      }
      if (replacementLocked) throw new Error("Manual acceptance: reload JavaScript after replacing data");
      if (failures > 0) {
        failures -= 1;
        throw new Error("Manual acceptance: storage write failure");
      }
      await storage.setItem(itemKey, raw);
    },
  };
}
