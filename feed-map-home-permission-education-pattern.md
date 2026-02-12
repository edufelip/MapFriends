# Feed/Map Home with a Permission-Education Pattern

A great map-first home screen has a tricky job: it must feel instant, ask for sensitive permissions without feeling pushy, and still stay useful when users say “not now.”

This MapFriends pattern does exactly that by combining three ideas:

1. Permission education first (`src/screens/Map/MapHomeScreen.tsx:61`).
2. Platform-specific permission paths (`src/screens/Map/MapHomeScreen.tsx:138`).
3. A smooth map/feed crossfade with a fixed control layer (`src/screens/Map/MapHomeScreen.tsx:184`, `src/screens/Map/MapHomeScreen.tsx:265`).

The result is a location-first experience that still respects user agency.

## Why This Pattern Is Worth Copying

The home screen spec explicitly asks for an explanatory step before the OS permission sheet (`docs/specs/home-screen.md:17`). That lines up with platform guidance:

- Android recommends requesting in context, optionally showing rationale first, and gracefully degrading if denied.
- Apple recommends asking only when the feature clearly needs it, and using clear, specific purpose copy.
- Expo location APIs are designed for explicit “check current status, then request” flows.

In short: context first, system prompt second, fallback always.

## The Core Flow

### 1) Educate before requesting OS permission

`MapHomeScreen` starts with a pre-permission explainer using `Alert.alert`:

```tsx
const requestLocationEducation = React.useCallback(async () => {
  return new Promise<boolean>((resolve) => {
    let resolved = false;
    const finalize = (value: boolean) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    Alert.alert(
      strings.home.locationPromptTitle,
      strings.home.locationPromptMessage,
      [
        { text: strings.home.locationPromptNotNow, style: 'cancel', onPress: () => finalize(false) },
        { text: strings.home.locationPromptAllow, onPress: () => finalize(true) },
      ],
      { cancelable: true, onDismiss: () => finalize(false) }
    );
  });
}, [
  strings.home.locationPromptAllow,
  strings.home.locationPromptMessage,
  strings.home.locationPromptNotNow,
  strings.home.locationPromptTitle,
]);
```

This is exactly what a “permission education” step should do: explain value, then ask for explicit intent to continue.

> Pro tip: keep this copy benefit-driven (“show nearby places and personalized map content”), not technical (“need GPS permission”).

### 2) Split Android and iOS request paths on purpose

The screen branches at runtime and uses platform-native patterns:

```tsx
if (Platform.OS === 'android') {
  const hasLocationPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  if (!hasLocationPermission) {
    const shouldRequestPermission = await requestLocationEducation();
    if (!shouldRequestPermission) return finalize();

    const granted = await Mapbox.requestAndroidLocationPermissions();
    if (!granted) return finalize();
  }
} else {
  const currentPermission = await Location.getForegroundPermissionsAsync();

  if (currentPermission.status !== 'granted') {
    const shouldRequestPermission = await requestLocationEducation();
    if (!shouldRequestPermission) return finalize();

    const requestedPermission = await Location.requestForegroundPermissionsAsync();
    if (requestedPermission.status !== 'granted') return finalize();
  }
}
```

This avoids assumptions and keeps each platform’s permission lifecycle explicit.

> Gotcha: iOS users can choose “Allow Once.” Expo reports foreground permission as granted either way, so plan your UX knowing session-scoped access can disappear after app close.

### 3) Always continue the app flow, even when denied

After any outcome, the screen marks location as resolved and continues:

```tsx
const finalize = () => {
  if (mounted) {
    setLocationResolved(true);
  }
};

const coordinate = await getCurrentCoordinate();
if (mounted && coordinate) {
  setUserCoordinate(coordinate);
}
finalize();
```

The app doesn’t dead-end. If permission is denied, `userCoordinate` stays `null`, but the home experience still works.

> Pitfall: fallback messaging should distinguish “token missing” vs “location still resolving/denied” so users get accurate feedback.

## Hybrid Map + Feed Without Jank

The screen keeps both layers mounted and crossfades opacity with `Animated.timing`:

```tsx
const tabTransition = React.useRef(new Animated.Value(currentTab === 'feed' ? 1 : 0)).current;

React.useEffect(() => {
  Animated.timing(tabTransition, {
    toValue: currentTab === 'feed' ? 1 : 0,
    duration: 260,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
}, [currentTab, tabTransition]);

<Animated.View
  style={[styles.mapLayer, { opacity: mapLayerOpacity }]}
  pointerEvents={currentTab === 'map' ? 'auto' : 'none'}
/>

<Animated.View
  style={[styles.feedLayer, { opacity: feedLayerOpacity }]}
  pointerEvents={currentTab === 'feed' ? 'auto' : 'none'}
/>
```

The segmented control is rendered once above both layers, so it feels stable while content morphs underneath:

```tsx
<View style={[styles.modeSwitcherOverlay, { paddingTop: 16 + insets.top }]} pointerEvents="box-none">
  <SegmentedControl value={currentTab} onChange={handleTabChange} ... />
</View>
```

That fixed control is subtle, but it massively helps orientation: users never wonder where the mode switch went.

## Performance Notes for Minimal Re-renders

If you build this pattern, borrow these practical choices:

- Keep transition state as a single `Animated.Value` in `useRef`.
- Use `pointerEvents` to avoid hidden-layer interactions.
- Keep heavy children mounted during fades to avoid remount spikes.
- In feed lists, tune `FlatList` (`initialNumToRender`, `windowSize`, `removeClippedSubviews`) like `FeedTab` does.
- Memoize tab content / theme objects where possible (the shell already does this in `MainShellScreen`).

## Pros and Cons

### Pros

- Better permission acceptance due to contextual ask.
- Smoother mode switching with no hard screen jump.
- Resilient UX when location is denied.
- Clear architecture: one shell, two layers, one mode switch.

### Cons

- Two mounted layers can increase memory usage.
- Permission logic is more complex than a single `request...()` call.
- Copy quality becomes a product dependency, not just engineering.

## When to Use vs When Not to Use

Use this pattern when:

- Location meaningfully improves the first-session experience.
- You need quick switching between geographic and social/list contexts.
- Denied permissions should not block core app value.

Avoid this pattern when:

- Location is optional and rarely used.
- One mode clearly dominates and the second can live on another route.
- Device constraints make two live layers too expensive.

## Alternatives

1. **Hard navigator split:** separate `Map` and `Feed` routes.
   - Simpler state, but weaker continuity.
2. **Map-first with expandable bottom sheet feed:** one map, feed as sheet.
   - Great for place-centric use cases.
3. **Feed-first with inline mini-map cards:** map as detail affordance.
   - Better for content-heavy social apps.

## Practical Implementation Checklist

- Add localized pre-permission copy (`en-US` + `pt-BR`) in `src/localization/strings.ts`.
- Check current permission status before requesting.
- Show education UI only when status is not already granted.
- Branch platform request logic explicitly.
- Resolve location state no matter what (granted, denied, dismissed, error).
- Keep the app usable with default map center and non-location feed behavior.
- Crossfade layers with native-driven animation and pointer-event gating.
- Keep top mode switch fixed over both layers.

## Final Takeaway

This home screen pattern works because it balances product intent and platform trust: it asks for location with context, handles OS-specific rules directly, and keeps the experience useful even after denial. That combination is what turns permission prompts from a conversion risk into a predictable UX flow.
