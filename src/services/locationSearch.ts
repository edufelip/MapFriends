import { searchPlaces } from './map';

export type LocationHint = {
  id: string;
  title: string;
  subtitle: string;
  coordinates: [number, number] | null;
};

type Options = {
  limit?: number;
  token?: string;
};

const MAPBOX_FORWARD_ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/forward';
const MAPBOX_SEARCHBOX_SUGGEST_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const MAPBOX_SEARCHBOX_RETRIEVE_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/retrieve';
const SHOULD_DEBUG_LOG = process.env.EXPO_PUBLIC_DEBUG_LOCATION_HINTS === '1';
let requestSeq = 0;
const SEARCHBOX_SESSION_TOKEN = Math.random().toString(36).slice(2, 14);

const debugLog = (scope: string, payload: Record<string, unknown>) => {
  if (!SHOULD_DEBUG_LOG) {
    return;
  }
  // Intentional debug logs to inspect Mapbox hint request flow.
  console.log(`[location-hints] ${scope}`, payload);
};

const toHintFromMapboxFeature = (feature: any): LocationHint | null => {
  if (!feature?.id) {
    return null;
  }

  const coordinates = Array.isArray(feature?.geometry?.coordinates)
    && feature.geometry.coordinates.length >= 2
    ? [Number(feature.geometry.coordinates[0]), Number(feature.geometry.coordinates[1])] as [number, number]
    : null;

  const title = feature?.properties?.name
    || feature?.properties?.place_formatted
    || feature?.place_name
    || '';
  const subtitle = feature?.properties?.full_address
    || feature?.place_name
    || feature?.properties?.context
    || '';

  if (!title) {
    return null;
  }

  return {
    id: String(feature.id),
    title: String(title),
    subtitle: String(subtitle),
    coordinates,
  };
};

const toHintFromSearchboxSuggestion = (suggestion: any): LocationHint | null => {
  const id = suggestion?.mapbox_id || suggestion?.id;
  const title = suggestion?.name || suggestion?.name_preferred || '';
  const subtitle = suggestion?.full_address || suggestion?.place_formatted || suggestion?.address || '';
  if (!id || !title) {
    return null;
  }

  const longitude = suggestion?.center?.longitude;
  const latitude = suggestion?.center?.latitude;
  const coordinates = typeof longitude === 'number' && typeof latitude === 'number'
    ? [longitude, latitude] as [number, number]
    : null;

  return {
    id: String(id),
    title: String(title),
    subtitle: String(subtitle),
    coordinates,
  };
};

const toFeatureCoordinates = (feature: any): [number, number] | null => {
  if (!Array.isArray(feature?.geometry?.coordinates) || feature.geometry.coordinates.length < 2) {
    return null;
  }

  const longitude = Number(feature.geometry.coordinates[0]);
  const latitude = Number(feature.geometry.coordinates[1]);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return [longitude, latitude];
};

const toHintFromLocalPlace = (place: any): LocationHint => ({
  id: place.id,
  title: place.name,
  subtitle: `${place.category} · ${place.address}`,
  coordinates: Array.isArray(place?.coordinates) && place.coordinates.length >= 2
    ? [Number(place.coordinates[0]), Number(place.coordinates[1])]
    : null,
});

const readResponseErrorBody = async (response: Response) => {
  try {
    const body = await response.text();
    return body.slice(0, 240);
  } catch {
    return '';
  }
};

const fallbackLocal = async (
  requestId: number,
  reason: string,
  query: string,
  limit: number
) => {
  debugLog(reason, { requestId, query, limit });
  const local = await searchPlaces(query, limit);
  debugLog('fallback-local-results', { requestId, count: local.length });
  return local.map(toHintFromLocalPlace);
};

export async function searchLocationHints(
  query: string,
  options: Options = {}
): Promise<LocationHint[]> {
  const requestId = ++requestSeq;
  const normalized = query.trim();
  if (!normalized) {
    debugLog('skip-empty-query', { requestId });
    return [];
  }

  const limit = options.limit ?? 6;
  const token = options.token || process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

  if (!token) {
    return fallbackLocal(requestId, 'fallback-local-no-token', normalized, limit);
  }

  try {
    const suggestParams = new URLSearchParams({
      q: normalized,
      access_token: token,
      session_token: SEARCHBOX_SESSION_TOKEN,
      types: 'poi,address,place',
      limit: String(limit),
      language: 'en',
    });
    const suggestUrl = `${MAPBOX_SEARCHBOX_SUGGEST_ENDPOINT}?${suggestParams.toString()}`;
    const redactedSuggestUrl = `${MAPBOX_SEARCHBOX_SUGGEST_ENDPOINT}?${new URLSearchParams({
      q: normalized,
      access_token: '[redacted]',
      session_token: SEARCHBOX_SESSION_TOKEN,
      types: 'poi,address,place',
      limit: String(limit),
      language: 'en',
    }).toString()}`;
    debugLog('searchbox-request', {
      requestId,
      query: normalized,
      limit,
      url: redactedSuggestUrl,
    });

    const suggestResponse = await fetch(suggestUrl);
    debugLog('searchbox-response', {
      requestId,
      status: suggestResponse.status,
      ok: suggestResponse.ok,
    });

    if (suggestResponse.ok) {
      const suggestData = await suggestResponse.json();
      const suggestions = Array.isArray(suggestData?.suggestions) ? suggestData.suggestions : [];
      const searchboxHints = suggestions
        .map(toHintFromSearchboxSuggestion)
        .filter((hint: LocationHint | null): hint is LocationHint => Boolean(hint))
        .slice(0, limit);

      debugLog('searchbox-results', {
        requestId,
        rawSuggestions: suggestions.length,
        mappedHints: searchboxHints.length,
      });

      if (searchboxHints.length > 0) {
        return searchboxHints;
      }
    } else {
      const errorBody = await readResponseErrorBody(suggestResponse);
      debugLog('searchbox-error', {
        requestId,
        status: suggestResponse.status,
        body: errorBody,
      });
    }

    const params = new URLSearchParams({
      q: normalized,
      access_token: token,
      autocomplete: 'true',
      types: 'address,street,place,locality,neighborhood',
      limit: String(limit),
      language: 'en',
    });
    const url = `${MAPBOX_FORWARD_ENDPOINT}?${params.toString()}`;
    const redactedUrl = `${MAPBOX_FORWARD_ENDPOINT}?${new URLSearchParams({
      q: normalized,
      access_token: '[redacted]',
      autocomplete: 'true',
      types: 'address,street,place,locality,neighborhood',
      limit: String(limit),
      language: 'en',
    }).toString()}`;
    debugLog('mapbox-request', {
      requestId,
      query: normalized,
      limit,
      url: redactedUrl,
    });

    const response = await fetch(url);
    debugLog('mapbox-response', {
      requestId,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorBody = await readResponseErrorBody(response);
      throw new Error(`mapbox-geocode-failed:${response.status}:${errorBody}`);
    }

    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    const hints = features
      .map(toHintFromMapboxFeature)
      .filter((hint: LocationHint | null): hint is LocationHint => Boolean(hint))
      .slice(0, limit);
    debugLog('mapbox-results', {
      requestId,
      rawFeatures: features.length,
      mappedHints: hints.length,
    });

    if (hints.length > 0) {
      return hints;
    }

    return fallbackLocal(requestId, 'fallback-local-empty-mapbox', normalized, limit);
  } catch (error) {
    debugLog('fallback-local-mapbox-error', {
      requestId,
      query: normalized,
      limit,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return fallbackLocal(requestId, 'fallback-local-after-error', normalized, limit);
  }
}

export async function resolveLocationHintCoordinates(
  hint: LocationHint,
  options: Options = {}
): Promise<LocationHint> {
  if (hint.coordinates) {
    return hint;
  }

  const token = options.token || process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
  if (!token) {
    return hint;
  }

  const requestId = ++requestSeq;

  try {
    const retrieveParams = new URLSearchParams({
      access_token: token,
      session_token: SEARCHBOX_SESSION_TOKEN,
      language: 'en',
    });
    const retrieveUrl = `${MAPBOX_SEARCHBOX_RETRIEVE_ENDPOINT}/${encodeURIComponent(hint.id)}?${retrieveParams.toString()}`;

    debugLog('searchbox-retrieve-request', {
      requestId,
      hintId: hint.id,
      title: hint.title,
      url: `${MAPBOX_SEARCHBOX_RETRIEVE_ENDPOINT}/${encodeURIComponent(hint.id)}?${new URLSearchParams({
        access_token: '[redacted]',
        session_token: SEARCHBOX_SESSION_TOKEN,
        language: 'en',
      }).toString()}`,
    });

    const retrieveResponse = await fetch(retrieveUrl);
    debugLog('searchbox-retrieve-response', {
      requestId,
      hintId: hint.id,
      status: retrieveResponse.status,
      ok: retrieveResponse.ok,
    });

    if (retrieveResponse.ok) {
      const retrieveData = await retrieveResponse.json();
      const retrieveFeatures = Array.isArray(retrieveData?.features) ? retrieveData.features : [];
      const coordinates = retrieveFeatures.map(toFeatureCoordinates).find(Boolean) || null;
      if (coordinates) {
        return {
          ...hint,
          coordinates,
        };
      }
    } else {
      const errorBody = await readResponseErrorBody(retrieveResponse);
      debugLog('searchbox-retrieve-error', {
        requestId,
        hintId: hint.id,
        status: retrieveResponse.status,
        body: errorBody,
      });
    }

    const geocodeParams = new URLSearchParams({
      q: hint.title,
      access_token: token,
      autocomplete: 'false',
      types: 'address,street,place,locality,neighborhood',
      limit: '1',
      language: 'en',
    });
    const geocodeUrl = `${MAPBOX_FORWARD_ENDPOINT}?${geocodeParams.toString()}`;

    debugLog('mapbox-resolve-request', {
      requestId,
      hintId: hint.id,
      title: hint.title,
      url: `${MAPBOX_FORWARD_ENDPOINT}?${new URLSearchParams({
        q: hint.title,
        access_token: '[redacted]',
        autocomplete: 'false',
        types: 'address,street,place,locality,neighborhood',
        limit: '1',
        language: 'en',
      }).toString()}`,
    });

    const geocodeResponse = await fetch(geocodeUrl);
    debugLog('mapbox-resolve-response', {
      requestId,
      hintId: hint.id,
      status: geocodeResponse.status,
      ok: geocodeResponse.ok,
    });

    if (!geocodeResponse.ok) {
      return hint;
    }

    const geocodeData = await geocodeResponse.json();
    const geocodeFeatures = Array.isArray(geocodeData?.features) ? geocodeData.features : [];
    const coordinates = geocodeFeatures.map(toFeatureCoordinates).find(Boolean) || null;
    if (!coordinates) {
      return hint;
    }

    return {
      ...hint,
      coordinates,
    };
  } catch {
    return hint;
  }
}
