# Design

Acid, blunt, honest. Landing is loud (brand register); the app inside is calm enough to work in (product register) but speaks the same language: Archivo wide display type, ink on paper, acid as the one loud color, leak red for money going out.

## Color (tokens in `src/app/globals.css`, Tailwind names in backticks)

| Role | Token | Use |
|---|---|---|
| Paper | `bg-paper` / `bg-background` | Page background. Never pure white. |
| Paper 2 | `bg-paper-2` | Quiet fills, empty states, table header. |
| Card | `bg-card` | Raised surfaces (with `border` hairline, no shadow). |
| Ink | `text-ink` / `bg-ink` | Text, primary buttons, inverted panels. |
| Ink soft | `text-ink-soft` | Secondary text. Never lighter than this for text. |
| Acid | `bg-acid` | The loud color. Active states, highlights, hero drench, focus ring on inputs. Text on acid is always ink. Never acid text on paper (fails contrast); acid text only on ink. |
| Leak | `text-leak` (on ink only) / `text-leak-deep` (on paper) / `bg-leak-deep` | Money leaving, overdue, destructive, cancel. Pair with a label or sign, never color alone. |

No `#fff`, `#000`, `slate-*`, `gray-*`, `bg-white`, or hex colors. No gradients. No shadows except none; separate with hairline `border` (ink at 14%) or a fill change.

## Typography

One family: Archivo (variable, `wdth` + `wght`), loaded in `layout.tsx` as `font-sans`.

- `display` utility: wide (wdth 125), weight 850, tracking -0.045em, line-height 0.88. Page titles and big numbers. App page title size: `text-[clamp(2.25rem,5vw,3.5rem)]`.
- `font-wide` + `font-extrabold tracking-[-0.03em]`: section headings (h2) inside the app, `text-xl`–`text-2xl`.
- `eyebrow` utility: 12px, 600, uppercase, tracked. Labels above titles and over stats.
- Body: 16px, `leading-relaxed`, `text-ink-soft` for secondary.
- Money and dates: always `tabular-nums`. Big money: `display` + `tabular-nums`.

## Shape & layout

- Radius: cards/panels `rounded-xl`; inputs `rounded-md`; buttons and pills `rounded-full`.
- Borders: `border` (hairline) on cards; `border-[1.5px] border-ink` for emphasized/interactive surfaces.
- Container is provided by the protected layout (`max-w-6xl`, padding). Don't add another.
- Page header pattern: left-aligned `eyebrow` + `display` title, primary action right-aligned on desktop, below on mobile. No centered stacks.
- Prefer lists/rows with dividers (`divide-y divide-ink/10`) over grids of cards. Never nest cards. Don't use the "hero metric" template (big number + small label in three identical cards): give one number dominance, others smaller.

## Components (`src/components/ui`)

- `Button` variants: `default` (ink → acid on hover), `acid`, `outline` (ink 1.5px), `secondary`, `ghost`, `destructive` (leak-deep), `link`. Sizes `sm | default | lg | icon`.
- `Input`: h-11, 1.5px border, focus = ink border + acid ring. Native `<select>`/`<textarea>` must copy the Input classes.
- `Label`: 13px semibold.
- Status pill: `rounded-full px-2.5 py-0.5 text-xs font-bold`; active = `bg-acid text-ink`, inactive/cancelled = `bg-paper-2 text-ink-soft`, overdue/failed = `bg-leak-deep text-paper`.
- Loading: `Loader2` from lucide with `animate-spin text-ink`, or skeleton rows `bg-ink/[0.06] rounded-md animate-pulse`.
- Errors: inline text `text-leak-deep text-sm font-medium` with an icon or "Error:" prefix; error panel `rounded-xl border-[1.5px] border-leak-deep bg-leak-deep/5 p-4`. No side-stripe borders.

## Motion (GSAP, `src/lib/gsap.ts`)

- Import from `@/lib/gsap` only (registers ScrollTrigger, SplitText, useGSAP; default ease `expo.out`).
- Page entrance: put `data-reveal` on the top-level blocks of a page (header, then each section/row group, max ~8 per page) and call `useStaggerReveal(rootRef, [isLoading])` from the page. Every page using `data-reveal` MUST call the hook, otherwise those elements stay hidden.
- Money count-up allowed on the main dashboard total (gsap tween of a number, inside `gsap.matchMedia().add(MOTION_OK, ...)`).
- All motion goes through `MOTION_OK` matchMedia. No bounce/elastic. Don't animate layout properties (width/height/top); use transforms, opacity, clip-path, scaleX.
- Hover transitions: CSS `transition-colors duration-300`.

## Copy

Blunt, short, friendly. No em dashes. No invented stats or social proof. Buttons say the action ("Add subscription", "Save changes", "Cancel plan").
