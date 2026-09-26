import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { sky } from '@/theme';

/**
 * The page behind every screen: warm aubergine settling into near-black, lit
 * by a soft lamp in the top corner and a faint lavender haze below. No stars —
 * the mood is a quiet room at night, not a cartoon sky.
 */
export const Sky = memo(function Sky() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[sky.top, sky.mid, sky.bottom]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMin slice">
        <Defs>
          <RadialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={sky.ember} stopOpacity="0.2" />
            <Stop offset="0.5" stopColor={sky.ember} stopOpacity="0.06" />
            <Stop offset="1" stopColor={sky.ember} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="haze" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#8E74FF" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#8E74FF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="150" y="-220" width="480" height="480" fill="url(#lamp)" />
        <Rect x="-260" y="380" width="520" height="520" fill="url(#haze)" />
      </Svg>
    </View>
  );
});
