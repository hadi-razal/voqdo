import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { glowShadow } from '@/theme';

const MASCOT = require('../../assets/images/mascot.png');

/** The sprout mascot — used as the in-app face of VOQDO. */
export function BrandMark({
  size = 88,
  glow = false,
  style,
}: {
  size?: number;
  glow?: boolean;
  style?: ViewStyle;
}) {
  const radius = Math.round(size * 0.22);

  return (
    <View style={[glow ? glowShadow('#E9A063', 'md') : null, style]}>
      <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
        <Image
          source={MASCOT}
          accessibilityLabel="VOQDO"
          style={{ width: size, height: size, borderRadius: radius }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
});
