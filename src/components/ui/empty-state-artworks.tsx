import { useThemeColors } from '@/hooks/use-theme-color';

import { Circle, G, Path, Rect, Svg } from './app-svg';

export interface ArtworkProps {
  width: number;
  height: number;
}

const STROKE_WIDTH = 2.1;

function useMonochromePalette() {
  const [line, mutedLine, tint] = useThemeColors(['icon', 'subtle', 'border-strong']);
  return { line, mutedLine, tint };
}

export function OrdersArtwork({ width, height }: ArtworkProps) {
  const { line, mutedLine, tint } = useMonochromePalette();

  return (
    <Svg width={width} height={height} viewBox="0 0 160 132">
      <Path d="M16 112 L144 112" stroke={mutedLine} strokeWidth={1.8} strokeLinecap="round" />

      <Path
        d="M18 96 L18 72 L36 52 L54 52 L54 96"
        fill={tint}
        fillOpacity={0.18}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path
        d="M28 74 L46 74 L46 60 L37 60 L28 74 Z"
        fill="none"
        stroke={line}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Rect
        x={54}
        y={46}
        width={42}
        height={50}
        rx={5}
        fill={tint}
        fillOpacity={0.12}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
      />
      <Path d="M16 96 L98 96" stroke={line} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />

      <Circle
        cx={34}
        cy={100}
        r={8.5}
        fill={tint}
        fillOpacity={0.22}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
      />
      <Circle cx={34} cy={100} r={3} fill="none" stroke={mutedLine} strokeWidth={1.6} />
      <Circle
        cx={80}
        cy={100}
        r={8.5}
        fill={tint}
        fillOpacity={0.22}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
      />
      <Circle cx={80} cy={100} r={3} fill="none" stroke={mutedLine} strokeWidth={1.6} />

      <Rect
        x={106}
        y={78}
        width={30}
        height={28}
        rx={4}
        fill={tint}
        fillOpacity={0.18}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
      />
      <Path
        d="M117 78 L117 89 L121 86 L125 89 L125 78"
        fill="none"
        stroke={line}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />

      <Path
        d="M121 70 C128 56 105 56 104 42"
        fill="none"
        stroke={mutedLine}
        strokeWidth={1.8}
        strokeDasharray="3.5 3.5"
        strokeLinecap="round"
      />
      <Path
        d="M102 18 C95.5 18 90.5 23 90.5 29.5 C90.5 38 102 48 102 48 C102 48 113.5 38 113.5 29.5 C113.5 23 108.5 18 102 18 Z"
        fill={tint}
        fillOpacity={0.2}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Circle cx={102} cy={29.5} r={4} fill="none" stroke={line} strokeWidth={1.8} />
    </Svg>
  );
}

export function AddressesArtwork({ width, height }: ArtworkProps) {
  const { line, mutedLine, tint } = useMonochromePalette();

  return (
    <Svg width={width} height={height} viewBox="0 0 160 132">
      <Path d="M16 112 L144 112" stroke={mutedLine} strokeWidth={1.8} strokeLinecap="round" />

      <Path
        d="M26 70 L54 60 L54 102 L26 110 Z"
        fill="none"
        stroke={line}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path
        d="M54 60 L106 70 L106 110 L54 102 Z"
        fill={tint}
        fillOpacity={0.2}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path
        d="M106 70 L134 60 L134 102 L106 110 Z"
        fill="none"
        stroke={line}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />

      <Path
        d="M36 90 C54 81 68 93 86 87 C101 82 115 89 124 81"
        fill="none"
        stroke={mutedLine}
        strokeWidth={1.8}
        strokeDasharray="3.5 3.5"
        strokeLinecap="round"
      />

      <Path
        d="M35 81 L41 75.5 L47 81 L47 89 L35 89 Z"
        fill="none"
        stroke={mutedLine}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />

      <Path
        d="M80 22 C68.5 22 59.5 31 59.5 42 C59.5 57.5 80 75 80 75 C80 75 100.5 57.5 100.5 42 C100.5 31 91.5 22 80 22 Z"
        fill={tint}
        fillOpacity={0.22}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path
        d="M80 48.5 C80 48.5 72 43 72 37.5 C72 34.8 74.2 33 76.6 33 C78.2 33 79.4 33.9 80 35.1 C80.6 33.9 81.8 33 83.4 33 C85.8 33 88 34.8 88 37.5 C88 43 80 48.5 80 48.5 Z"
        fill="none"
        stroke={line}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />

      <Circle cx={44} cy={38} r={2.2} fill={mutedLine} />
      <Path
        d="M122 44 L122 50 M119 47 L125 47"
        stroke={mutedLine}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function WalletArtwork({ width, height }: ArtworkProps) {
  const { line, mutedLine, tint } = useMonochromePalette();

  return (
    <Svg width={width} height={height} viewBox="0 0 160 132">
      <Path d="M16 112 L144 112" stroke={mutedLine} strokeWidth={1.8} strokeLinecap="round" />

      <Path
        d="M46 64 L46 43 L51 46 L56 43 L61 46 L66 43 L71 46 L76 43 L80 46 L80 64"
        fill="none"
        stroke={line}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path
        d="M54 53 L72 53 M54 58 L65 58"
        stroke={mutedLine}
        strokeWidth={1.8}
        strokeLinecap="round"
      />

      <Path
        d="M72 64 L85 46 C87 43.5 90.5 43.5 93.5 45.5 L114 59 L111 64"
        fill={tint}
        fillOpacity={0.2}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />

      <Rect
        x={34}
        y={64}
        width={90}
        height={46}
        rx={9}
        fill="none"
        stroke={line}
        strokeWidth={STROKE_WIDTH}
      />
      <Path
        d="M36 73 L122 73"
        stroke={mutedLine}
        strokeWidth={1.6}
        strokeDasharray="3.5 3.5"
        strokeLinecap="round"
      />

      <Rect
        x={96}
        y={79}
        width={32}
        height={17}
        rx={8.5}
        fill={tint}
        fillOpacity={0.22}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
      />
      <Circle cx={105} cy={87.5} r={2.8} fill="none" stroke={line} strokeWidth={1.8} />

      <Circle
        cx={114}
        cy={35}
        r={11.5}
        fill={tint}
        fillOpacity={0.18}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
      />
      <Path
        d="M109.5 31 L118.5 31 M109.5 35 L117.5 35 M114 31 C116.3 31 116.3 35 113.5 35 L109.5 35 L116.5 40.5"
        fill="none"
        stroke={line}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Circle cx={34} cy={49} r={2.2} fill={mutedLine} />
      <Path
        d="M95 23 L95 29 M92 26 L98 26"
        stroke={mutedLine}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function OffersArtwork({ width, height }: ArtworkProps) {
  const { line, mutedLine, tint } = useMonochromePalette();

  return (
    <Svg width={width} height={height} viewBox="0 0 160 132">
      <Path d="M16 112 L144 112" stroke={mutedLine} strokeWidth={1.8} strokeLinecap="round" />

      <G transform="rotate(-6 78 72)">
        <Path
          d="M26 50 L128 50 L128 65 A5.5 5.5 0 0 0 128 79 L128 94 L26 94 L26 79 A5.5 5.5 0 0 0 26 65 Z"
          fill={tint}
          fillOpacity={0.14}
          stroke={line}
          strokeWidth={STROKE_WIDTH}
          strokeLinejoin="round"
        />
        <Path
          d="M64 55 L64 89"
          stroke={mutedLine}
          strokeWidth={1.8}
          strokeDasharray="3.5 3.5"
          strokeLinecap="round"
        />
        <Circle cx={45} cy={72} r={10} fill="none" stroke={line} strokeWidth={2} />
        <Circle cx={41.5} cy={68.5} r={1.6} fill={line} />
        <Circle cx={48.5} cy={75.5} r={1.6} fill={line} />
        <Path d="M41 76.5 L49 67.5" stroke={line} strokeWidth={1.8} strokeLinecap="round" />
        <Path
          d="M75 65 L112 65 M75 72 L102 72 M75 79 L94 79"
          stroke={mutedLine}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      </G>

      <G>
        <Rect
          x={106}
          y={82}
          width={28}
          height={23}
          rx={4}
          fill={tint}
          fillOpacity={0.2}
          stroke={line}
          strokeWidth={STROKE_WIDTH}
        />
        <Rect
          x={103}
          y={76}
          width={34}
          height={8}
          rx={3}
          fill="none"
          stroke={line}
          strokeWidth={STROKE_WIDTH}
        />
        <Path
          d="M120 76 L120 105 M120 76 C116.5 70 110 71 112.5 76 M120 76 C123.5 70 130 71 127.5 76"
          fill="none"
          stroke={line}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>

      <Circle cx={38} cy={36} r={2.2} fill={mutedLine} />
      <Path
        d="M56 28 L56 34 M53 31 L59 31"
        stroke={mutedLine}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SearchArtwork({ width, height }: ArtworkProps) {
  const { line, mutedLine, tint } = useMonochromePalette();

  return (
    <Svg width={width} height={height} viewBox="0 0 160 132">
      <Path d="M16 112 L144 112" stroke={mutedLine} strokeWidth={1.8} strokeLinecap="round" />

      <Rect
        x={30}
        y={38}
        width={86}
        height={62}
        rx={11}
        fill="none"
        stroke={line}
        strokeWidth={STROKE_WIDTH}
      />
      <Path
        d="M36 66 L110 66 M62 44 L62 94"
        stroke={mutedLine}
        strokeWidth={1.8}
        strokeDasharray="3.5 3.5"
        strokeLinecap="round"
      />

      <Circle
        cx={72}
        cy={61}
        r={23}
        fill={tint}
        fillOpacity={0.16}
        stroke={line}
        strokeWidth={STROKE_WIDTH}
      />
      <Path
        d="M60 50 A15 15 0 0 1 77 46"
        fill="none"
        stroke={mutedLine}
        strokeWidth={1.9}
        strokeLinecap="round"
      />

      <Path
        d="M72 50 C67.8 50 64.5 53.3 64.5 57.5 C64.5 63.2 72 70 72 70 C72 70 79.5 63.2 79.5 57.5 C79.5 53.3 76.2 50 72 50 Z"
        fill="none"
        stroke={line}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={72} cy={57.5} r={2.3} fill={line} />

      <Path d="M89 78 L113 102" stroke={line} strokeWidth={5.2} strokeLinecap="round" />

      <Circle cx={126} cy={44} r={2.2} fill={mutedLine} />
      <Path
        d="M124 60 L124 66 M121 63 L127 63"
        stroke={mutedLine}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
