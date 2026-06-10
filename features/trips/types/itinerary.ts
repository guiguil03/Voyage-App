export interface ItineraryActivity {
  name: string;
  time: string;
  description: string;
  category: string;
  tips?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  intro?: string;
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
