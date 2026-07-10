// ─────────────────────────────────────────────────────
// ThemeStore — Reactive Zustand-style theme state
// ─────────────────────────────────────────────────────

import { createStore } from '@termuijs/store';
import { ThemeProvider } from './themeProvider.js';
import { getNamedTheme } from './named-themes.js';
import type { ThemeTokens } from './tokens.js';

export interface ThemeStoreState {
    theme: ThemeTokens;
    activeThemeName: string;
    setActiveTheme: (theme: string | ThemeTokens) => void;
}

const baseStore = createStore<ThemeStoreState>((set) => {
    // Sync with the underlying imperative ThemeProvider
    ThemeProvider.subscribe((newTheme) => {
        set({ theme: newTheme });
    });

    return {
        theme: ThemeProvider.getTheme(),
        activeThemeName: 'defaultDark',
        setActiveTheme: (themeInput: string | ThemeTokens) => {
            let nextTheme: ThemeTokens;
            let name = 'custom';

            if (typeof themeInput === 'string') {
                nextTheme = getNamedTheme(themeInput);
                name = themeInput;
            } else {
                nextTheme = themeInput;
            }

            set({ activeThemeName: name, theme: nextTheme });
            // This triggers the global listeners bound in components
            ThemeProvider.setTheme(nextTheme);
        }
    };
});

/**
 * A reactive store for the currently active theme.
 * Allows switching the theme at runtime, which automatically updates the underlying
 * ThemeProvider, triggering global re-renders for styles using TSS variables.
 */
export const themeStore = Object.assign(baseStore, {
    setActiveTheme: (themeInput: string | ThemeTokens) => {
        baseStore.getState().setActiveTheme(themeInput);
    }
});
