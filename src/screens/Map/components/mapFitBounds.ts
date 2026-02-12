import { ReviewMapPin } from '../../../state/reviews';

export type LngLat = [number, number];

export type MapFitBounds = {
  ne: LngLat;
  sw: LngLat;
  pointCount: number;
};

const MIN_BOUND_SPAN = 0.008;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const isLngLatCoordinate = (value: unknown): value is LngLat =>
  Array.isArray(value) &&
  value.length >= 2 &&
  isFiniteNumber(value[0]) &&
  isFiniteNumber(value[1]);

const ensureMinSpan = (min: number, max: number, minSpan: number): [number, number] => {
  const span = max - min;
  if (span >= minSpan) {
    return [min, max];
  }

  const center = (min + max) / 2;
  const half = minSpan / 2;
  return [center - half, center + half];
};

export function buildFitCoordinates(
  reviewPins: ReviewMapPin[],
  userCoordinate: LngLat | null
): LngLat[] {
  const reviewCoordinates = reviewPins
    .map((pin) => pin.coordinates)
    .filter((coordinate): coordinate is LngLat => isLngLatCoordinate(coordinate));

  if (reviewCoordinates.length === 0) {
    return [];
  }

  if (isLngLatCoordinate(userCoordinate)) {
    return [...reviewCoordinates, userCoordinate];
  }

  return reviewCoordinates;
}

export function calculateFitBounds(
  coordinates: LngLat[],
  minSpan: number = MIN_BOUND_SPAN
): MapFitBounds | null {
  if (coordinates.length === 0) {
    return null;
  }

  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let pointCount = 0;

  coordinates.forEach(([lng, lat]) => {
    if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) {
      return;
    }

    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    pointCount += 1;
  });

  if (pointCount === 0) {
    return null;
  }

  const [boundedMinLng, boundedMaxLng] = ensureMinSpan(minLng, maxLng, minSpan);
  const [boundedMinLat, boundedMaxLat] = ensureMinSpan(minLat, maxLat, minSpan);

  return {
    sw: [boundedMinLng, boundedMinLat],
    ne: [boundedMaxLng, boundedMaxLat],
    pointCount,
  };
}
