import mapSeed from '../mocks/map.json';
import { Place } from './types';

const places = mapSeed.places as Place[];

export function getPlaces() {
  return places;
}

export function getPlaceById(placeId: string) {
  return places.find((place) => place.id === placeId) || null;
}

export async function searchPlaces(query: string, limit = 6): Promise<Place[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const matches = places
    .filter((place) => {
      const haystack = `${place.name} ${place.category} ${place.address} ${place.tags.join(' ')}`.toLowerCase();
      return haystack.includes(normalized);
    })
    .slice(0, limit);

  return matches;
}
