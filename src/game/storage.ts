import type { GameState } from "@/game/types";
import { STATE_VERSION } from "@/game/state";

const STORAGE_KEY = "kpopProducerSim.save";

type SavedEnvelopeV1 = {
  version: number;
  savedAt: number;
  state: GameState;
};

function migrate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const anyRaw = raw as Partial<SavedEnvelopeV1>;
  if (typeof anyRaw.version !== "number") return null;
  if (anyRaw.version !== STATE_VERSION) {
    // Future: transform older versions forward.
    return null;
  }
  if (!anyRaw.state || typeof anyRaw.state !== "object") return null;
  return anyRaw.state as GameState;
}

export function loadGame(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

let saveTimer: number | null = null;
let pending: GameState | null = null;

function flush() {
  if (typeof window === "undefined") return;
  if (!pending) return;
  const env: SavedEnvelopeV1 = {
    version: STATE_VERSION,
    savedAt: Date.now(),
    state: pending,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(env));
  pending = null;
  saveTimer = null;
}

export function saveGame(state: GameState, opts?: { immediate?: boolean }) {
  if (typeof window === "undefined") return;
  pending = state;
  if (opts?.immediate) {
    if (saveTimer) window.clearTimeout(saveTimer);
    flush();
    return;
  }

  if (saveTimer) return;
  saveTimer = window.setTimeout(flush, 300);
}

export function resetGame(opts?: { keepRoute?: boolean }) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  if (!opts?.keepRoute) window.location.href = "/";
}

