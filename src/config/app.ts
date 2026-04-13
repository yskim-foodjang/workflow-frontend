/**
 * Central app configuration.
 * All app-wide constants (name, colors, meta) live here
 * so a single edit propagates everywhere — including the future PWA manifest.
 */

export const APP_NAME = 'WorkFlow';
export const APP_DESCRIPTION = '스케줄 & 아젠다 관리';
export const APP_TAGLINE = `${APP_NAME} - ${APP_DESCRIPTION}`;

/**
 * Primary brand color (Indigo 600).
 * Tailwind `primary-*` shades are generated from this in tailwind.config.js.
 * Use this constant only where raw hex is needed (e.g. <meta theme-color>, manifest, FullCalendar).
 */
export const BRAND_COLOR = '#4F46E5';

export const BRAND_PALETTE = {
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#6366F1',
  600: '#4F46E5',   // ← primary
  700: '#4338CA',
  800: '#3730A3',
  900: '#312E81',
} as const;
