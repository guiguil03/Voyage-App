# Design — Génération d'itinéraire IA avec streaming SSE

Date: 2026-06-10

## Contexte

Voyage-App génère actuellement un itinéraire en récupérant des lieux via OpenTripMap et en les distribuant bêtement à raison de 5 par jour. L'objectif est de remplacer cette logique par Claude (Anthropic) qui génère un vrai planning jour par jour adapté aux préférences de l'utilisateur, avec un affichage progressif via streaming SSE.

## Architecture

```
plan-trip.tsx
    │
    │ { destination, dates, travelType, interests, activityLevel }
    ▼
Supabase Edge Function (generate-itinerary)
    │  ── ANTHROPIC_API_KEY ──► Claude API (claude-haiku-4-5, streaming)
    │
    │  Server-Sent Events — un event JSON par jour
    ▼
useItineraryStream hook (React Native)
    │  accumule les jours au fur et à mesure
    ▼
planning.tsx — rendu progressif
    │  sauvegarde dans Supabase via saveGeneratedItinerary()
```

## Format de données

### Input (app → Edge Function)

```json
{
  "destination": "Tokyo",
  "startDate": "2026-07-10",
  "endDate": "2026-07-14",
  "travelType": "Couple",
  "interests": ["Culture", "Gastronomie"],
  "activityLevel": "Balanced"
}
```

### Output Claude — un objet JSON par jour, séparés par `\n---\n`

```json
{
  "day": 1,
  "date": "2026-07-10",
  "theme": "Immersion dans le Tokyo traditionnel",
  "intro": "Commencez votre séjour par le quartier d'Asakusa...",
  "activities": [
    {
      "name": "Temple Senso-ji",
      "time": "09h00 - 11h00",
      "description": "Le plus ancien temple de Tokyo, fondé en 628...",
      "category": "Culture",
      "tips": "Arrivez tôt pour éviter la foule"
    }
  ]
}
```

### Events SSE (Edge Function → app)

```
data: {"day":1,"date":"...","theme":"...","intro":"...","activities":[...]}

data: {"day":2,...}

data: [DONE]
```

## Fichiers

### Créer

| Fichier | Rôle |
|---|---|
| `supabase/functions/generate-itinerary/index.ts` | Edge Function Deno — appelle Claude, pipe SSE |
| `features/trips/services/itinerary-stream.ts` | Client SSE côté app via XMLHttpRequest |
| `features/trips/hooks/useItineraryStream.ts` | Hook React — état progressif des jours |

### Modifier

| Fichier | Changement |
|---|---|
| `app/plan-trip.tsx` | Remplace l'appel OpenTripMap par `useItineraryStream`, navigue vers `/planning` en passant les jours accumulés |
| `app/planning.tsx` | Accepte le nouveau format `ItineraryDay[]`, affiche indicateur "en cours..." si génération pas finie |

## Prompt système Claude

```
Tu es un expert en planification de voyages. Génère un itinéraire complet jour par jour.

Règles strictes :
- Pour chaque jour, output UN seul objet JSON valide sur une seule ligne
- Sépare chaque jour par exactement "\n---\n"
- Réponds uniquement en français
- Adapte le rythme selon activityLevel : Relax = 2-3 activités/jour, Balanced = 4-5, Intense = 6-7
- Adapte les activités aux interests fournis
- Inclus des tips pratiques pour chaque activité
- Ne génère rien d'autre que les objets JSON et les séparateurs

Format exact de chaque jour :
{"day":N,"date":"YYYY-MM-DD","theme":"...","intro":"...","activities":[{"name":"...","time":"HHhMM - HHhMM","description":"...","category":"...","tips":"..."}]}
```

## Gestion d'erreurs

| Scénario | Comportement |
|---|---|
| Timeout 30s | Afficher les jours déjà reçus + message "Génération interrompue" |
| JSON invalide sur un jour | Logger l'erreur, ignorer ce jour, continuer |
| Edge Function error (5xx) | Alert utilisateur "Erreur de génération, réessayer" |
| Claude refuse (refusal) | Alert "Destination non supportée" |
| Pas de connexion | Alert avant d'appeler |

## État de chargement (UX)

La progression s'affiche dans `plan-trip.tsx` pendant la génération :

```
[Spinner] Claude prépare ton voyage...
✅ Jour 1 — Tokyo traditionnel
✅ Jour 2 — Modernité et gastronomie  
⏳ Jour 3 en cours...
```

La navigation vers `/planning` se fait **une seule fois**, quand l'event `[DONE]` est reçu (tous les jours générés). On passe le tableau complet `ItineraryDay[]` en params de navigation.

## Choix techniques

- **Modèle** : `claude-haiku-4-5` — suffisant pour la génération d'itinéraires, coût ~$0.001/appel
- **SSE côté app** : `react-native-sse` (lib légère dédiée, fonctionne sur iOS et Android, évite le parsing SSE manuel)
- **Pas de streaming token par token** : on stream par jour entier (plus simple à parser, meilleure UX)
- **Sauvegarde Supabase** : `saveGeneratedItinerary()` appelée une fois que tous les jours sont reçus (event `[DONE]`)
- **Clé API** : stockée uniquement dans les secrets Supabase, jamais dans l'app

## Variables d'environnement

```bash
# Supabase Edge Function secrets
ANTHROPIC_API_KEY=sk-ant-...
```
