import { searchLocationHints } from '../locationSearch';

const mockSearchPlaces = jest.fn();

jest.mock('../map', () => ({
  searchPlaces: (...args: unknown[]) => mockSearchPlaces(...args),
}));

describe('searchLocationHints', () => {
  beforeEach(() => {
    mockSearchPlaces.mockReset();
  });

  it('maps Mapbox searchbox suggestions into hints', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            mapbox_id: 'poi.123',
            name: 'Blue Bottle Coffee',
            full_address: '76 N 4th St, Brooklyn, NY',
            center: { longitude: -73.99, latitude: 40.73 },
          },
        ],
      }),
    } as Response);

    const hints = await searchLocationHints('coffee', { token: 'pk.test' });

    expect(hints).toEqual([
      {
        id: 'poi.123',
        title: 'Blue Bottle Coffee',
        subtitle: '76 N 4th St, Brooklyn, NY',
        coordinates: [-73.99, 40.73],
      },
    ]);

    fetchSpy.mockRestore();
  });

  it('falls back to local places when token is missing', async () => {
    mockSearchPlaces.mockResolvedValueOnce([
      {
        id: 'place-1',
        name: 'Old Town Market',
        category: 'Food',
        address: 'Old Town',
      },
    ]);

    const hints = await searchLocationHints('market', { token: '' });

    expect(mockSearchPlaces).toHaveBeenCalledWith('market', 6);
    expect(hints[0].title).toBe('Old Town Market');
  });
});
