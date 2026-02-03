import mapSeed from '../mocks/map.json';
import { Place } from './types';

const places = mapSeed.places as Place[];

export function getPlaces() {
  return places;
}

export function getPlaceById(placeId: string) {
  return places.find((place) => place.id === placeId) || null;
}
