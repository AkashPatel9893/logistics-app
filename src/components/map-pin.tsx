import { AppView, Circle, Path, Svg } from '@/components/ui';

// Measured from the top of the box. Twice the distance down to the tip keeps the teardrop tip
// exactly at the centre of the 34x78 box, where map markers anchor.
const BOX_WIDTH = 34;
const BOX_HEIGHT = 78;

/** A map pin (teardrop) with an arrow inside. Its tip sits at the centre of the box, on the coordinate. */
export function MapPin({ color, arrow }: { color: string; arrow: 'up' | 'down' }) {
  const arrowPath =
    arrow === 'down'
      ? 'M17 10.5 V21 M12.75 16.75 L17 21 L21.25 16.75'
      : 'M17 21.5 V11 M12.75 15.25 L17 11 L21.25 15.25';

  return (
    <AppView collapsable={false} accessible={false} className="h-[78px] w-[34px]">
      <Svg width={BOX_WIDTH} height={BOX_HEIGHT} viewBox="0 0 34 78">
        {/* Outer white outline: teardrop tip at (17, 39) */}
        <Path d="M4 23 L30 23 L17 39 Z" fill="#FFFFFF" />
        <Circle cx={17} cy={16} r={15} fill="#FFFFFF" />

        {/* Colored fill inset by 2px */}
        <Path d="M6.5 23 L27.5 23 L17 35.8 Z" fill={color} />
        <Circle cx={17} cy={16} r={13} fill={color} />

        {/* Centered directional arrow */}
        <Path
          d={arrowPath}
          stroke="#FFFFFF"
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </AppView>
  );
}

export const PICKUP_PIN_COLOR = '#16A34A';
export const DROP_PIN_COLOR = '#E5484D';
