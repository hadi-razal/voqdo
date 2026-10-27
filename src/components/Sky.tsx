import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { sky } from '@/theme';

/**
 * The page behind every screen: warm aubergine settling into near-black, lit
 * by a soft lamp in the top corner and a faint lavender haze below. A few
 * distant pinpricks keep the night from feeling flat — never a cartoon sky.
 */
export const Sky = memo(function Sky() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[sky.top, sky.mid, sky.bottom]} locations={[0, 0.38, 1]} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMin slice">
        <Defs>
          <RadialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={sky.ember} stopOpacity="0.28" />
            <Stop offset="0.35" stopColor={sky.ember} stopOpacity="0.1" />
            <Stop offset="0.7" stopColor={sky.ember} stopOpacity="0.03" />
            <Stop offset="1" stopColor={sky.ember} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="haze" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#8E74FF" stopOpacity="0.14" />
            <Stop offset="1" stopColor="#8E74FF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="floor" cx="0.5" cy="0.2" r="0.6">
            <Stop offset="0" stopColor="#FFAA84" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#FFAA84" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="130" y="-240" width="520" height="520" fill="url(#lamp)" />
        <Rect x="-280" y="360" width="560" height="560" fill="url(#haze)" />
        <Rect x="40" y="620" width="320" height="280" fill="url(#floor)" />
        <Circle cx="62" cy="118" r="1.2" fill="#FFF6EC" opacity="0.35" />
        <Circle cx="318" cy="168" r="1" fill="#FFF6EC" opacity="0.22" />
        <Circle cx="246" cy="92" r="0.9" fill="#E8DEFF" opacity="0.28" />
        <Circle cx="88" cy="250" r="0.8" fill="#FFF6EC" opacity="0.18" />
        <Circle cx="352" cy="310" r="1.1" fill="#E8DEFF" opacity="0.2" />
      </Svg>
    </View>
  );
});
