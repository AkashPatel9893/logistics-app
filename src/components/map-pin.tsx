import { AppView } from '@/components/ui';

// Measured from the top of the box. The body and tip are separate shapes, one on top of the other
// for the white outline, so that nothing needs rotating: Android snapshots a marker into a bitmap
// using the unrotated layout, which cut the tip off a rotated square.
const BOX_WIDTH = 34;
const TOP_MARGIN = 1;
const OUTLINE = 2;
const BODY = 30;
const TIP_TOP = 22;
const OUTER_TIP = { halfWidth: 13, height: 16 };
const INNER_TIP = { halfWidth: 10.5, height: 12.8 };
/** Twice the distance down to the tip, so the tip sits at the centre, where markers anchor. */
const BOX_HEIGHT = 2 * (TOP_MARGIN + TIP_TOP + OUTER_TIP.height);

const ARROW_BOX = 14;
const ARROW_STROKE = 3;
const ARROW_COLOR = '#FFFFFF';

/** Drawn from shapes, not an arrow character: a font's glyph overflows its line box and gets cut off. */
function PinArrow({ direction }: { direction: 'up' | 'down' }) {
  const bar = {
    position: 'absolute',
    width: ARROW_STROKE,
    borderRadius: ARROW_STROKE / 2,
    backgroundColor: ARROW_COLOR,
  } as const;
  return (
    <AppView
      collapsable={false}
      style={{
        position: 'absolute',
        left: (BOX_WIDTH - ARROW_BOX) / 2,
        top: TOP_MARGIN + (BODY - ARROW_BOX) / 2,
        width: ARROW_BOX,
        height: ARROW_BOX,
        transform: [{ rotate: direction === 'up' ? '0deg' : '180deg' }],
      }}
    >
      <AppView style={{ ...bar, left: 5.5, top: 2, height: 11 }} />
      <AppView
        style={{ ...bar, left: 2.75, top: 0.25, height: 9, transform: [{ rotate: '45deg' }] }}
      />
      <AppView
        style={{ ...bar, left: 8.25, top: 0.25, height: 9, transform: [{ rotate: '-45deg' }] }}
      />
    </AppView>
  );
}

function PinTip({
  color,
  halfWidth,
  height,
}: {
  color: string;
  halfWidth: number;
  height: number;
}) {
  return (
    <AppView
      style={{
        position: 'absolute',
        left: BOX_WIDTH / 2 - halfWidth,
        top: TOP_MARGIN + TIP_TOP,
        width: 0,
        height: 0,
        borderLeftWidth: halfWidth,
        borderRightWidth: halfWidth,
        borderTopWidth: height,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: color,
      }}
    />
  );
}

function PinBody({ color, inset }: { color: string; inset: number }) {
  const size = BODY - inset * 2;
  return (
    <AppView
      style={{
        position: 'absolute',
        left: (BOX_WIDTH - size) / 2,
        top: TOP_MARGIN + inset,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

/** A map pin (teardrop) with an arrow inside. Its tip sits at the centre of the box, on the coordinate. */
export function MapPin({ color, arrow }: { color: string; arrow: 'up' | 'down' }) {
  return (
    <AppView
      collapsable={false}
      accessible={false}
      style={{ width: BOX_WIDTH, height: BOX_HEIGHT }}
    >
      <PinTip color="#FFFFFF" {...OUTER_TIP} />
      <PinBody color="#FFFFFF" inset={0} />
      <PinTip color={color} {...INNER_TIP} />
      <PinBody color={color} inset={OUTLINE} />
      <PinArrow direction={arrow} />
    </AppView>
  );
}

export const PICKUP_PIN_COLOR = '#16A34A';
export const DROP_PIN_COLOR = '#E5484D';
