# LLM Itinerary Streaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the naive OpenTripMap dump with Claude-generated itineraries, streamed day by day via SSE from a Supabase Edge Function.

**Architecture:** A Supabase Edge Function calls the Claude API (`claude-haiku-4-5`) with streaming, emitting one SSE event per itinerary day. The React Native app uses `react-native-sse` to receive days progressively and displays them one by one in an overlay. Navigation to `planning.tsx` happens once all days are received.

**Tech Stack:** Deno (Supabase Edge Functions), `npm:@anthropic-ai/sdk` (Deno import), `react-native-sse`, Supabase CLI

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `features/trips/types/itinerary.ts` | Create | Shared TypeScript types for itinerary data |
| `supabase/functions/generate-itinerary/index.ts` | Create | Edge Function: Claude streaming → SSE output |
| `features/trips/services/itinerary-stream.ts` | Create | SSE client using react-native-sse |
| `features/trips/hooks/useItineraryStream.ts` | Create | React state management for streaming days |
| `app/plan-trip.tsx` | Modify | Replace generate logic + add progress overlay |
| `app/planning.tsx` | Modify | Render new `ItineraryDay[]` format |

---

## Task 1: Install dependency + create shared types

**Files:**
- Create: `features/trips/types/itinerary.ts`

- [ ] **Step 1: Install react-native-sse**

```bash
npx expo install react-native-sse
```

Expected: package added, no peer dependency errors.

- [ ] **Step 2: Create shared types**

Create `features/trips/types/itinerary.ts`:

```typescript
export interface ItineraryActivity {
  name: string;
  time: string;
  description: string;
  category: string;
  tips: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  intro: string;
  activities: ItineraryActivity[];
}

export interface TripPreferences {
  destination: string;
  startDate: string | null;
  endDate: string | null;
  travelType: 'Solo' | 'Couple' | 'Family' | 'Group';
  interests: string[];
  activityLevel: 'Relax' | 'Balanced' | 'Intense';
}
```

- [ ] **Step 3: Commit**

```bash
git add features/trips/types/itinerary.ts
git commit -m "feat: add shared itinerary types"
```

---

## Task 2: Supabase Edge Function

**Files:**
- Create: `supabase/functions/generate-itinerary/index.ts`

- [ ] **Step 1: Install Supabase CLI and link the project**

```bash
npx supabase --version
```

If not found, install globally:
```bash
npm install -g supabase
```

Login and link to the existing project (ref: `kyvjacabosaakbctblqh`):
```bash
npx supabase login
npx supabase link --project-ref kyvjacabosaakbctblqh
```

- [ ] **Step 2: Create Edge Function file**

Create `supabase/functions/generate-itinerary/index.ts`:

```typescript
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { destination, startDate, endDate, travelType, interests, activityLevel } =
    await req.json();

  const nbDays =
    startDate && endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 3;

  const activitiesPerDay =
    activityLevel === "Relax" ? "2-3" : activityLevel === "Intense" ? "6-7" : "4-5";

  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = "";

      const stream = await client.messages.stream({
        model: "claude-haiku-4-5",
        max_tokens: 8192,
        system: `Tu es un expert en planification de voyages. Génère un itinéraire de ${nbDays} jours pour ${destination}.

Règles STRICTES:
- Output UN objet JSON valide par jour, sur UNE seule ligne, sans espaces superflus
- Sépare chaque jour par exactement "\\n---\\n"
- Réponds UNIQUEMENT en français
- ${activitiesPerDay} activités par jour (rythme: ${activityLevel})
- Centres d'intérêt: ${interests.join(", ")}
- Type de voyage: ${travelType}
- Ne génère rien d'autre que les JSON et les séparateurs

Format exact de chaque ligne:
{"day":N,"date":"YYYY-MM-DD","theme":"...","intro":"...","activities":[{"name":"...","time":"HHhMM - HHhMM","description":"...","category":"...","tips":"..."}]}`,
        messages: [
          {
            role: "user",
            content: `Génère l'itinéraire complet pour ${destination}${
              startDate ? ` du ${startDate} au ${endDate}` : ` sur ${nbDays} jours`
            }.`,
          },
        ],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          buffer += chunk.delta.text;

          const parts = buffer.split("\n---\n");
          for (let i = 0; i < parts.length - 1; i++) {
            const dayJson = parts[i].trim();
            if (!dayJson) continue;
            try {
              JSON.parse(dayJson);
              controller.enqueue(encoder.encode(`data: ${dayJson}\n\n`));
            } catch {
              // invalid JSON fragment, skip
            }
          }
          buffer = parts[parts.length - 1];
        }
      }

      // Flush last day if no trailing separator
      const remaining = buffer.trim();
      if (remaining) {
        try {
          JSON.parse(remaining);
          controller.enqueue(encoder.encode(`data: ${remaining}\n\n`));
        } catch {
          // skip invalid
        }
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
```

- [ ] **Step 3: Set the Anthropic API key as Supabase secret**

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```

- [ ] **Step 4: Deploy the Edge Function**

```bash
npx supabase functions deploy generate-itinerary --no-verify-jwt
```

`--no-verify-jwt` allows the anon key (not a user JWT) to call this function.

Expected output:
```
Deployed Functions generate-itinerary
```

- [ ] **Step 5: Test with curl**

```bash
curl -X POST https://kyvjacabosaakbctblqh.supabase.co/functions/v1/generate-itinerary \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dmphY2Fib3NhYWtiY3RibHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjkxOTQsImV4cCI6MjA5NjYwNTE5NH0.bJUVEO_ADKD7qLWmk-8AJibWXnCOH08gJsxq7rfJg8k" \
  -H "Content-Type: application/json" \
  -d '{"destination":"Paris","startDate":"2026-07-01","endDate":"2026-07-03","travelType":"Couple","interests":["Culture"],"activityLevel":"Balanced"}' \
  --no-buffer
```

Expected: a stream of `data: {...}\n\n` SSE events, one per day, ending with `data: [DONE]\n\n`.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/generate-itinerary/index.ts
git commit -m "feat: add Claude streaming edge function"
```

---

## Task 3: SSE client service

**Files:**
- Create: `features/trips/services/itinerary-stream.ts`

- [ ] **Step 1: Create the service**

Create `features/trips/services/itinerary-stream.ts`:

```typescript
import EventSource from 'react-native-sse';
import { ItineraryDay, TripPreferences } from '../types/itinerary';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://kyvjacabosaakbctblqh.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dmphY2Fib3NhYWtiY3RibHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjkxOTQsImV4cCI6MjA5NjYwNTE5NH0.bJUVEO_ADKD7qLWmk-8AJibWXnCOH08gJsxq7rfJg8k';

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-itinerary`;

export interface StreamCallbacks {
  onDay: (day: ItineraryDay) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export function streamItinerary(
  preferences: TripPreferences,
  callbacks: StreamCallbacks
): () => void {
  const es = new EventSource(EDGE_FUNCTION_URL, {
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(preferences),
    pollingInterval: 0,
  } as any);

  es.addEventListener('message', (event: any) => {
    const data = event.data as string;
    if (data === '[DONE]') {
      callbacks.onDone();
      es.close();
      return;
    }
    try {
      const day = JSON.parse(data) as ItineraryDay;
      callbacks.onDay(day);
    } catch {
      // malformed chunk, skip
    }
  });

  es.addEventListener('error', () => {
    callbacks.onError('Erreur de connexion. Vérifiez votre connexion internet.');
    es.close();
  });

  return () => es.close();
}
```

- [ ] **Step 2: Commit**

```bash
git add features/trips/services/itinerary-stream.ts
git commit -m "feat: add SSE client for itinerary streaming"
```

---

## Task 4: useItineraryStream hook

**Files:**
- Create: `features/trips/hooks/useItineraryStream.ts`

- [ ] **Step 1: Create the hook**

Create `features/trips/hooks/useItineraryStream.ts`:

```typescript
import { useState, useRef, useCallback } from 'react';
import { streamItinerary } from '../services/itinerary-stream';
import { ItineraryDay, TripPreferences } from '../types/itinerary';

interface UseItineraryStreamResult {
  days: ItineraryDay[];
  isLoading: boolean;
  isComplete: boolean;
  error: string | null;
  generate: (preferences: TripPreferences) => void;
  reset: () => void;
}

export function useItineraryStream(): UseItineraryStreamResult {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeStreamRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    closeStreamRef.current?.();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDays([]);
    setIsLoading(false);
    setIsComplete(false);
    setError(null);
  }, []);

  const generate = useCallback(
    (preferences: TripPreferences) => {
      reset();
      setIsLoading(true);

      timeoutRef.current = setTimeout(() => {
        closeStreamRef.current?.();
        setError('Délai dépassé (30s). Veuillez réessayer.');
        setIsLoading(false);
      }, 30000);

      closeStreamRef.current = streamItinerary(preferences, {
        onDay: (day) => {
          setDays((prev) => [...prev, day]);
        },
        onDone: () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setIsLoading(false);
          setIsComplete(true);
        },
        onError: (err) => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setError(err);
          setIsLoading(false);
        },
      });
    },
    [reset]
  );

  return { days, isLoading, isComplete, error, generate, reset };
}
```

- [ ] **Step 2: Commit**

```bash
git add features/trips/hooks/useItineraryStream.ts
git commit -m "feat: add useItineraryStream hook"
```

---

## Task 5: Modify plan-trip.tsx

**Files:**
- Modify: `app/plan-trip.tsx`

- [ ] **Step 1: Add imports**

Add these two imports after the existing import block:

```typescript
import { useEffect } from 'react';
import { useItineraryStream } from '@/features/trips/hooks/useItineraryStream';
import { TripPreferences } from '@/features/trips/types/itinerary';
```

Also add `ActivityIndicator` to the React Native import line if not already present:
```typescript
import { ActivityIndicator, Alert, Modal, ... } from 'react-native';
```

Note: `useEffect` may already be imported via `React` — check and add separately only if the file uses `import React, { useState } from 'react'` style.

- [ ] **Step 2: Replace isLoading state with hook**

Remove:
```typescript
const [isLoading, setIsLoading] = useState(false);
```

Add (after the other `useState` declarations):
```typescript
const { days, isLoading, isComplete, error, generate, reset } = useItineraryStream();
```

- [ ] **Step 3: Replace handleGenerateItinerary**

Remove the existing `handleGenerateItinerary` function entirely. Replace with:

```typescript
const handleGenerateItinerary = async () => {
  if (!destination.trim()) {
    Alert.alert('Destination requise', 'Veuillez saisir une destination');
    return;
  }
  if (!user) {
    Alert.alert('Connexion requise', 'Veuillez vous connecter pour créer un voyage');
    return;
  }

  const { data: tripPlan, error: saveError } = await createTripPlan({
    destination: destination.trim(),
    startDate,
    endDate,
    travelType: selectedTravelType as 'Solo' | 'Couple' | 'Family' | 'Group',
    interests: selectedThemes,
    activityLevel: selectedActivityLevel as 'Relax' | 'Balanced' | 'Intense',
  });

  if (saveError || !tripPlan) {
    Alert.alert('Erreur', "Impossible d'enregistrer le voyage.");
    return;
  }

  tripPlanIdRef.current = tripPlan.id;

  const preferences: TripPreferences = {
    destination: destination.trim(),
    startDate: startDate ? startDate.toISOString().split('T')[0] : null,
    endDate: endDate ? endDate.toISOString().split('T')[0] : null,
    travelType: selectedTravelType as 'Solo' | 'Couple' | 'Family' | 'Group',
    interests: selectedThemes,
    activityLevel: selectedActivityLevel as 'Relax' | 'Balanced' | 'Intense',
  };

  generate(preferences);
};
```

- [ ] **Step 4: Add a ref to store tripPlanId + useEffects for navigation and errors**

Add a ref just after the hook declaration (after the `useItineraryStream` line):

```typescript
const tripPlanIdRef = useRef<string | null>(null);
```

Add `useRef` to the React import if not already there:
```typescript
import React, { useState, useEffect, useRef } from 'react';
```

Add both useEffects just before the `return (` statement:

```typescript
useEffect(() => {
  if (isComplete && days.length > 0) {
    if (tripPlanIdRef.current) {
      saveGeneratedItinerary(tripPlanIdRef.current, {
        days,
        generatedAt: new Date().toISOString(),
      });
    }
    router.push({
      pathname: '/planning',
      params: {
        itinerary: JSON.stringify(days),
        trip: JSON.stringify({
          destination: destination.trim(),
          startDate: startDate ? startDate.toISOString() : '',
          endDate: endDate ? endDate.toISOString() : '',
        }),
      },
    });
  }
}, [isComplete]);

useEffect(() => {
  if (error) {
    Alert.alert('Erreur de génération', error, [{ text: 'OK', onPress: reset }]);
  }
}, [error, reset]);
```

- [ ] **Step 5: Remove OpenTripMap import**

Remove this line from the imports:
```typescript
import { getOpenTripMapService } from '@/features/explore/services/opentripmap';
```

- [ ] **Step 6: Add streaming progress overlay in JSX**

Add this block just before the closing `</SafeAreaView>` (after the `</Modal>` closing tag):

```typescript
{isLoading && (
  <View style={styles.streamOverlay}>
    <View style={styles.streamCard}>
      <Text style={styles.streamTitle}>Claude prépare ton voyage…</Text>
      <View style={styles.streamDays}>
        {days.map((d) => (
          <View key={d.day} style={styles.streamDayRow}>
            <Text style={styles.streamCheck}>✅</Text>
            <Text style={styles.streamDayText}>
              Jour {d.day} — {d.theme}
            </Text>
          </View>
        ))}
        <View style={styles.streamDayRow}>
          <ActivityIndicator size="small" color={C.cream} />
          <Text style={styles.streamDayText}>
            Jour {days.length + 1} en cours…
          </Text>
        </View>
      </View>
    </View>
  </View>
)}
```

- [ ] **Step 7: Add overlay styles**

Append inside the `StyleSheet.create({})` at the bottom of `plan-trip.tsx`:

```typescript
streamOverlay: {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(13,13,13,0.92)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 100,
},
streamCard: {
  backgroundColor: 'rgba(18,18,18,0.98)',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(122,184,245,0.22)',
  padding: 28,
  width: '85%',
},
streamTitle: {
  fontSize: 16,
  fontWeight: '300',
  color: '#7AB8F5',
  marginBottom: 20,
  textAlign: 'center',
  letterSpacing: 0.5,
},
streamDays: { gap: 12 },
streamDayRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},
streamCheck: { fontSize: 16 },
streamDayText: {
  fontSize: 14,
  color: 'rgba(255,255,255,0.75)',
  fontWeight: '300',
  flex: 1,
},
```

- [ ] **Step 8: Commit**

```bash
git add app/plan-trip.tsx
git commit -m "feat: replace OpenTripMap with Claude streaming itinerary in plan-trip"
```

---

## Task 6: Rewrite planning.tsx

**Files:**
- Modify: `app/planning.tsx`

The screen now reads `params.itinerary` (new `ItineraryDay[]` format) instead of `params.planning` (old OpenTripMap format).

- [ ] **Step 1: Replace the full content of app/planning.tsx**

```typescript
import { ItineraryActivity, ItineraryDay } from '@/features/trips/types/itinerary';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const C = {
  bg:         '#0D0D0D',
  card:       'rgba(18,18,18,0.95)',
  border:     'rgba(122,184,245,0.12)',
  borderMid:  'rgba(122,184,245,0.22)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.50)',
  creamFaint: 'rgba(122,184,245,0.14)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.55)',
};

function ActivityCard({ activity }: { activity: ItineraryActivity }) {
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityTimeRow}>
        <Ionicons name="time-outline" size={13} color={C.creamDim} />
        <Text style={styles.activityTime}>{activity.time}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{activity.category}</Text>
        </View>
      </View>
      <Text style={styles.activityName}>{activity.name}</Text>
      <Text style={styles.activityDesc}>{activity.description}</Text>
      {!!activity.tips && (
        <View style={styles.tipsRow}>
          <Ionicons name="bulb-outline" size={13} color={C.cream} />
          <Text style={styles.tipsText}>{activity.tips}</Text>
        </View>
      )}
    </View>
  );
}

export default function PlanningScreen() {
  const params = useLocalSearchParams();
  const days: ItineraryDay[] = params.itinerary
    ? JSON.parse(params.itinerary as string)
    : [];
  const trip: { destination?: string } = params.trip
    ? JSON.parse(params.trip as string)
    : {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/home')}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mon voyage</Text>
          {!!trip.destination && (
            <Text style={styles.headerSub}>{trip.destination}</Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {days.map((day) => (
          <View key={day.day} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>{day.day}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayTheme}>{day.theme}</Text>
                <Text style={styles.dayDate}>{day.date}</Text>
              </View>
            </View>
            {!!day.intro && (
              <Text style={styles.dayIntro}>{day.intro}</Text>
            )}
            <View style={styles.activitiesList}>
              {day.activities.map((act, idx) => (
                <ActivityCard key={idx} activity={act} />
              ))}
            </View>
          </View>
        ))}

        {days.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={48} color={C.creamDim} />
            <Text style={styles.emptyText}>Aucun itinéraire disponible</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '200', color: C.white, letterSpacing: 1 },
  headerSub:   { fontSize: 12, color: C.creamDim, marginTop: 2 },

  scroll: { padding: 20, paddingBottom: 80 },

  daySection: {
    backgroundColor: C.card,
    borderRadius: 18, borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 12,
  },
  dayBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, borderWidth: 1, borderColor: C.borderMid,
    justifyContent: 'center', alignItems: 'center',
  },
  dayBadgeText: { fontSize: 16, fontWeight: '600', color: C.cream },
  dayTheme:     { fontSize: 16, fontWeight: '400', color: C.white, lineHeight: 22 },
  dayDate:      { fontSize: 12, color: C.creamDim, marginTop: 2 },
  dayIntro: {
    fontSize: 13, color: C.whiteDim, fontStyle: 'italic', lineHeight: 20,
    marginBottom: 16, paddingLeft: 4,
  },

  activitiesList: { gap: 10 },
  activityCard: {
    backgroundColor: 'rgba(122,184,245,0.04)',
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 14,
  },
  activityTimeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
  },
  activityTime: { fontSize: 12, color: C.creamDim, flex: 1 },
  categoryBadge: {
    backgroundColor: 'rgba(122,184,245,0.12)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  categoryText: { fontSize: 10, color: C.cream, fontWeight: '500' },
  activityName: { fontSize: 15, fontWeight: '500', color: C.white, marginBottom: 6 },
  activityDesc: { fontSize: 13, color: C.whiteDim, lineHeight: 19, marginBottom: 8 },
  tipsRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: 'rgba(122,184,245,0.06)',
    borderRadius: 8, padding: 8,
  },
  tipsText: { fontSize: 12, color: C.cream, flex: 1, lineHeight: 17 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 14, color: C.creamDim, fontWeight: '300' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/planning.tsx
git commit -m "feat: rewrite planning screen for Claude itinerary format"
```

---

## Task 7: End-to-end manual test

- [ ] **Step 1: Start the app**

```bash
npx expo start
```

Open on your device or simulator.

- [ ] **Step 2: Happy path test**

1. Log in to the app
2. Navigate to "Planifier un voyage"
3. Enter destination `Tokyo`, pick dates (e.g. 3 days), type `Couple`, interests `Culture` + `Gastronomie`, rythme `Balanced`
4. Tap "Générer l'itinéraire"
5. **Verify:** dark overlay appears with "Claude prépare ton voyage…" and a spinner
6. **Verify:** within ~5s, "Jour 1 — [theme]" appears with ✅
7. **Verify:** "Jour 2" and "Jour 3" appear progressively
8. **Verify:** navigation to `/planning` happens automatically after the last day
9. **Verify:** each day card shows: day badge, theme, date, intro text, activities with time/description/tips

- [ ] **Step 3: Error path test**

Turn off WiFi before tapping "Générer l'itinéraire".

**Verify:** alert appears: "Erreur de connexion. Vérifiez votre connexion internet."
Tapping OK dismisses the overlay cleanly.
