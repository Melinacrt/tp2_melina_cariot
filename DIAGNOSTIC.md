# DIAGNOSTIC — salles-api (TP2, étape 2)

Chaque entrée : symptôme → cause (fichier) → brique du cours → preuve exécutée (+ capture) → réparation.
Les captures sont dans `captures/` (`.png` uniquement).

## 1. Rules : `AGENTS.md` ment sur les commandes
- Symptôme : `npm test` et `npm run build` n'existent pas.
- Cause : `AGENTS.md` (tableau Commandes, ex-lignes 12-13 : `npm test`, `npm run build`).
- Brique : rules.
- Preuve : `node -e "console.log(JSON.stringify(require('./package.json').scripts))"` →
  `start, dev, test:unit, lint, typecheck` (pas de `test`, pas de `build`) ; aucun commentaire
  du dépôt ne justifie ces deux lignes.
- Réparation : table corrigée vers `npm run test:unit`, `npm run lint`, `npm run typecheck`
  (build supprimé, il n'y a pas de `dist/`).

## 2. Rules : conflit AGENTS.md racine vs src/lib/AGENTS.md — tranché côté doc, ZÉRO changement de code
- Symptôme : le local exige `export default` obligatoire + « pas de JSDoc », la racine
  exige JSDoc, et aucun module de `src/lib/` n'avait de default.
- Cause : `src/lib/AGENTS.md`.
- Brique : rules.
- Audit de l'entourage avant d'accuser (commentaire, règle de chemin, prompt) :
  `grep facturation` → seules mentions = `src/lib/AGENTS.md` + commentaire `price.ts`
  (source copiée, pas consommateur) ; `ls scripts/` → seul `checks.sh` ;
  `dev.md` (« same naming, same error handling ») + code existant (JSDoc partout,
  zéro default) suivent la racine ; aucun prompt d'agent ne cite la règle locale.
  Bilan : rien ne justifie la règle locale → c'est elle qui a tort.
- Réparation doc-only : locale réécrite et alignée sur la racine. Les `export default`
  ajoutés par erreur à `overlap.ts` / `price.ts` / `validate.ts` / `availability.ts`
  ont été RETIRÉS : changer la surface des modules pour satisfaire une doc douteuse
  est un vrai changement de code, pire que le conflit. `git diff src/lib/` ne contient
  plus que le fix `overlaps` (`<`) et le fix `priceFor` (`20` + JSDoc).

## 3. MCP `salles-db` : déclaré, PROUVÉ mort
- Symptôme : URL interne injoignable + token absent → le seul MCP utile ne répond pas.
- Cause : `opencode.json` (`https://mcp.internal.salles.lan/db` + `Bearer ${SALLES_MCP_TOKEN}`).
- Brique : MCP.
- Preuves : `curl https://mcp.internal.salles.lan/db` → `Could not resolve host`
  (`captures/cap-curl-mcp.png`) ;
  `.env` et l'environnement ne contiennent pas `SALLES_MCP_TOKEN` (aucune variable
  `*MCP*`/`*GITHUB*`/`*NOTION*`/`*SLACK*`/`*SENTRY*` présente).
- Réparation : `salles-db.enabled = false` (à réactiver avec URL + token valides).

## 4. MCP notion/slack/playwright : NON TRANCHÉ (signalement précédent rétracté)
- Premier signalement (suspicion de coût) retiré des défauts : une absence dans un grep
  ne prouve rien, et l'audit n'a trouvé aucun commentaire qui tranche — ni pour ni contre :
  commit `ab57521` (« opencode: mcp notion, slack, sentry, playwright ») sans message,
  aucun prompt d'agent ni commande ne cite ces MCP.
- État du code : réactivés (`enabled: true`, retour à l'origine). Seul `salles-db`
  reste désactivé (mort prouvée, voir 3).
- Mesure statique du coût (`captures/cap-contexte.png`) : `opencode.json` = 1224 chars
  dont bloc `mcp` ~1049 (86 %) ; ~150-200 chars injectés par session et par serveur
  + un processus `npx` au premier appel d'outil.
- Protocole pour trancher : session neuve, même prompt avec puis sans ces MCP, relever
  l'indicateur de contexte OpenCode (surtout architecte : prompt 5487 o + config 1224 o)
  et le taux de réussite ; couper ceux qui ne servent jamais.
- Tranché partiel, statique (`captures/cap-mcp-cout.png`, mesures à iso-sérialisation) :
  config minifiée 771 chars (bloc mcp 613) → 484 sans notion/slack/playwright,
  soit −287 chars (−37,2 %) ; salles-db (133, mort) + notion (84) + slack (91) +
  playwright (79) = ~387/613 du bloc (63 %) pour zéro usage documenté.
  Reste non rejouable hors TUI : l'indicateur dynamique tokens/contexte avec/sans ces MCP.

## 5. Command `/ship` : livre sans filet ni relecture, pousse sur `main`
- Symptôme : `git add -A` + `commit` + `push`, « ne relance pas les checks », « ne demande pas
  de relecture », contredit `AGENTS.md` (« ne pas commiter dans main ») et l'architecte
  (« Done is not evidence », verdict `reviewer` requis).
- Cause : `.opencode/command/ship.md`.
- Brique : skills & commands.
- Preuve : `cat .opencode/command/ship.md` ; le hook censé « s'en être occupé » ne bloque
  pas (voir 11) et le lint était vide (voir 13) — démonstration, pas déduction.
- Réparation : réécrit (relire diff, checks verts exigés, branche + PR, jamais `main` en direct).
  Justification du prompt lue et réfutée par démonstration : « le hook post-écriture s'en est
  déjà occupé » est faux en pratique — le hook ne bloque pas (voir 11) et le lint était vide
  (voir 13).
- Note : aucun dossier `skills/` dans le dépôt — absence défendable pour un service de cette
  taille (une seule commande suffisait), donc non signalée comme défaut.

## 6. Architect : permissions élargies par un commit « unblock » + phrase contexte inversée
- Symptômes : `edit: allow` + `bash: "*": allow` alors que la description dit
  « Never writes code » ; phrase « If a question can be answered by a subagent, it can also
  be answered by you » (inverse de l'économie de contexte défendue juste au-dessus) ;
  `tester` absent du tableau d'équipe (jamais appelé).
- Cause : `.opencode/agent/architect.md` (frontmatter + § contrainte + tableau).
- Brique : subagents / droits.
- Preuves : `git show 865177b` (« architect: unblock, trop de refus de permission en session ») :
  avant `edit: deny` + bash limité (`git status/diff/log/branch`, `ls`), après `allow` partout.
  Le message explique le geste mais ne le justifie pas : c'est un contournement avoué du
  moindre-privilège, pas une décision d'architecture — d'où la réparation plutôt que le pardon.
  Capture : `captures/cap-gitshow-unblock.png`.
- Réparation : phrase inversée (`do not answer it yourself`), `edit: deny`,
  `bash` limité aux `git log/diff/show/status` en lecture, ligne `tester` ajoutée.

## 7. Planner non joignable : `mode: primary`
- Symptôme : le planificateur ne peut pas être délégué comme subagent.
- Cause : `.opencode/agent/planner.md`.
- Brique : subagents.
- Réparation : `mode: subagent`.

## 8. Explorer peut écrire
- Symptôme : `edit: allow` pour un agent de lecture/compréhension.
- Cause : `.opencode/agent/explorer.md`.
- Brique : droits.
- Réparation : `edit: deny`.

## 9. Reviewer : la phrase du prompt ELLE-MÊME est le défaut (arbitrage documenté)
- Symptôme : « Reviews a diff and fixes what it finds » + `edit: allow` ; or l'architecte
  fonde explicitement la valeur du reviewer sur le fait qu'il n'a pas écrit le code
  (« independence is the only reason its verdict is worth anything »).
- Cause : `.opencode/agent/reviewer.md` — la justification « round-trip is pure waste »
  existe bien dans le prompt, lue et pesée, puis écartée : deux prompts se contredisent,
  l'arbitrage va à l'architecte (l'indépendance est la propriété load-bearing ; la
  round-trip est un coût, pas une corruption).
- Brique : subagents / droits.
- Réparation : rôle « reports, never fixes », `edit: deny`.

## 10. Dev peut sous-orchestrer (justification du prompt lue et écartée)
- Symptôme : `task: allow` + consigne « split it and send the parts to other `dev` agents »,
  contourne l'architecte (« Never send two dev agents at the same files »).
- Cause : `.opencode/agent/dev.md` — le « faster than going back » existe dans le prompt,
  mais l'architecte est le seul propriétaire de la décomposition ; paralléliser des `dev`
  sur les mêmes fichiers est exactement le mode d'échec qu'il interdit.
- Brique : droits.
- Réparation : `task: deny` + consigne « stop and report how to split ».

## 11. Hooks : branché (auto-chargé, prouvé) mais non bloquant + CRLF qui cassait tout
- Suspect initial « non branché » (rien dans `opencode.json`) RÉFUTÉ : OpenCode charge
  les plugins de `.opencode/plugin/` sans déclaration (doc config : sous-dossiers
  `.opencode`, singulier en compat ascendante), et `checks.js` enregistre bien
  `tool.execute.after` sur edit/write des `.ts` en exécutant `scripts/checks.sh`
  et en collant stdout dans le retour d'outil.
- Preuves : `captures/cap-plugin-checks.png` (code du hook + exécution manuelle du script
  = exactement la sortie que l'agent voit ; typecheck + lint + tests verts, 26 passed).
  Réserve honnête : le déclenchement par le plugin n'est pas rejouable hors OpenCode —
  protocole en session neuve : éditer un `.ts` et vérifier `--- checks post-ecriture ---`
  dans le retour d'outil.
- Vrai défaut n°1 — non bloquant : `exit 0` historique (INFRA-231, défendable en usage
  consultatif : ne pas interrompre l'agent, le plugin colle déjà la sortie). Le défaut
  retenu n'est donc pas « le script est gentil » mais « aucune porte n'est bloquante ».
  Réparation : `set -e`, suppression du `exit 0` → réutilisable en porte
  (`pre-commit`, CI locale) ; le plugin garde son rôle informatif.
- Vrai défaut n°2 — CRLF, trouvaille hors liste et démontrée : `scripts/checks.sh` et
  `.husky/pre-commit` en CRLF → sous bash : `$'\r': command not found`, `set -e` rejeté,
  et le script annonçait « checks verts » SANS avoir lancé npm (`captures/cap-hook-crlf.png`).
  Réparation : convertis en LF ; re-exécutés sous Git Bash → verts réels
  (`captures/cap-plugin-checks.png`).

## 12. Git hook : husky non installé, `pre-commit` non bloquant
- Symptôme : `.husky/pre-commit` lance lint+typecheck+tests sans `set -e` (seul le dernier
  code de sortie compte) ; `husky` absent des `devDependencies`, pas de script `prepare`.
- Cause : `.husky/pre-commit`, `package.json`.
- Brique : hooks / CI & Git.
- Preuves : `cat .husky/pre-commit` ; `grep husky|prepare package.json` → vide (avant fix).
- Réparation : `set -e` en tête, `husky` en devDep + `prepare: husky`.

## 13. Lint : parser branché, zéro règle
- Symptôme : `rules: {}` → le lint passe sur tout, y compris les bugs ci-dessous.
- Cause : `eslint.config.js` (commentaire INFRA-212 « règles choisies plus tard »).
- Brique : lint & types.
- Preuve : `npx eslint src/lib/price.ts src/lib/overlap.ts` → exit 0 avant fix, malgré
  `WEEKEND_SURCHARGE = "20"` et `<=` faux (`captures/cap-eslint-avant.png` : bugs HEAD
  relus puis passés au lint d'avant `rules:{}` → silence, exit 0). Le commentaire INFRA-212 (« règles choisies plus
  tard ») est un report, pas une justification : en attendant, la CI ne faisait QUE ce lint
  vide (voir 18) → vert qui ne prouve rien.
- Réparation : `tseslint.configs.recommended` + `no-explicit-any` + `no-unused-vars`.

## 14. Types : `strict` coupé + `@ts-nocheck`
- Symptôme : `strict: false, noImplicitAny: false, strictNullChecks: false` + `// @ts-nocheck`
  en tête de `price.ts` → l'addition `number + string` passe.
- Cause : `tsconfig.json`, `src/lib/price.ts:1`.
- Brique : lint & types.
- Preuve : `npm run typecheck` vert avant fix alors que le week-end valait `"5020"`;
  `captures/cap-bugs-avant.png` (tsx direct : `"5020" string`, `overlaps` bout-à-bout `true`).
- Réparation : `strict/noImplicitAny/strictNullChecks: true`, `@ts-nocheck` supprimé,
  `WEEKEND_SURCHARGE = 20: number`, JSDoc ajoutées. Effet de bord positif : le narrowing
  `if (!result.ok)` remarche (`rooms.ts` n'a plus besoin de cast).

## 15. Bug attrapé par le filet : `overlaps` inclusif au lieu de `[début, fin[`
- Symptôme : deux créneaux bout à bout déclarés en conflit → double réservation impossible
  et disponibilités fausses.
- Cause : `src/lib/overlap.ts:11` (`a1 <= b2 && b1 <= a2`), contredit son propre commentaire.
- Brique : tests (filet) + code.
- Preuves : `npx tsx -e overlaps(09-10, 10-11)` → `true` avant, `false` après ;
  `test/bookings.test.ts` « accepte une réservation qui commence quand la précédente finit »
  ne tournait pas (voir 16), donc le bug était invisible.
- Réparation : `a1 < b2 && b1 < a2` + dé-skip des 3 tests `overlap.spec.ts` (voir 16).

## 16. Bug attrapé par le filet : tarif week-end concaténé
- Symptôme : `priceFor` week-end renvoyait `"5020"` (string) au lieu de `70` (number).
- Cause : `src/lib/price.ts` (`const WEEKEND_SURCHARGE = "20"`).
- Brique : tests (filet) + code.
- Preuve : `npx tsx -e priceFor(salle-a, 2026-10-10…)` → `"5020" string` avant, `70 number` après
  (`captures/cap-bugs-avant.png`) ;
  `test/price.test.ts` (« majoration week-end → 70 ») ne tournait pas (voir 17).
- Réparation : `20` numérique + suppression `@ts-nocheck` + types stricts.

## 17. Tests : la moitié de la suite ne s'exécute pas
- Symptôme : `vitest.config.ts` n'inclut que `test/**/*.spec.ts` → `bookings.test.ts`
  (5 tests) et `price.test.ts` (4 tests) ignorés ; `overlap.spec.ts` : 3 vrais tests en `skip` ;
  `store.spec.ts` teste des doubles locaux au lieu du store.
- Cause : `vitest.config.ts` (commentaire INFRA-205), `test/overlap.spec.ts`, `test/store.spec.ts`.
- Brique : tests.
- Preuves : `ls test/` (5 fichiers) vs `npx vitest run` avant fix (3 fichiers, 13 passed / 4 skipped ;
  `captures/cap-vitest-avant.png`) ; après fix : 5 fichiers, 26 passed / 1 skipped
  (`captures/cap-vitest-apres.png`).
- Réparation : include `*.spec.ts + *.test.ts`, dé-skip + vraies assertions (inclusion, identiques),
  `store.spec.ts` branché sur `findRoom` / `bookingsForRoom` réels. (Alternative équivalente :
  renommer `*.test.ts` en `*.spec.ts` ; l'include élargi a été préféré car non-destructif.
  L'option « supprimer les `*.test.ts` » aurait été un piège : elle efface 9 tests dont 2 qui
  attrapent des bugs réels.)
- Suite (session neuve, délégation) : 2 trous trouvés par relecture déléguée —
  réservation à cheval sur minuit (clipping `availability.ts:41-44` non prouvé) et
  journée pleine (`freeSlots == []` jamais asserté) — bouchés dans
  `test/availability.spec.ts` : suite à 28 passed / 1 skipped
  (`captures/cap-delegation.png`).

## 18. CI verte par construction : tests commentés, typecheck absent
- Symptôme : `ci.yml` ne lance que `npm run lint` (vide, voir 13) ; tests commentés
  (« ça bloquait les merges »).
- Cause : `.github/workflows/ci.yml`.
- Brique : CI & Git.
- Preuve : `cat .github/workflows/ci.yml`. Et le commentaire avoue le mécanisme : les tests
  « bloquaient » parce que le code était faux (bugs 15/16, masqués par 17) — commenter les
  tests a enterré 2 bugs réels au lieu de les fixer.
- Réparation : `npm ci` → `typecheck` → `lint` → `test:unit`.

## 19. L'agent qui « répond sans rien lire » : l'architecte (trouvaille hors liste, démontrée)
- Symptôme (sujet : « certains agents de cette chaîne sont dans un état où ils répondent
  sans avoir rien lu ») : l'orchestrateur peut boucler une tâche entière sans qu'aucun
  fichier ne soit ouvert — ni par lui, ni par un subagent.
- Audit capacitaire (frontmatters, `read`/`grep`/`glob`, outils coupés, modèle) :
  | agent | mode | modèle | read | grep | glob | coupé notable |
  |---|---|---|---|---|---|---|
  | architect | primary | pro | ✓ | ✓ | ✓ | edit (fix), bash sauf git lecture |
  | dev | subagent | pro | ✓ | ✓ | ✓ | task (fix), git push/reset/clean/rm/sudo |
  | explorer | subagent | flash | ✓ | ✓ | ✓ | edit (fix), task |
  | finder | subagent | flash | ✓ | ✓ | ✓ | edit, task, webfetch |
  | planner | subagent (fix) | pro | ✓ | ✓ | ✓ | task, edit sauf plans |
  | reviewer | subagent | pro | ✓ | ✓ | ✓ | edit (fix), task, webfetch |
  | tester | subagent | flash | ✓ | ✓ | ✓ | task, edit sauf scratch, git write/sudo |
  Verdict capacitaire : AUCUN agent n'est aveugle en lecture. Le « sans lecture » est donc
  comportemental (prompt), pas capacitaire.
- Coupable : `architect.md`. La phrase inversée (« If a question can be answered by a subagent,
  it can also be answered by you ») l'autorise à répondre depuis son propre contexte
  (vide au démarrage) au lieu de faire lire ; cumulée aux pleins pouvoirs d'avant (voir 6),
  elle permettait de coder sans délégrer une seule lecture ; cumulée à l'omission de `tester`
  au tableau d'équipe, elle garantit que personne ne lit ni n'exécute. C'est exactement
  le mode d'échec « confident, plausible garbage » que le prompt lui-même décrit
  (« An under-specified brief comes back as confident, plausible garbage ») — sauf qu'ici
  c'est l'architecte qui le produit.
- Protocole de vérification en session neuve (non rejouable hors OpenCode, à capturer) :
  prompt « où est validée la capacité d'une salle ? » (vérité : `bookings.ts:35-37` +
  `validate.ts` + `store.ts`). Trace coupable : réponse sans aucun appel `task` ni `read`.
  Trace saine : ≥1 appel `task` vers `finder`/`explorer` avec brief auto-suffisant et retour
  ancré `file:line`. Avec la phrase inversée, la trace coupable est la sortie par défaut.
- Suspect secondaire écarté : `tester`, jamais appelé (tableau architecte, voir 6) — mais
  son état est « ne tourne jamais », pas « répond sans lire ». `finder` et son cap
  « ~40 lignes puis `needs explorer` » ont été pesés et blanchis : discipline de coût
  documentée, il lit quand même des extraits pour confirmer — pas un défaut.

## 20. Hooks : réparation committée mais jamais activée dans ce clone
- Symptôme : le commit `75b7b7a` (captures relance) est passé SANS checks —
  ni lint, ni typecheck, ni tests ne se sont déclenchés.
- Cause : `prepare: husky` (`package.json:13`) ne s'était jamais exécuté dans ce clone
  (`core.hooksPath` vide, `.git/hooks/` réduit aux `.sample`, pas de `pre-commit`).
- Brique : hooks.
- Preuves : `git config core.hooksPath` → vide ; `ls .git/hooks` → que des `.sample`
  (`captures/cap-hook-precommit.png`).
- Réparation : `npx husky` → `core.hooksPath = .husky/_` (stub `_/pre-commit` → `_/h` →
  `.husky/pre-commit`) ; preuve e2e `bash .husky/_/pre-commit` → exit 0, puis commit
  `51738a7` passé avec le hook (28 passed dans la sortie du commit).
  Note : `npx husky --version` (v9.1.7) écrit `--version/_` dans `core.hooksPath` et
  bloque ensuite tous les commits (`env: unknown option`, exit 125, vu au `GIT_TRACE`) —
  ne jamais l'utiliser comme lecture de version ; réparé par `git config core.hooksPath .husky/_`.

## Pesés et blanchis (lus avant d'accuser, non retenus)
- `finder` : cap ~40 lignes + `needs explorer` = discipline de coût assumée, pas cécité.
- `tester` : `bash "*": allow` sauf git-write/sudo = cohérent pour un QA qui doit démarrer
  l'app, `curl`, observer ; `task: deny` normal pour une feuille.
- `planner` : `webfetch: allow` = a besoin de la doc pour planifier ; `dev` : `webfetch: ask` = ok.
- `reviewer` : `webfetch: deny`, `task: deny` = revue locale du diff, périmètre juste.
- Husky `prepare` + dep ajoutés : câblage manquant réel (voir 12), pas un choix.

## Volontaire — délibéré et correct, non signalé comme défaut
- `test/overlap.spec.ts` — dernier `it.skip` (export legacy `test/fixtures/legacy-bookings.json`,
  INFRA-198) : le commentaire dit que la fixture n'a jamais été versée et que réactiver
  le test le ferait échouer au chargement, pas sur une assertion. Gardé `skip`.
- `.env` — `SESSION_SECRET` / `STRIPE_SECRET_KEY` : le fichier annote
  « JEU DE DONNEES PEDAGOGIQUE, aucune valeur reelle » (`sk_test_FAKE_TEACHING_FIXTURE`) :
  pas une fuite, pas touché.
- `src/store.ts` — `AGENTS.md` « ne pas toucher, disparaît avec INFRA-140 » : respecté,
  `availability.ts` lit via `bookingsForRoom` sans modifier le store.

## Mesures
- `npx vitest run` avant : 3 fichiers, 13 passed / 4 skipped (`*.test.ts` ignorés) —
  `captures/cap-vitest-avant.png`.
- `npx vitest run` après : 5 fichiers, 26 passed / 1 skipped (seul skip restant = fixture
  legacy volontaire) — `captures/cap-vitest-apres.png`, puis 28 passed / 1 skipped
  après les 2 tests ajoutés en session neuve (minuit, journée pleine).
- Mutation testing manuel (`overlap.ts`) : mutant `<=` réintroduit → 2 failed nommés
  (bout-à-bout + réservation adjacente) ; fix `<` restauré → tout vert —
  `captures/cap-mutant.png`.
- Couverture (`npm i -D @vitest/coverage-v8@^2.1.8`, version majeure épinglée sur vitest 2
  après un échec `eresolve` avec la v3) : `npx vitest run --coverage` → **82,64 % stmts /
  87,3 % branches / 93,33 % funcs** — `captures/cap-coverage.png`. Trous restants :
  `server.ts` 0 % (1-7, bootstrap non testé — normal), `rooms.ts` 70,96 % (`GET /` et
  `GET /:id` non exercés : 8-9, 12-18), `bookings.ts` 68,25 % (erreurs 409/400 limites,
  `DELETE /:id` jamais testé : 68-75), `validate.ts` 83,33 %, `availability.ts` 92,15 %.
- Contexte consommé — statique (`captures/cap-contexte.png`) : `opencode.json` 1224 chars
  dont bloc `mcp` ~1049 (86 %) ; prompts agents de 2273 o (`finder`) à 5487 o (`architect`,
  payé à chaque tour). Dynamique (indicateur tokens/contexte du TUI OpenCode) : pas
  d'outillage dans le dépôt — protocole en session neuve : même prompt avec/sans un MCP,
  relever l'indicateur, surtout pour l'architecte (voir 4).

## Avant / Après — exercice 1 (prompt exact du sujet)
Prompt (`sujet-tp2.pdf` §1) : « Ajoute un endpoint GET /rooms/:id/availability?date=YYYY-MM-DD
qui renvoie les créneaux libres d'une salle sur la journée demandée, avec ses tests. »
- AVANT (harness malade) : `captures/cap-vitest-avant.png` (3 fichiers, 13 passed / 4 skipped ;
  `bookings` + `price` ignorés) et `captures/cap-bugs-avant.png` (`"5020"`, overlaps `true`,
  eslint exit 0).
- APRÈS (même tâche, filet réparé) : `captures/cap-vitest-apres.png` (5 fichiers, 26 passed /
  1 skip volontaire), `captures/cap-coverage.png` (82,64 % stmts), endpoint live vérifié
  (`/rooms/salle-a/availability?date=2026-10-05` → `00:00-09:00` + `11:00-24:00`),
  puis relance en session neuve : 28 passed / 1 skipped + `captures/cap-relance-apres.png`
  et `captures/cap-delegation.png` (re-vérification déléguée, 2 trous bouchés).
- Réserve honnête : MP4/GIF d'une session TUI non rejouables ici ; les `.png` sont rendus
  depuis les sorties réelles avec commande et horodatage ;
  protocole de relance en session neuve : prompt ci-dessus, comparer les deux séries.
