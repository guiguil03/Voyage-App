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
