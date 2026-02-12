import { buildFitCoordinates, calculateFitBounds } from '../mapFitBounds';

describe('mapFitBounds', () => {
  it('includes user location in fit coordinates when reviews exist', () => {
    const coordinates = buildFitCoordinates(
      [
        {
          id: 'pin-1',
          reviewId: 'review-1',
          placeId: 'place-1',
          title: 'Place 1',
          rating: 9,
          coordinates: [-48.52, -27.59],
        },
      ],
      [-48.45, -27.57]
    );

    expect(coordinates).toEqual([
      [-48.52, -27.59],
      [-48.45, -27.57],
    ]);
  });

  it('returns no fit coordinates when there are no review pins', () => {
    const coordinates = buildFitCoordinates([], [-48.45, -27.57]);

    expect(coordinates).toEqual([]);
  });

  it('expands bounds for single-point fits', () => {
    const bounds = calculateFitBounds([[-48.497894, -27.545227]]);

    expect(bounds).not.toBeNull();
    expect(bounds?.ne[0]).toBeGreaterThan(bounds?.sw[0] ?? 0);
    expect(bounds?.ne[1]).toBeGreaterThan(bounds?.sw[1] ?? 0);
  });
});
