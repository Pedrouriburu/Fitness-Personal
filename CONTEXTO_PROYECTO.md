# FitnessTracker PERSONAL — Contexto para Claude Code

## Qué es
Versión **100% personal, un solo usuario (Pedro)** de FitnessTracker, forkeada en septiembre de 2026 del repo comercial `albap8668-sketch/Fitness`. El proyecto comercial está **pausado, no abandonado**: su repo (`Documents\fitness-tracker`) **no se toca**.

App web PWA, archivo HTML único (`FitnessTracker.html`, ~6.140 líneas), sin frameworks ni build tools (Google Fonts, Firebase compat CDN, html5-qrcode). Persistencia en `localStorage` + sync a Firestore con sesión activa. Alojada en GitHub Pages.

- **Repo**: `albap8668-sketch/Fitness-Personal` (rama `main`) — **público** (Pages Free lo exige; y un repo privado igual publica un sitio público).
- **URL viva**: https://albap8668-sketch.github.io/Fitness-Personal/FitnessTracker.html
- **Carpeta local**: `Documents\fitness-personal`
- **Proyecto Firebase**: `fitness-tracker-b46ad` — el MISMO que la comercial (conserva todo el historial). Único uid permitido: `27kSUTAXhpg7NPO342S7XXPjwHn1`.

## Reglas que no se negocian
1. **Contenido de terceros y datos personales → Firestore, como dato del usuario. Nunca en el código.** El sitio es público. Las rutinas y los modelos de nutrición de fuentes externas (aviso legal: uso personal sí, reproducción pública no) se cargan **solo con el importador de rutinas** (Gym → ⚙️ Rutinas → Importar con IA), que las guarda en `userRoutine`/`savedRoutines` en Firestore. **No hardcodear rutinas bajo ninguna circunstancia** — por eso se eliminó `ROUTINE_BASE`.
2. La API key de Gemini vive solo en `localStorage.geminiKey` (excluida del sync y del backup). Sin backend ni Cloud Functions.
3. `firebaseConfig` sí va en el código (es público por diseño del SDK).
4. **No escribir en Firestore formas de datos que rompan la app comercial** (comparten documentos). Ej.: `profile.act` se sigue guardando aunque esta app no lo use.

## Mismo origen que la app comercial
`/Fitness/` y `/Fitness-Personal/` comparten origen `albap8668-sketch.github.io` → en desktop comparten `localStorage`, IndexedDB (photoLibrary, cache de Firestore) y sesión de Firebase Auth. En iPhone cada PWA de inicio tiene su propio almacenamiento. El SW usa caches con prefijo `fitness-personal-` y solo limpia los suyos (el de la comercial es `fitness-v6`).

## QUÉ SE ELIMINÓ respecto del original (no buscar estos módulos: ya no existen)
| Eliminado | Qué había | Qué quedó |
|---|---|---|
| `sharedFoods` | `loadSharedFoods`, `searchSharedFoods`, `addToSharedFoods`, `verifySharedFoodMacros` (moderación con Gemini), `shareCustomFood`, `_sfCache`, badge ☁️ en búsqueda, botón ☁️ en Despensa, llamadas fire-and-forget desde chat IA / búsqueda IA / código de barras | Búsqueda = `LOCAL_DB` + Despensa (`getAllFoods`). `doSearch` ya no es async. `findLocalFood` busca solo en `getAllFoods()` |
| Ranking / insignias | `updateLeaderboard`, `renderRanking`, `renderRankingList`, `setRankingMetric`, `computeRankingBadges`, `RANKING_METRICS`, colección `leaderboard/{uid}`, sección HTML en Progreso, `lastPRDate` | `currentWeekLabel()` se conserva (lo usan los insights semanales) |
| Toggle de ranking | `rankingOptIn`, `toggleRankingOptIn`, checkbox en Perfil; sacado de `SYNC_KEYS` | El campo viejo puede seguir en el doc de Firestore; se ignora |
| Mensajes comparativos | `maybeShowNudge`, `#nudge-box`, `nudgeShownDate` | — |
| Borrado de cuenta | `deleteMyAccount`, "Zona peligrosa" en Perfil | — |
| Estados vacíos con guía | Despensa vacía con explicación, Gym sin rutina con texto + botón a `openRoutineModal` (inexistente), "Registrá comidas esta semana", texto de login | Textos mínimos ("Sin alimentos", "Sin registros esta semana"); Gym sin rutina muestra solo "⚙️ Rutinas" (`openRoutineEditor`) |
| `ADMIN_UID` | Constante del admin de sharedFoods | El uid vive solo en `firestore.rules` |
| `ROUTINE_BASE` + `recoverMainRoutine` | Rutina de 5 días hardcodeada + botón "Recuperar original" | La rutina está en Firestore. "Resetear" ahora dice que borra la rutina principal |
| Selector "Actividad base" (`p-act`) | Factor multiplicador del BMR | Ver TDEE abajo |
| Onboarding | Nunca existió | — |

El **streak** (`calcStreak`/`renderStreak`) se conserva: es personal.

## Energía y macros — ÚNICA definición (bloque "ENERGÍA Y MACROS" en el JS)
- `calcTDEE(p, pasosKcal, ejercicioKcal)` = BMR (Mifflin-St Jeor) + pasos + ejercicio. **Sin factor de actividad** (antes coexistían 3 fórmulas: HOY `BMR+actividad`, Perfil `BMR×act`, planner `BMR×act+250`).
- HOY / Semana / Mes (`getDayTargets`) → actividad **registrada** del día.
- Perfil (`showMacrosResult`) y planificador (`planTargets`) → actividad **típica** (`typicalActivity()`: promedio de los últimos 28 días; si no hay ejercicio registrado, 300 kcal).
- `macroTargets(p, tdee, train)`: objetivo (déficit −400 / superávit +200), proteína, grasas 25 % de kcal, carbos = resto.
- `protTarget(p, train)`: si `profile.grasa` (% grasa, opcional) → sobre masa magra `leanMass(p)` con 2,4/2,7 g/kg; si no, sobre peso total con 2,0/2,3 g/kg (`PROT_G_KG`).
- Perfil: peso, % grasa y objetivo editables. Altura/edad/sexo en el desplegable "Datos fijos", precargados desde el `profile` de Firestore. Los defaults del código son genéricos (70 kg/170 cm/25 años) a propósito.

## Modelo de datos (sin cambios respecto de la comercial)
- `users/{uid}`: claves de `SYNC_KEYS` = `["profile","customFoods","customExercises","foodIdCounter","userRoutine","weightHistory","savedRoutines","dietConfig"]`.
- `users/{uid}/months/{YYYY-MM}`: historial particionado `{days, updatedAt}`. localStorage: `days_YYYY-MM` + índice `daysMonths`. `getDays()` / `saveDays(allDays,[fechas])`.
- `todayKey(d)` es la única fuente de fechas (hora local; nunca `toISOString` para claves).
- `mealPlans`, `weeklyInsights`, timers y `photoLibrary` (IndexedDB) son solo locales.

## Conservado intacto
Registro de comidas (entrada unificada + IA conversacional, foto de plato, etiqueta, código de barras con Open Food Facts, recetas, `photoLibrary` con dHash), gym (rutinas múltiples, DS por serie, volumen, PRs, 1RM Epley, cronómetros por timestamp, RPE, importación de rutinas por texto/foto/PDF/Excel/CSV), vistas semana/mes/año, historial de peso, `dietConfig` + meal planning, CSV, backup JSON local, auto-reparación de modelos Gemini (`geminiPost`/`_geminiAutoRepair`, serie 3.x), compresión de imágenes.

## Firestore
- Reglas (`firestore.rules`): solo `27kSUTAXhpg7NPO342S7XXPjwHn1` lee/escribe `users/{uid}/**`; todo lo demás denegado. Deploy: `firebase deploy --only firestore:rules --project fitness-tracker-b46ad`.
- ⚠️ Mismo proyecto que la comercial: estas reglas apagan `sharedFoods`/`leaderboard` y dejan sin acceso a los otros usuarios (no borra datos). Para retomar la comercial, re-deployar las reglas desde su repo.
- `backup.html`: página de solo lectura que descarga `users/{uid}` + `months` (+ `leaderboard` y `sharedFoods` propios si las reglas todavía lo permiten) como JSON. Usarla antes de cualquier cambio riesgoso.
- Auth: `signInWithPopup` (redirect falla en PWA iOS). `localhost` y `albap8668-sketch.github.io` ya son dominios autorizados.

## Service Worker / PWA
`sw.js` v1, cache `fitness-personal-v1`, network-first, base `/Fitness-Personal/`. `manifest.json` con `id`/`scope`/`start_url` en `/Fitness-Personal/`, nombre "Fitness Personal". Al cambiar assets, subir la versión del cache.

## Lo que se intentó y NO funcionó (heredado)
- Supabase: falló en Safari iOS. `signInWithRedirect`: volvía a Safari. Extraer la base de alimentos a JSON: descartado por ahora.

## División de responsabilidades
**Claude Code:** código, commits, mantener este archivo al día.
**Pedro:** `git push` (pasarle siempre el comando exacto: `cd Documents\fitness-personal` → `git push`), deploy de reglas, consola de Firebase, API key en Perfil, pruebas en iPhone real.

## Historial
`RESUMEN_SESION.md` es historia del proyecto comercial (anterior al fork).
