#!/usr/bin/env node

/* eslint-disable no-console */

const admin = require('firebase-admin');

const SEARCHBOX_RETRIEVE_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/retrieve';
const GEOCODE_FORWARD_ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/forward';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isRepairMode = args.includes('--repair');
const SEARCHBOX_SESSION_TOKEN = `backfill-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function parseFlagNumber(name, fallback) {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) {
    const parsed = Number(inline.slice(prefix.length));
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  }

  const index = args.indexOf(`--${name}`);
  if (index >= 0) {
    const parsed = Number(args[index + 1]);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  }

  return fallback;
}

const batchSize = parseFlagNumber('batch', 25);
const maxRecords = parseFlagNumber('limit', 0);

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';
const mapboxToken = process.env.MAPBOX_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

if (!projectId) {
  console.error('[backfill] Missing FIREBASE_PROJECT_ID (or EXPO_PUBLIC_FIREBASE_PROJECT_ID).');
  process.exit(1);
}

if (!mapboxToken) {
  console.error('[backfill] Missing MAPBOX_TOKEN (or EXPO_PUBLIC_MAPBOX_TOKEN).');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
  });
}

const db = admin.firestore();

function redacted(value) {
  return value ? '[redacted]' : '';
}

function parseCoordinates(feature) {
  if (!feature || !feature.geometry || !Array.isArray(feature.geometry.coordinates)) {
    return null;
  }

  if (feature.geometry.coordinates.length < 2) {
    return null;
  }

  const longitude = Number(feature.geometry.coordinates[0]);
  const latitude = Number(feature.geometry.coordinates[1]);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return [longitude, latitude];
}

async function fetchRetrieveCoordinates(placeId) {
  if (!placeId) {
    return null;
  }

  const params = new URLSearchParams({
    access_token: mapboxToken,
    session_token: SEARCHBOX_SESSION_TOKEN,
    language: 'en',
  });

  const url = `${SEARCHBOX_RETRIEVE_ENDPOINT}/${encodeURIComponent(placeId)}?${params.toString()}`;
  console.log('[backfill] mapbox-retrieve', {
    placeId,
    url: `${SEARCHBOX_RETRIEVE_ENDPOINT}/${encodeURIComponent(placeId)}?access_token=${redacted(mapboxToken)}&session_token=${SEARCHBOX_SESSION_TOKEN}&language=en`,
  });

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.log('[backfill] mapbox-retrieve-non-ok', {
      placeId,
      status: response.status,
      body: body.slice(0, 240),
    });
    return null;
  }

  const data = await response.json();
  const features = Array.isArray(data && data.features) ? data.features : [];
  for (const feature of features) {
    const coordinates = parseCoordinates(feature);
    if (coordinates) {
      return coordinates;
    }
  }

  return null;
}

async function fetchForwardCoordinates(placeTitle) {
  if (!placeTitle) {
    return null;
  }

  const params = new URLSearchParams({
    q: placeTitle,
    access_token: mapboxToken,
    autocomplete: 'false',
    types: 'address,street,place,locality,neighborhood',
    limit: '1',
    language: 'en',
  });
  const url = `${GEOCODE_FORWARD_ENDPOINT}?${params.toString()}`;

  console.log('[backfill] mapbox-forward', {
    placeTitle,
    url: `${GEOCODE_FORWARD_ENDPOINT}?q=${encodeURIComponent(placeTitle)}&access_token=${redacted(mapboxToken)}&autocomplete=false&types=address,street,place,locality,neighborhood&limit=1&language=en`,
  });

  const response = await fetch(url);
  if (!response.ok) {
    console.log('[backfill] mapbox-forward-non-ok', {
      placeTitle,
      status: response.status,
    });
    return null;
  }

  const data = await response.json();
  const features = Array.isArray(data && data.features) ? data.features : [];
  for (const feature of features) {
    const coordinates = parseCoordinates(feature);
    if (coordinates) {
      return coordinates;
    }
  }

  return null;
}

async function resolveCoordinates({ placeId, placeTitle }) {
  const retrieve = await fetchRetrieveCoordinates(placeId);
  if (retrieve) {
    return retrieve;
  }

  return fetchForwardCoordinates(placeTitle);
}

async function processReviewDoc(docSnap) {
  const data = docSnap.data() || {};
  const reviewId = docSnap.id;
  const userId = typeof data.userId === 'string' ? data.userId : '';
  const placeId = typeof data.placeId === 'string' ? data.placeId : '';
  const placeTitle = typeof data.placeTitle === 'string' ? data.placeTitle : '';
  const existingCoordinates = Array.isArray(data.placeCoordinates) ? data.placeCoordinates : null;

  const coordinates = await resolveCoordinates({ placeId, placeTitle });
  if (!coordinates) {
    return {
      status: 'unresolved',
      reviewId,
      userId,
      placeId,
      placeTitle,
    };
  }

  const isAlreadySame = Array.isArray(existingCoordinates)
    && Number(existingCoordinates[0]) === Number(coordinates[0])
    && Number(existingCoordinates[1]) === Number(coordinates[1]);

  if (isAlreadySame) {
    return {
      status: 'skipped',
      reviewId,
      userId,
      coordinates,
      reason: 'already-up-to-date',
    };
  }

  if (isDryRun) {
    return {
      status: 'updated',
      reviewId,
      userId,
      coordinates,
      dryRun: true,
    };
  }

  const batch = db.batch();
  batch.update(docSnap.ref, {
    placeCoordinates: coordinates,
  });

  if (userId) {
    const projectionRef = db.collection('userReviews').doc(userId).collection('items').doc(reviewId);
    const projectionSnap = await projectionRef.get();
    if (projectionSnap.exists) {
      batch.update(projectionRef, {
        placeCoordinates: coordinates,
      });
    }
  }

  await batch.commit();

  return {
    status: 'updated',
    reviewId,
    userId,
    coordinates,
    dryRun: false,
  };
}

async function main() {
  console.log('[backfill] start', {
    projectId,
    batchSize,
    maxRecords: maxRecords || 'all',
    dryRun: isDryRun,
    repair: isRepairMode,
  });

  let cursor = null;
  let processed = 0;
  let updated = 0;
  let unresolved = 0;
  let skipped = 0;
  let failed = 0;

  while (true) {
    if (maxRecords > 0 && processed >= maxRecords) {
      break;
    }

    const currentBatchLimit = maxRecords > 0
      ? Math.min(batchSize, maxRecords - processed)
      : batchSize;

    if (currentBatchLimit <= 0) {
      break;
    }

    let query;
    if (isRepairMode) {
      query = db
        .collection('reviews')
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(currentBatchLimit);
    } else {
      query = db
        .collection('reviews')
        .where('placeCoordinates', '==', null)
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(currentBatchLimit);
    }

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    for (const docSnap of snapshot.docs) {
      processed += 1;
      try {
        const result = await processReviewDoc(docSnap);
        if (result.status === 'updated') {
          updated += 1;
          console.log('[backfill] updated', result);
        } else if (result.status === 'skipped') {
          skipped += 1;
          console.log('[backfill] skipped', result);
        } else {
          unresolved += 1;
          console.log('[backfill] unresolved', result);
        }
      } catch (error) {
        failed += 1;
        console.error('[backfill] failed', {
          reviewId: docSnap.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    cursor = snapshot.docs[snapshot.docs.length - 1].id;
    if (snapshot.size < currentBatchLimit) {
      break;
    }
  }

  console.log('[backfill] done', {
    projectId,
    processed,
    updated,
    unresolved,
    skipped,
    failed,
    dryRun: isDryRun,
    repair: isRepairMode,
  });
}

void main().catch((error) => {
  console.error('[backfill] fatal', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
