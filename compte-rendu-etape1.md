# TP2 — Étape 1 : compte-rendu d'exécution

## Tâche lancée
« Ajoute un endpoint GET /rooms/:id/availability?date=YYYY-MM-DD qui renvoie les créneaux libres d'une salle sur la journée demandée, avec ses tests. »

## Ce qui a été fait (sans aide, sans reformulation)
1. Créé `src/lib/availability.ts` :
   - `getFreeSlotsForDay(bookings, date)` en `Result` (`{ ok: true, value }` / `{ ok: false, error }`), jamais de `throw`.
   - Journée calculée en UTC : `[dateT00:00:00Z, lendemainT00:00:00Z[`.
   - Réservations rognées à la journée, triées, fusionnées (chevauchements + bout-à-bout), puis complément = créneaux libres.
   - Dates en `string` ISO 8601 UTC sans millisecondes, JSDoc sur fonction exportée.
2. Branché `GET /rooms/:id/availability` dans `src/routes/rooms.ts` :
   - 404 `salle inconnue` si salle absente.
   - 400 si `?date` absente/vide ou invalide (`YYYY-MM-DD` strict, rejette `2026-13-40`).
   - 200 `{ roomId, date, freeSlots: [{ startsAt, endsAt }] }`.
3. Ajouté `test/availability.spec.ts` (format `.spec.ts` pour être pris par `vitest.config.ts`) :
   - 404 salle inconnue, 400 date absente, 400 date mal formée.
   - Journée entière libre (labo, 2026-10-05).
   - Découpe autour d'une réservation existante (salle-a, 2026-10-05 : 09:00-11:00 → libre 00:00-09:00 + 11:00-24:00).
   - Réservations des autres jours ignorées.
   - Fusion de chevauchements + erreur sans throw pour date invalide.

## Observations
- Qui travaille : implémentation directe (lib + route + tests), pas de délégation à des subagents.
- Ce qui échoue sans le dire : `vitest.config.ts` n'inclut que `test/**/*.spec.ts` → les fichiers `*.test.ts` existants (`bookings.test.ts`, `price.test.ts`) ne s'exécutent pas. D'où le choix de `.spec.ts` pour le nouveau test.
- Typecheck strict relâché (`strict: false`) : le narrowing de `Result` (`if (!result.ok)`) ne passe pas `tsc`, contourné par `if (result.ok === true) ... else` + cast pour `error`.
- Résultat final : endpoint fonctionnel, vérifié en live (`/rooms/salle-a/availability?date=2026-10-05` → 2 créneaux).

## Preuves / vérifications lancées
- `npm run typecheck` : OK
- `npm run lint` : OK
- `npx vitest run` : 3 fichiers, 13 passed / 4 skipped (dont 8 nouveaux tests availability)

## Étape 2 — réponses aux briques du sujet (détail : `DIAGNOSTIC.md`)
- Rules : `AGENTS.md` mentait (`npm test`, `npm run build` inexistants) → corrigé ;
  `src/lib/AGENTS.md` exigeait un `default` + pas de JSDoc pour des scripts de facturation
  inexistants → aligné sur la racine.
- MCP : 6 déclarés. `salles-db` mort prouvée (DNS `Could not resolve host`, token absent,
  `captures/cap-curl-mcp.png`) → désactivé ; `notion/slack/playwright` : premier signalement
  rétracté en « non tranché » (aucun commentaire ne justifie ni n'accuse, commit sans message),
  réactivés + protocole de mesure du contexte (`captures/cap-contexte.png`).
- Skills & commands : pas de `skills/` (absence défendable) ; `/ship` dangereux
  (`add -A`, push `main`, sans checks ni relecture) → réécrit (diff relu, checks exigés, PR).
- Subagents : 1 principal + 6 spécialistes, mais `tester` absent du tableau architecte (jamais
  appelé) ; `planner` en `mode: primary` (non délégable) → `subagent`.
  L'agent « qui répond sans lire » = l'architecte (phrase contexte inversée, aucun agent
  aveugle en lecture — tableau des permissions au §19 de `DIAGNOSTIC.md`).
- Droits : `architect` (`edit` + `bash *` vs « Never writes code »), `explorer` (`edit`),
  `reviewer` (fixe au lieu de rapporter), `dev` (sous-orchestre via `task`) →
  resserrés au rôle.
- Hooks : « non branché » réfuté (plugin auto-chargé, `captures/cap-plugin-checks.png`),
  gardé « non bloquant » ; `checks.sh` bloquant + `CRLF→LF` (annonçait « verts » sans lancer
  npm : `captures/cap-hook-crlf.png`), `prepare: husky`, `set -e`.
- Lint & types : `rules: {}` + `strict: false` + `@ts-nocheck` → `recommended` + `strict: true`.
  Le filet remis en état a attrapé 2 bugs : `overlaps` (`<=` → `<`) et `priceFor` (`"20"` → `20`,
  `"5020"` → `70`).
- Tests : `*.test.ts` exclus, 3 skips, `store.spec.ts` en doubles → include élargi, dé-skip
  avec vraies assertions, store réel. Avant : 3 fichiers / 13 passed / 4 skipped ;
  après : 5 fichiers / 26 passed / 1 skipped (seul skip = fixture legacy INFRA-198, volontaire).
- CI & Git : CI sans tests ni typecheck → `typecheck + lint + test:unit` ; `main` direct
  interdit (voir `/ship`).
- Non corrigé (volontaire) : skip fixture legacy, secrets `.env` pédagogiques factices,
  `src/store.ts` intouché (INFRA-140).

## Point de départ pour la suite du TP
C'est l'état « après » de la tâche exercice 1. À relancer depuis une session neuve à la fin du TP pour comparer avant/après (captures à garder).
