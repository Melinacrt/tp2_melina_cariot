# Conventions locales — src/lib/

Ces modules sont consommes par les routes.

- Mêmes conventions que la racine : exports nommés, **JSDoc obligatoire**
  sur toute fonction exportée, erreurs en `Result`, dates en `string` ISO 8601 UTC.
- Les fonctions de ce dossier sont pures. Aucun acces reseau, aucun acces disque.
