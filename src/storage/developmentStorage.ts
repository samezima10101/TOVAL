import type { StorageLike } from "./appStateRepository";
import { DEBUG_ENABLED } from "@/src/config/environment";

// Manual acceptance controls, installed only in development/internal builds. Nothing is
// injected until the developer explicitly calls a control from DevTools.
export type StorageDebug = {
  failNextWrites: (count?: number) => void;
  holdNextWrite: () => void;
  releaseWrite: () => void;
  readRaw: () => Promise<string | null>;
  readBackups: () => Promise<{ key: string; raw: string | null }[]>;
  replaceRaw: (raw: string) => Promise<string | null>;
};

const controls = new Map<string, StorageDebug>();

export function getStorageDebug(key: string): StorageDebug | undefined {
  return DEBUG_ENABLED ? controls.get(key) : undefined;
}

export function developmentStorage(
  storage: StorageLike & { getAllKeys?: () => Promise<readonly string[]> },
  key: string,
): StorageLike {
  if (!DEBUG_ENABLED) return storage;
  let failures = 0;
  let hold = false;
  let replacementLocked = false;
  let release: (() => void) | undefined;
  const normal = key === "@my-june/app-state-v1";
  const recoveryPrefix = normal ? "@my-june/recovery/" : `${key}/recovery/`;
  const backupPrefix = normal ? "@my-june/manual-backup/" : `${key}/manual-backup/`;
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
      return Promise.all(keys.filter((itemKey) => itemKey.startsWith(recoveryPrefix) || itemKey.startsWith(backupPrefix))
        .map(async (itemKey) => ({ key: itemKey, raw: await storage.getItem(itemKey) })));
    },
    async replaceRaw(raw) {
      // Developer replacement also retains the prior bytes. Use a dedicated
      // simulator/device: the fixtures intentionally replace the active data.
      const previous = await storage.getItem(key);
      const backupKey = previous === null ? null : `${backupPrefix}${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (backupKey !== null && previous !== null) {
        await storage.setItem(backupKey, previous);
        if (await storage.getItem(backupKey) !== previous) throw new Error("Backup verification failed");
      }
      replacementLocked = true;
      await storage.setItem(key, raw);
      return backupKey;
    },
  };
  controls.set(key, debug);
  if (normal) {
    (globalThis as typeof globalThis & { __MY_JUNE_STORAGE_DEBUG__?: StorageDebug })
      .__MY_JUNE_STORAGE_DEBUG__ = debug;
  } else {
    (globalThis as typeof globalThis & { __MY_JUNE_TEST_STORAGE_DEBUG__?: StorageDebug })
      .__MY_JUNE_TEST_STORAGE_DEBUG__ = debug;
  }
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
