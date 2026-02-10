import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  value: 'feed' | 'map';
  onChange: (value: 'feed' | 'map') => void;
  labels: { feed: string; map: string };
  textColor: string;
  activeTextColor: string;
  activeBackground: string;
  background: string;
};

export default function SegmentedControl({
  value,
  onChange,
  labels,
  textColor,
  activeTextColor,
  activeBackground,
  background,
}: Props) {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const animatedIndex = React.useRef(new Animated.Value(value === 'map' ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedIndex, {
      toValue: value === 'map' ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [animatedIndex, value]);

  const segmentWidth = Math.max((containerWidth - 8) / 2, 0);
  const thumbTranslateX = animatedIndex.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segmentWidth],
  });

  return (
    <View
      style={[styles.container, { backgroundColor: background }]}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            width: segmentWidth,
            backgroundColor: activeBackground,
            transform: [{ translateX: thumbTranslateX }],
          },
        ]}
      />
      <Pressable
        style={styles.button}
        onPress={() => onChange('feed')}
      >
        <Text style={[styles.text, { color: value === 'feed' ? activeTextColor : textColor }]}>
          {labels.feed}
        </Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={() => onChange('map')}
      >
        <Text style={[styles.text, { color: value === 'map' ? activeTextColor : textColor }]}>
          {labels.map}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
    zIndex: 1,
  },
  text: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
});
