import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, View, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type { SproutStage } from '@/lib/pet';

/**
 * Sprout, drawn in code so it stays crisp at any size, can blink and breathe,
 * and physically grows through five stages as the journal does.
 *
 * The art is composed from four independent layers — body, face, arms and a
 * prop — so every pose is a combination rather than a separate drawing.
 */

export type SproutFace =
  | 'happy'
  | 'joy'
  | 'calm'
  | 'sad'
  | 'sleepy'
  | 'surprised'
  | 'wink'
  | 'love'
  | 'thinking'
  | 'worried'
  | 'shy';

export type SproutArms = 'rest' | 'wave' | 'cheer' | 'hug' | 'hold';

export type SproutProp =
  | 'none'
  | 'confetti'
  | 'hearts'
  | 'zzz'
  | 'tear'
  | 'sparkles'
  | 'book'
  | 'cup'
  | 'rain'
  | 'star'
  | 'party'
  | 'question'
  | 'waves';

export type SproutLook = { face: SproutFace; arms?: SproutArms; prop?: SproutProp };

const INK = '#2A1F45';
const SKIN_EDGE = '#8FD9B6';
const LIMB = '#A9E8C8';
const BLUSH = '#FF9FB5';

const OPEN_EYES: SproutFace[] = ['happy', 'sad', 'surprised', 'thinking', 'worried', 'shy', 'wink'];

export function SproutArt({
  look,
  stage = 'sprout',
  size = 120,
  blink = false,
}: {
  look: SproutLook;
  stage?: SproutStage;
  size?: number;
  blink?: boolean;
}) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const arms = look.arms ?? 'rest';
  const prop = look.prop ?? 'none';

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`skin${id}`} cx="0.42" cy="0.36" r="0.72">
          <Stop offset="0" stopColor="#F6FFF9" />
          <Stop offset="0.55" stopColor="#D3F5E3" />
          <Stop offset="1" stopColor={SKIN_EDGE} />
        </RadialGradient>
        <RadialGradient id={`aura${id}`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#FFD27A" stopOpacity="0.45" />
          <Stop offset="1" stopColor="#FFD27A" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {stage === 'grove' && <Circle cx="100" cy="110" r="96" fill={`url(#aura${id})`} />}

      {/* Ground shadow */}
      <Ellipse cx="100" cy="186" rx="50" ry="7" fill="#000" opacity="0.22" />

      {arms === 'rest' && <RestArms />}
      {(arms === 'wave' || arms === 'cheer') && <RaisedArms both={arms === 'cheer'} />}

      {/* Feet */}
      <Ellipse cx="78" cy="178" rx="14" ry="7" fill={SKIN_EDGE} />
      <Ellipse cx="122" cy="178" rx="14" ry="7" fill={SKIN_EDGE} />

      {/* Body */}
      <Path
        d="M100 62 C144 62 166 94 166 130 C166 162 138 180 100 180 C62 180 34 162 34 130 C34 94 56 62 100 62 Z"
        fill={`url(#skin${id})`}
      />
      <Ellipse cx="100" cy="150" rx="36" ry="22" fill="#FFFFFF" opacity="0.28" />
      <Ellipse cx="74" cy="84" rx="14" ry="8" fill="#FFFFFF" opacity="0.55" transform="rotate(-24 74 84)" />

      <Topper stage={stage} />

      <Face face={look.face} blink={blink && OPEN_EYES.includes(look.face)} />

      {(arms === 'hug' || arms === 'hold') && <FrontArms />}
      <Prop prop={prop} arms={arms} />
    </Svg>
  );
}

function RestArms() {
  return (
    <G>
      <Ellipse cx="40" cy="138" rx="11" ry="16" fill={LIMB} transform="rotate(24 40 138)" />
      <Ellipse cx="160" cy="138" rx="11" ry="16" fill={LIMB} transform="rotate(-24 160 138)" />
    </G>
  );
}

function RaisedArms({ both }: { both: boolean }) {
  return (
    <G>
      {both ? (
        <G>
          <Ellipse cx="30" cy="104" rx="10.5" ry="18" fill={LIMB} transform="rotate(-52 30 104)" />
          <Circle cx="18" cy="94" r="7" fill={LIMB} />
        </G>
      ) : (
        <Ellipse cx="40" cy="138" rx="11" ry="16" fill={LIMB} transform="rotate(24 40 138)" />
      )}
      <Ellipse cx="170" cy="104" rx="10.5" ry="18" fill={LIMB} transform="rotate(52 170 104)" />
      <Circle cx="182" cy="94" r="7" fill={LIMB} />
    </G>
  );
}

function FrontArms() {
  return (
    <G>
      <Ellipse cx="78" cy="156" rx="12" ry="10" fill={LIMB} />
      <Ellipse cx="122" cy="156" rx="12" ry="10" fill={LIMB} />
    </G>
  );
}

function Leaf({ d, fill, vein }: { d: string; fill: string; vein: string }) {
  return (
    <G>
      <Path d={d} fill={fill} />
      <Path d={vein} stroke="#3FA878" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
    </G>
  );
}

function Stem({ top }: { top: number }) {
  return <Path d={`M100 66 Q97 ${(66 + top) / 2} 100 ${top}`} stroke="#4DB783" strokeWidth="5" strokeLinecap="round" fill="none" />;
}

function Topper({ stage }: { stage: SproutStage }) {
  if (stage === 'seed') {
    return (
      <G>
        <Path d="M66 78 C70 46 130 46 134 78 C122 70 78 70 66 78 Z" fill="#C98B5A" />
        <Path d="M78 66 C88 56 112 56 122 66" stroke="#E4B084" strokeWidth="3" strokeLinecap="round" fill="none" />
        <Path d="M98 52 L102 60 L97 66" stroke="#8C5A36" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    );
  }

  if (stage === 'sprout') {
    return (
      <G>
        <Stem top={42} />
        <Leaf d="M100 44 C88 28 68 30 62 42 C74 52 92 52 100 44 Z" fill="#6FD6A0" vein="M98 45 C88 42 76 42 66 42" />
        <Leaf d="M100 42 C112 22 136 24 142 36 C130 50 110 50 100 42 Z" fill="#8AE6B4" vein="M102 42 C114 38 126 36 138 36" />
      </G>
    );
  }

  if (stage === 'bud') {
    return (
      <G>
        <Stem top={30} />
        <Leaf d="M99 56 C86 42 66 44 60 56 C72 66 90 66 99 56 Z" fill="#6FD6A0" vein="M97 57 C86 54 74 54 64 56" />
        <Leaf d="M101 54 C114 38 136 40 142 52 C130 64 110 64 101 54 Z" fill="#8AE6B4" vein="M103 54 C114 51 126 50 138 52" />
        <Path d="M100 8 C114 16 116 30 100 36 C84 30 86 16 100 8 Z" fill="#FF9FC0" />
        <Path d="M100 12 C106 18 107 26 100 32" stroke="#FFC4D9" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <Path d="M90 32 L100 38 L110 32 L100 30 Z" fill="#4DB783" />
      </G>
    );
  }

  if (stage === 'bloom') {
    const petals = [0, 72, 144, 216, 288];
    return (
      <G>
        <Stem top={34} />
        <Leaf d="M99 58 C86 44 66 46 60 58 C72 68 90 68 99 58 Z" fill="#6FD6A0" vein="M97 59 C86 56 74 56 64 58" />
        <Leaf d="M101 56 C114 40 136 42 142 54 C130 66 110 66 101 56 Z" fill="#8AE6B4" vein="M103 56 C114 53 126 52 138 54" />
        {petals.map((angle) => (
          <Ellipse key={angle} cx="100" cy="12" rx="10" ry="13" fill={angle % 144 === 0 ? '#FFB48C' : '#FFC9A8'} transform={`rotate(${angle} 100 26)`} />
        ))}
        <Circle cx="100" cy="26" r="8" fill="#FFD27A" />
        <Circle cx="97" cy="23" r="2.4" fill="#FFF1C9" />
      </G>
    );
  }

  // Grove: a small leafy crown with glowing fruit.
  return (
    <G>
      <Path d="M100 70 L100 44" stroke="#8C5A36" strokeWidth="7" strokeLinecap="round" />
      <Circle cx="76" cy="40" r="22" fill="#4DB783" />
      <Circle cx="124" cy="40" r="22" fill="#4DB783" />
      <Circle cx="100" cy="26" r="26" fill="#6FD6A0" />
      <Circle cx="88" cy="16" r="10" fill="#8AE6B4" opacity="0.8" />
      <Circle cx="80" cy="44" r="4.5" fill="#FFD27A" />
      <Circle cx="118" cy="22" r="4.5" fill="#FFD27A" />
      <Circle cx="128" cy="46" r="4" fill="#FFB48C" />
    </G>
  );
}

function OpenEye({ cx, cy, dx = 0, dy = 0, big = false }: { cx: number; cy: number; dx?: number; dy?: number; big?: boolean }) {
  const rx = big ? 10 : 8.5;
  const ry = big ? 13 : 11;
  return (
    <G>
      <Ellipse cx={cx + dx} cy={cy + dy} rx={rx} ry={ry} fill={INK} />
      <Circle cx={cx + dx + 3} cy={cy + dy - 4.5} r={big ? 3.8 : 3.3} fill="#FFFFFF" />
      <Circle cx={cx + dx - 2.8} cy={cy + dy + 3.8} r="1.5" fill="#FFFFFF" opacity="0.9" />
    </G>
  );
}

function Arc({ d, width = 3.6 }: { d: string; width?: number }) {
  return <Path d={d} stroke={INK} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
}

function Heart({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <Path
      d={`M${x} ${y + s * 0.9} C${x - s * 1.4} ${y}, ${x - s * 0.9} ${y - s * 0.9}, ${x} ${y - s * 0.3} C${x + s * 0.9} ${y - s * 0.9}, ${x + s * 1.4} ${y}, ${x} ${y + s * 0.9} Z`}
      fill={fill}
    />
  );
}

function Face({ face, blink }: { face: SproutFace; blink: boolean }) {
  const L = 78;
  const R = 122;
  const Y = 112;
  const closed = (cx: number) => `M${cx - 9} ${Y} Q${cx} ${Y + 5} ${cx + 9} ${Y}`;
  const happyArc = (cx: number) => `M${cx - 9} ${Y + 3} Q${cx} ${Y - 9} ${cx + 9} ${Y + 3}`;
  const smile = 'M88 134 Q100 146 112 134';
  const blushOpacity = face === 'shy' || face === 'love' ? 0.8 : 0.5;

  let eyes: React.ReactNode;
  let mouth: React.ReactNode;
  let brows: React.ReactNode = null;

  switch (face) {
    case 'joy':
      eyes = <>{[L, R].map((cx) => <Arc key={cx} d={happyArc(cx)} width={4} />)}</>;
      mouth = (
        <G>
          <Path d="M86 131 Q100 154 114 131 Z" fill={INK} />
          <Ellipse cx="100" cy="143" rx="7" ry="4" fill="#FF7E9A" />
        </G>
      );
      break;
    case 'calm':
      eyes = <>{[L, R].map((cx) => <Arc key={cx} d={closed(cx)} />)}</>;
      mouth = <Arc d="M92 134 Q100 140 108 134" />;
      break;
    case 'sleepy':
      eyes = <>{[L, R].map((cx) => <Arc key={cx} d={`M${cx - 8} ${Y + 3} L${cx + 8} ${Y + 3}`} />)}</>;
      mouth = <Ellipse cx="100" cy="138" rx="4.5" ry="3.5" fill={INK} />;
      break;
    case 'sad':
      eyes = <><OpenEye cx={L} cy={Y + 2} /><OpenEye cx={R} cy={Y + 2} /></>;
      brows = <><Arc d="M68 96 L86 100" width={3} /><Arc d="M132 96 L114 100" width={3} /></>;
      mouth = <Arc d="M90 142 Q100 134 110 142" />;
      break;
    case 'surprised':
      eyes = <><OpenEye cx={L} cy={Y} big /><OpenEye cx={R} cy={Y} big /></>;
      mouth = <Ellipse cx="100" cy="140" rx="6" ry="7.5" fill={INK} />;
      break;
    case 'wink':
      eyes = <><OpenEye cx={L} cy={Y} /><Arc d={happyArc(R)} width={4} /></>;
      mouth = <Arc d={smile} />;
      break;
    case 'love':
      eyes = <><Heart x={L} y={Y} s={11} fill="#FF6F91" /><Heart x={R} y={Y} s={11} fill="#FF6F91" /></>;
      mouth = <Path d="M88 132 Q100 148 112 132 Z" fill={INK} />;
      break;
    case 'thinking':
      eyes = <><OpenEye cx={L} cy={Y} dx={3} dy={-3} /><OpenEye cx={R} cy={Y} dx={3} dy={-3} /></>;
      mouth = <Arc d="M94 138 Q103 136 110 132" />;
      break;
    case 'worried':
      eyes = <><OpenEye cx={L} cy={Y + 1} /><OpenEye cx={R} cy={Y + 1} /></>;
      brows = <><Arc d="M68 100 L86 95" width={3} /><Arc d="M132 100 L114 95" width={3} /></>;
      mouth = <Arc d="M88 138 Q92 134 96 138 Q100 142 104 138 Q108 134 112 138" width={3} />;
      break;
    case 'shy':
      eyes = <><OpenEye cx={L} cy={Y + 3} dy={2} /><OpenEye cx={R} cy={Y + 3} dy={2} /></>;
      mouth = <Arc d="M95 137 Q100 141 105 137" />;
      break;
    default:
      eyes = <><OpenEye cx={L} cy={Y} /><OpenEye cx={R} cy={Y} /></>;
      mouth = <Arc d={smile} />;
  }

  if (blink) {
    eyes =
      face === 'wink' ? (
        <><Arc d={closed(L)} /><Arc d={happyArc(R)} width={4} /></>
      ) : (
        <>{[L, R].map((cx) => <Arc key={cx} d={closed(cx)} />)}</>
      );
  }

  return (
    <G>
      <Ellipse cx="64" cy="132" rx="11" ry="6.5" fill={BLUSH} opacity={blushOpacity} />
      <Ellipse cx="136" cy="132" rx="11" ry="6.5" fill={BLUSH} opacity={blushOpacity} />
      {brows}
      {eyes}
      {mouth}
    </G>
  );
}

function Sparkle({ x, y, s, fill = '#FFD27A' }: { x: number; y: number; s: number; fill?: string }) {
  return (
    <Path
      d={`M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`}
      fill={fill}
    />
  );
}

function Prop({ prop, arms }: { prop: SproutProp; arms: SproutArms }) {
  switch (prop) {
    case 'confetti': {
      const bits: [number, number, string, number][] = [
        [30, 40, '#FFB48C', 20], [170, 34, '#8EC5FF', -30], [22, 90, '#FFD27A', 50],
        [178, 84, '#FF9FC0', 10], [48, 18, '#7FE3B7', -20], [152, 14, '#D2B2FF', 35],
      ];
      return <G>{bits.map(([x, y, fill, r]) => <Rect key={`${x}-${y}`} x={x - 4} y={y - 7} width="8" height="14" rx="3" fill={fill} transform={`rotate(${r} ${x} ${y})`} />)}</G>;
    }
    case 'party':
      return (
        <G>
          <Prop prop="confetti" arms={arms} />
          <Path d="M132 72 L150 26 L166 80 Z" fill="#8EC5FF" />
          <Path d="M138 58 L160 62" stroke="#FFD27A" strokeWidth="4" strokeLinecap="round" />
          <Circle cx="150" cy="24" r="6" fill="#FFD27A" />
        </G>
      );
    case 'hearts':
      return <G><Heart x={162} y={56} s={10} fill="#FF7E9A" /><Heart x={178} y={30} s={7} fill="#FFA9CB" /><Heart x={36} y={50} s={7} fill="#FFA9CB" />{arms === 'hug' && <Heart x={100} y={158} s={13} fill="#FF6F91" />}</G>;
    case 'zzz':
      return (
        <G>
          <SvgText x="146" y="58" fontSize="22" fontWeight="bold" fill="#D2B2FF">z</SvgText>
          <SvgText x="162" y="40" fontSize="17" fontWeight="bold" fill="#B9A2FF">z</SvgText>
          <SvgText x="175" y="24" fontSize="13" fontWeight="bold" fill="#9A86E0">z</SvgText>
        </G>
      );
    case 'tear':
      return <Path d="M132 118 C136 126 138 131 134 134 C130 137 126 133 128 128 Z" fill="#8EC5FF" />;
    case 'sparkles':
      return <G><Sparkle x={36} y={52} s={10} /><Sparkle x={166} y={46} s={12} /><Sparkle x={176} y={96} s={6} fill="#FFFFFF" /><Sparkle x={22} y={104} s={6} fill="#FFFFFF" /></G>;
    case 'star':
      return (
        <G>
          <Path d="M168 22 L174 36 L189 37 L177 47 L181 62 L168 54 L155 62 L159 47 L147 37 L162 36 Z" fill="#FFD27A" />
          <Sparkle x={34} y={50} s={8} />
        </G>
      );
    case 'book':
      return (
        <G>
          <Path d="M100 146 L70 140 L70 168 L100 174 Z" fill="#FFB48C" />
          <Path d="M100 146 L130 140 L130 168 L100 174 Z" fill="#FFC9A8" />
          <Path d="M76 148 L94 151 M76 155 L94 158 M106 151 L124 148 M106 158 L124 155" stroke="#C9795A" strokeWidth="1.8" strokeLinecap="round" />
          <Ellipse cx="72" cy="158" rx="9" ry="8" fill={LIMB} />
          <Ellipse cx="128" cy="158" rx="9" ry="8" fill={LIMB} />
        </G>
      );
    case 'cup':
      return (
        <G>
          <Rect x="84" y="142" width="32" height="30" rx="8" fill="#FFB48C" />
          <Path d="M116 150 Q128 150 128 158 Q128 166 116 166" stroke="#FFB48C" strokeWidth="5" fill="none" />
          <Path d="M92 136 Q88 128 94 122 M104 136 Q100 126 106 118" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
          <Ellipse cx="82" cy="158" rx="9" ry="8" fill={LIMB} />
          <Ellipse cx="118" cy="160" rx="9" ry="8" fill={LIMB} />
        </G>
      );
    case 'rain':
      return (
        <G>
          <Path d="M146 42 Q146 28 160 28 Q166 16 180 22 Q194 22 192 36 Q198 44 188 48 L152 48 Q142 48 146 42 Z" fill="#A9B3D6" />
          <Path d="M156 56 L152 66 M170 56 L166 66 M184 56 L180 66" stroke="#8EC5FF" strokeWidth="3" strokeLinecap="round" />
        </G>
      );
    case 'question':
      return <SvgText x="156" y="60" fontSize="36" fontWeight="bold" fill="#D2B2FF">?</SvgText>;
    case 'waves':
      return (
        <G>
          <Path d="M172 100 Q180 112 172 124 M182 92 Q194 112 182 132" stroke="#86E0E0" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <Path d="M28 100 Q20 112 28 124 M18 92 Q6 112 18 132" stroke="#86E0E0" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </G>
      );
    default:
      return null;
  }
}

const native = Platform.OS !== 'web';

/**
 * The living Sprout: breathes, sways, blinks at a natural irregular rhythm and
 * hops when `bounce` changes. Motion is skipped when the system asks for
 * reduced motion, and for very small sizes where it would only be noise.
 */
export function Sprout({
  look,
  stage,
  size = 120,
  bounce = 0,
  animated = true,
  style,
}: {
  look: SproutLook;
  stage?: SproutStage;
  size?: number;
  bounce?: number;
  animated?: boolean;
  style?: ViewStyle;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const live = animated && size >= 48 && !reduceMotion;
  const [blink, setBlink] = useState(false);
  const [breathe] = useState(() => new Animated.Value(0));
  const [hop] = useState(() => new Animated.Value(0));
  const firstBounce = useRef(bounce);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => active && setReduceMotion(value)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!live) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
        Animated.timing(breathe, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [live, breathe]);

  useEffect(() => {
    if (!live) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        timer = setTimeout(() => {
          setBlink(false);
          schedule();
        }, 140);
      }, 2200 + Math.random() * 2800);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [live]);

  useEffect(() => {
    if (bounce === firstBounce.current || reduceMotion) return;
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: native }),
      Animated.spring(hop, { toValue: 0, friction: 3.2, tension: 140, useNativeDriver: native }),
    ]).start();
  }, [bounce, hop, reduceMotion]);

  const transform = useMemo(
    () => [
      { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.12] }) },
      { rotate: breathe.interpolate({ inputRange: [0, 1], outputRange: ['-1.6deg', '1.6deg'] }) },
      { scaleY: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) },
      { scaleX: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) },
    ],
    [breathe, hop, size]
  );

  return (
    <View style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Animated.View style={{ transform, transformOrigin: 'bottom' }}>
        <SproutArt look={look} stage={stage} size={size} blink={blink} />
      </Animated.View>
    </View>
  );
}
