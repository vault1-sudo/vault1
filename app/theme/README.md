# Vault1 UI Kit

Everything reused from the login page redesign, pulled out into
one shared kit so you're not redoing the theme on every screen.

## What's in here

```
theme.ts                        colors, Inter fonts, glass/motion tokens
components/GlassBackground.tsx  <AmbientGlow /> + <FloatingParticles />
components/GlassCard.tsx        the frosted panel w/ rotating light-ring
components/AnimatedField.tsx    floating-label glass input
components/AnimatedButton.tsx   primary gradient button w/ shimmer + spinner
```

## 1. Drop it in

Copy the whole `vault1-ui-kit` folder into your project, e.g.
`app/theme/` or `src/theme/` — wherever your other shared code
lives. Adjust the relative imports in each file if you move it
somewhere other than one level under your root.

Install the font package once, if you haven't already:

```
npx expo install @expo-google-fonts/inter expo-font
```

## 2. Load fonts once, globally

In your root layout (`app/_layout.tsx`), gate the whole app
behind `useAppFonts()` instead of calling it per-screen:

```tsx
import { useAppFonts } from "./theme/theme";

export default function RootLayout() {
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null; // or your splash screen
  return <Slot />;
}
```

Now every inner screen can assume Inter is ready — no more
per-page loading checks.

## 3. Converting an existing page — the pattern

For any screen, the swap is mechanical:

- Any hardcoded hex color → `COLORS.xxx` from `theme.ts`
- Any `fontWeight: "800"` → delete it, add `fontFamily: FONT.extraBold`
  (map 400→regular, 500→medium, 600→semiBold, 700→bold, 800→extraBold, 900→black)
- Page background `View` → wrap with `<AmbientGlow />` (+ `<FloatingParticles />`
  if it's a hero/auth-style screen, skip it on dense data screens — it's a lot
  of motion for a busy dashboard)
- Any card / panel / modal → wrap contents in `<GlassCard>...</GlassCard>`
  instead of a plain bordered `View`
- Any text input → replace with `<AnimatedField label="..." value={...} onChangeText={...} />`
- Any primary button → replace with `<AnimatedButton label="..." onPress={...} loading={...} />`

That's it — no logic, state, navigation, or API calls change. You're
only swapping the JSX wrapper and the leaf components; `onPress`,
`onChangeText`, `value`, validation, everything stays exactly as it
was.

## 4. Fastest way to actually get this done across "lots of pages"

I don't have access to your repo or a terminal on your machine, so
I can't sweep every file myself. Two ways to move fast from here:

- **Paste or upload 2–3 of your other screens** (dashboard, settings,
  a form page) here in the chat, and I'll convert them fully as
  worked examples — after that the pattern above should be quick
  for you or another engineer to repeat across the rest.
- If your team uses **Claude Code** (terminal, VS Code, or JetBrains),
  point it at your actual repo with this kit and the login page as
  reference — it can read every screen directly and apply the same
  swap across the whole codebase in one pass, which is the real
  "do it globally, quickly" option here.
