# ADR 0009: A tiny i18n dictionary

**Status:** accepted. **Decider:** Ramansh.

## Context
The reference site supports English, Kannada and Hindi. Voice input must also use the chosen language.

## Decision
- `apps/web/src/lib/i18n.tsx` holds one typed dictionary per language and a `useI18n()` hook returning `t(key, vars?)`.
- English is the source of truth. Kannada and Hindi are typed `Record<Key, string>`, so **TypeScript fails the build if a key is missing** in any language.
- The chosen language is saved in `localStorage`, sets `<html lang>`, and selects the speech-recognition locale (`en-IN`, `kn-IN`, `hi-IN`).
- Categories, statuses and priorities are translated by key (`cat.road`, `status.resolved`, ...).

## Why
- Three languages and ~80 strings do not justify an i18n library, its plural/ICU machinery, or code-splitting.
- Compile-time key checking gives the main benefit of a library (no missing translations) for free.

## Alternatives rejected
- **i18next / react-intl:** extra dependency and setup for little gain at this size.
- **Translating by fetching JSON files at runtime:** needs loading states and can fail offline.

## Consequences
- Not every string is translated yet (admin, staff, sign-in, detail page, assistant, info pages). That is backlog item J4; add new keys to all three languages.
- Translations were machine-assisted and should be reviewed by a native speaker before a public launch.
- If we add many more languages or plural-heavy text, revisit with a new ADR.
