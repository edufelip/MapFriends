import React from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  max: number;
  theme: {
    primary: string;
    textPrimary: string;
    textMuted: string;
    surfaceMuted: string;
    border: string;
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function RatingSlider({ label, value, onChange, max, theme }: Props) {
  const [width, setWidth] = React.useState(0);

  const percent = max > 1 ? (value - 1) / (max - 1) : 0;

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const updateValue = (x: number) => {
    if (!width) return;
    const next = Math.round(clamp(x / width, 0, 1) * (max - 1)) + 1;
    onChange(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>{label}</Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.score, { color: theme.primary }]}>{value}</Text>
          <Text style={[styles.scoreSuffix, { color: theme.textMuted }]}>/{max}</Text>
        </View>
      </View>
      <View
        style={styles.slider}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) => updateValue(event.nativeEvent.locationX)}
        onResponderMove={(event) => updateValue(event.nativeEvent.locationX)}
      >
        <View style={[styles.track, { backgroundColor: theme.surfaceMuted }]} />
        <View
          style={[
            styles.trackFill,
            { backgroundColor: theme.primary, width: `${percent * 100}%` },
          ]}
        />
        <View style={styles.ticks}>
          {Array.from({ length: max + 1 }).map((_, index) => (
            <View
              key={`tick-${index}`}
              style={[
                styles.tick,
                {
                  height: index === Math.floor(max / 2) ? 8 : 4,
                  backgroundColor: index === 0 || index === max ? 'transparent' : theme.border,
                },
              ]}
            />
          ))}
        </View>
        <View
          style={[
            styles.thumb,
            { left: width * percent - 12, borderColor: theme.primary },
          ]}
        >
          <View style={[styles.thumbInner, { backgroundColor: theme.primary }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  score: {
    fontSize: 28,
    fontFamily: 'BeVietnamPro-Black',
  },
  scoreSuffix: {
    fontSize: 14,
    fontFamily: 'NotoSans-Medium',
  },
  slider: {
    height: 36,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 999,
  },
  trackFill: {
    position: 'absolute',
    height: 6,
    borderRadius: 999,
  },
  ticks: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  tick: {
    width: 2,
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
