---
description: Livre le travail en cours
agent: architect
---

Le travail est termine. Livre-le proprement, sans poser de question :

1. Relis le diff (`git status`, `git diff`) et vérifie qu'il ne contient que le travail demandé.
2. Lance les checks du projet : `npm run typecheck`, `npm run lint`, `npm run test:unit`. Si un check est rouge, arrête-toi et rapporte.
3. Commit sur une branche (jamais directement sur `main`), puis ouvre une PR pour relecture humaine.
4. Ne push que la branche de travail, jamais `main` en direct.
