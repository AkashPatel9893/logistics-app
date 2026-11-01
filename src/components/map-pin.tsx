import { AppText, AppView } from '@/components/ui';

const PIN = 28;

/**
 * A map pin (teardrop) with an arrow inside. The view is laid out so the pin's tip sits at the exact
 * centre of the box, which is where map markers anchor: the tip lands on the coordinate.
 */
export function MapPin({ color, arrow }: { color: string; arrow: 'up' | 'down' }) {
  const size = PIN;
  const box = Math.round(size * 2.5);
  // Distance from the square's centre to its tip once it is turned 45°.
  const tip = Math.round(size * 0.71);
  return (
    <AppView style={{ width: box, height: box }} accessible={false}>
      <AppView
        style={{
          position: 'absolute',
          left: (box - size) / 2,
          top: box / 2 - tip - size / 2,
          width: size,
          height: size,
          backgroundColor: color,
          borderTopLeftRadius: size / 2,
          borderTopRightRadius: size / 2,
          borderBottomLeftRadius: size / 2,
          borderBottomRightRadius: 0,
          transform: [{ rotate: '45deg' }],
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        {/* Turned back so the arrow stays upright inside the rotated pin. */}
        <AppText
          style={{
            transform: [{ rotate: '-45deg' }],
            color: '#FFFFFF',
            fontSize: size * 0.7,
            lineHeight: size * 0.8,
            fontWeight: '900',
          }}
        >
          {arrow === 'up' ? '↑' : '↓'}
        </AppText>
      </AppView>
    </AppView>
  );
}

export const PICKUP_PIN_COLOR = '#16A34A';
export const DROP_PIN_COLOR = '#E5484D';
