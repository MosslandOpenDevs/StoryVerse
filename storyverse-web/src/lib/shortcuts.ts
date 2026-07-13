"use client";

import { useCallback, useEffect, useState } from "react";

// WCAG 2.2 SC 2.1.4 (Character Key Shortcuts): single-character shortcuts must be
// switchable off. This module is the single source of truth for that setting;
// every global character-key handler consults `areShortcutsEnabled()` and the
// guide exposes a toggle via `useShortcutsEnabled()`.

export const SHORTCUTS_STORAGE_KEY = "storyverse:keyboard-shortcuts";
const SHORTCUTS_CHANGED_EVENT = "storyverse:shortcuts-changed";

export function areShortcutsEnabled(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return window.localStorage.getItem(SHORTCUTS_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setShortcutsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(SHORTCUTS_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Ignore storage failures; the in-memory event still syncs this session.
  }
  window.dispatchEvent(new Event(SHORTCUTS_CHANGED_EVENT));
}

export function useShortcutsEnabled(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(areShortcutsEnabled());
    const sync = () => setEnabled(areShortcutsEnabled());
    window.addEventListener(SHORTCUTS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SHORTCUTS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((next: boolean) => setShortcutsEnabled(next), []);
  return [enabled, update];
}
