import {
  getRecentPeople,
  getRecentPlaces,
  getTrendingPeople,
  getTrendingPlaces,
} from '../search';

describe('search service', () => {
  it('returns recent people', () => {
    const people = getRecentPeople();
    expect(Array.isArray(people)).toBe(true);
    expect(people.length).toBeGreaterThan(0);
    expect(people[0]).toHaveProperty('handle');
  });

  it('returns trending people', () => {
    const people = getTrendingPeople();
    expect(Array.isArray(people)).toBe(true);
    expect(people.length).toBeGreaterThan(0);
    expect(people[0]).toHaveProperty('name');
  });

  it('returns recent places', () => {
    const places = getRecentPlaces();
    expect(Array.isArray(places)).toBe(true);
    expect(places.length).toBeGreaterThan(0);
    expect(places[0]).toHaveProperty('location');
  });

  it('returns trending places', () => {
    const places = getTrendingPlaces();
    expect(Array.isArray(places)).toBe(true);
    expect(places.length).toBeGreaterThan(0);
    expect(places[0]).toHaveProperty('category');
  });
});
