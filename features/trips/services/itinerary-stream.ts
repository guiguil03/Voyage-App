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
  let closed = false;

  const es = new EventSource(EDGE_FUNCTION_URL, {
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(preferences),
    pollingInterval: 0,
  } as any); // react-native-sse supports POST at runtime but types don't expose it

  es.addEventListener('message', (event: any) => {
    if (closed) return;
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

  es.addEventListener('error', (event: any) => {
    if (closed) return;
    callbacks.onError('Erreur de connexion. Vérifiez votre connexion internet.');
    es.close();
  });

  return () => {
    closed = true;
    es.close();
  };
}
