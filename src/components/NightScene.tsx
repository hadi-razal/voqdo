import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors } from '@/theme';

/**
 * The welcome screen's moonlit landscape: a crescent over soft rolling hills
 * and still water. Drawn rather than shipped as an image so it scales to any
 * device and stays in step with the palette.
 */
export function NightScene({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 400 560">
      <Defs>
        <LinearGradient id="sky" x1="0.25" y1="0" x2="0.7" y2="1">
          <Stop offset="0" stopColor="#2E1D13" />
          <Stop offset="0.42" stopColor="#16110E" />
          <Stop offset="1" stopColor={colors.bg} />
        </LinearGradient>

        <RadialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#F0A868" stopOpacity="0.34" />
          <Stop offset="0.4" stopColor="#C97B45" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#8A5330" stopOpacity="0" />
        </RadialGradient>

        {/* A true crescent: the lit disc minus an offset disc. */}
        <Mask id="crescent">
          <Circle cx="112" cy="112" r="27" fill="#fff" />
          <Circle cx="100" cy="103" r="25" fill="#000" />
        </Mask>

        <LinearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5A3B24" />
          <Stop offset="1" stopColor="#2A1C13" />
        </LinearGradient>

        <LinearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2B1D14" />
          <Stop offset="1" stopColor="#150F0B" />
        </LinearGradient>

        <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#33231A" />
          <Stop offset="0.4" stopColor="#17110D" />
          <Stop offset="1" stopColor={colors.bg} />
        </LinearGradient>

        {/* Fades the scene into the page so there is no hard edge. */}
        <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.6" stopColor={colors.bg} stopOpacity="0" />
          <Stop offset="1" stopColor={colors.bg} stopOpacity="1" />
        </LinearGradient>
      </Defs>

      <Rect x="0" y="0" width="400" height="560" fill="url(#sky)" />
      <Circle cx="112" cy="112" r="132" fill="url(#moonGlow)" />
      <Circle cx="112" cy="112" r="27" fill="#F0B27C" mask="url(#crescent)" />

      {/* Far hills — rolling, hazy, catching the moonlight along their crests. */}
      <Path
        d="M0 318 C 46 286, 92 282, 138 302 C 178 320, 210 274, 254 272
           C 300 270, 330 300, 366 292 C 382 288, 392 284, 400 280
           L400 360 L0 360 Z"
        fill="url(#hillFar)"
        opacity="0.7"
      />

      {/* Mid hills. */}
      <Path
        d="M0 348 C 52 322, 104 344, 156 336 C 208 328, 236 300, 288 306
           C 330 311, 362 332, 400 322 L400 392 L0 392 Z"
        fill="url(#hillMid)"
      />

      {/* Near shore. */}
      <Path
        d="M0 380 C 60 366, 128 388, 196 378 C 264 368, 320 386, 400 374
           L400 412 L0 412 Z"
        fill="#0F0B09"
      />

      <Rect x="0" y="408" width="400" height="152" fill="url(#water)" />

      {/* Reflected light: soft streaks, widest and faintest furthest out. */}
      <Ellipse cx="112" cy="424" rx="26" ry="1.8" fill="#E8A268" opacity="0.2" />
      <Ellipse cx="118" cy="440" rx="40" ry="1.6" fill="#D08F5A" opacity="0.1" />
      <Ellipse cx="104" cy="456" rx="30" ry="1.4" fill="#C08050" opacity="0.075" />
      <Ellipse cx="132" cy="474" rx="52" ry="1.4" fill="#A96F45" opacity="0.055" />
      <Ellipse cx="248" cy="448" rx="46" ry="1.4" fill="#8A6242" opacity="0.05" />

      <Rect x="0" y="0" width="400" height="560" fill="url(#fade)" />
    </Svg>
  );
}
