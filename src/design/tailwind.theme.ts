/**
 * Student Wellbeing Check-in Platform — SHARED TAILWIND THEME
 * Design-final-v3 · Stage 07 Hi-Fi · the SINGLE token source the frontend imports.
 *
 * DIRECTION: "Ink & Coral" (Editorial trust) — owner-selected 2026-07-21 from a 4-way EXPLORE.
 * One platform, two faces on shared neutrals:
 *   INK   #1E2A3A  = the anchor (staff app structure: sidebar, primary buttons, headings)
 *   CORAL #FF5A5F  = the ONE warm accent (active nav, links, logo spark) AND the whole student app
 *
 * Rules (owner-locked): Inter only; editorial/high-contrast; squared 10px corners; status never
 * colour-alone; mood scale DIVERGING with a grey pivot, always labelled. NO blue anywhere.
 * DANGER is a deeper crimson than coral so "Immediate" is never confused with the brand accent.
 *
 * Usage: import into tailwind.config { theme: { extend: theme } }.
 * preview/representative.html mirrors these exact values as CSS variables for the ◆ gate.
 */

export const theme = {
  colors: {
    // ---- shared neutrals ----
    canvas:  '#F6F7F9', // staff app background
    surface: '#FFFFFF', // cards
    neutral: {
      50:  '#F7F8FA', 100: '#EEF1F6', 200: '#E5E8EC', // hairline borders (editorial)
      300: '#CBD2DD', 400: '#9AA4B2', 500: '#6B7683',
      600: '#525C6B', 700: '#3B4453', 800: '#232A35', 900: '#111823', // headings / ink text
    },

    // ---- INK (anchor · staff structure) ----
    ink: {
      DEFAULT: '#1E2A3A',
      600: '#111925', // hover / pressed
      700: '#0B121B',
      100: '#D7DBE2', // avatar bg / chart fill
      50:  '#EDEFF3', // subtle tint
    },

    // ---- CORAL (the one accent · student anchor) ----
    coral: {
      DEFAULT: '#FF5A5F',
      600: '#E8494E', // hover / student buttons
      700: '#D23B45',
      text: '#E14B54', // AA-legible coral for links/text on white
      100: '#FBD5D5', // chips / progress track
      50:  '#FFF0F0', // active-nav pill / tint
      canvas: '#FFF6F5', // warm student app tint
    },

    // ---- DIVERGING mood scale (grey pivot; always labelled; CONSTANT across directions) ----
    mood: {
      great: '#1E9E6A', good: '#74C49A', ok: '#C2C7D0', // ok = neutral pivot
      worried: '#EAB44E', sad: '#E28A4A', angry: '#D2434C',
    },

    // ---- status (icon + label + colour, never colour-alone) ----
    status: {
      danger: '#D92D3B', // Immediate / High — deeper crimson, distinct from brand coral
      warn:   '#B47512', // Triage
      ok:     '#2FB27C', // Actioned / Low
      info:   '#1E2A3A', // = ink
      dangerBg: '#FBE3E4', warnBg: '#FBF1DF', okBg: '#E6F6EF', infoBg: '#EDEFF3',
    },
  },

  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
  },
  fontSize: {
    xs:['12px',{lineHeight:'16px'}], sm:['13px',{lineHeight:'18px'}], base:['14px',{lineHeight:'20px'}],
    md:['16px',{lineHeight:'24px'}], lg:['18px',{lineHeight:'26px'}], xl:['22px',{lineHeight:'30px'}],
    '2xl':['28px',{lineHeight:'34px'}], '3xl':['34px',{lineHeight:'40px'}], // student hero (Inter-900)
  },
  // editorial: headings run heavy/tight
  fontWeight: { normal:'400', medium:'500', semibold:'600', bold:'700', extrabold:'800', black:'900' },
  letterSpacing: { tightest: '-0.03em', tighter: '-0.02em', tight: '-0.01em', normal: '0' },

  // squared, editorial corners
  borderRadius: { sm:'6px', md:'10px', lg:'12px', xl:'14px', '2xl':'18px', pill:'999px' },

  boxShadow: {
    card:  '0 1px 2px rgba(16,24,40,0.04), 0 3px 10px rgba(16,24,40,0.05)',
    pop:   '0 8px 28px rgba(16,24,40,0.12)',
    focus: '0 0 0 3px rgba(255,90,95,0.35)', // coral focus ring (both faces)
  },
  spacing: { /* 4px base — Tailwind default scale */ },
} as const;

export default theme;
