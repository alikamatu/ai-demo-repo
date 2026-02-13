/**
 * Zustand store for global app state.
 */

import { create } from 'zustand';

interface AppState {
  /** Current user ID (hardcoded for demo). */
  userId: number;

  /** Whether API connection is established. */
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
}

const useAppStore = create<AppState>((set) => ({
  userId: 1,
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),
}));

export default useAppStore;
