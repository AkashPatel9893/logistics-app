import { AppView, Circle, G, Rect, Svg } from '@/components/ui';
import { DROP_PIN_COLOR, MapPin, PICKUP_PIN_COLOR } from '@/components/map-pin';

/** Pickup: a green map pin. */
export function PickupMarker() {
  return <MapPin color={PICKUP_PIN_COLOR} arrow="up" />;
}

/** Drop: a red map pin. */
export function DropMarker() {
  return <MapPin color={DROP_PIN_COLOR} arrow="down" />;
}

const BODY = '#FF5A1F';
const DARK = '#23272F';
const GLASS = '#9CC9F0';

/** Top-down truck / pickup, facing up: cab at the front, open load bed behind. */
function TruckTopDown() {
  return (
    <Svg width={22} height={38} viewBox="0 0 34 60">
      {/* Wheels */}
      <Rect x={0} y={8} width={5} height={12} rx={2.5} fill="#111111" />
      <Rect x={29} y={8} width={5} height={12} rx={2.5} fill="#111111" />
      <Rect x={0} y={40} width={5} height={12} rx={2.5} fill="#111111" />
      <Rect x={29} y={40} width={5} height={12} rx={2.5} fill="#111111" />

      {/* Load bed */}
      <Rect
        x={3}
        y={24}
        width={28}
        height={36}
        rx={6}
        fill={DARK}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      <Rect x={8} y={29} width={18} height={26} rx={3} fill="#3A404B" />

      {/* Cab */}
      <Rect
        x={3}
        y={3}
        width={28}
        height={26}
        rx={8}
        fill={BODY}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      <Rect x={7} y={8} width={20} height={8} rx={3} fill={GLASS} />
      <Rect x={9} y={21} width={16} height={4} rx={2} fill="rgba(255,255,255,0.35)" />

      {/* Headlights */}
      <Rect x={7} y={1} width={5} height={3} rx={1.5} fill="#FFE08A" />
      <Rect x={22} y={1} width={5} height={3} rx={1.5} fill="#FFE08A" />
    </Svg>
  );
}

/** Top-down delivery scooter: rider, handlebar and the cargo box on the back. */
function ScooterTopDown() {
  return (
    <Svg width={22} height={38} viewBox="0 0 34 60">
      {/* Cargo box */}
      <Rect
        x={4}
        y={34}
        width={26}
        height={24}
        rx={6}
        fill={BODY}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      {/* Body */}
      <Rect
        x={11}
        y={6}
        width={12}
        height={40}
        rx={6}
        fill={DARK}
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      {/* Handlebar */}
      <Rect
        x={1}
        y={10}
        width={32}
        height={4}
        rx={2}
        fill="#111111"
        stroke="#FFFFFF"
        strokeWidth={1}
      />
      {/* Rider shoulders & helmet */}
      <Rect x={5} y={18} width={24} height={14} rx={7} fill="#FFFFFF" />
      <Rect x={7} y={18} width={20} height={12} rx={6} fill="#3B82F6" />
      <Circle cx={17} cy={28} r={6} fill={BODY} stroke="#FFFFFF" strokeWidth={1.5} />
      {/* Headlight */}
      <Rect x={14.5} y={1} width={5} height={3} rx={1.5} fill="#FFE08A" />
    </Svg>
  );
}

/** Top-down three-wheeler: one front wheel, wide rear cargo body. */
function AutoTopDown() {
  return (
    <Svg width={22} height={38} viewBox="0 0 34 60">
      {/* Wheels */}
      <Rect x={14.5} y={1} width={5} height={12} rx={2.5} fill="#111111" />
      <Rect x={0} y={40} width={5} height={12} rx={2.5} fill="#111111" />
      <Rect x={29} y={40} width={5} height={12} rx={2.5} fill="#111111" />
      {/* Cab */}
      <Rect
        x={6}
        y={8}
        width={22}
        height={14}
        rx={6}
        fill={BODY}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      <Rect x={10} y={12} width={14} height={5} rx={2} fill={GLASS} />
      {/* Rear cargo body */}
      <Rect
        x={2}
        y={24}
        width={30}
        height={34}
        rx={6}
        fill={DARK}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      <Rect x={7} y={29} width={20} height={24} rx={3} fill="#3A404B" />
    </Svg>
  );
}

/**
 * The moving vehicle, drawn from above and facing north; the map turns it to the driver's heading
 * (`rotation` on a flat marker). The shape follows the vehicle type.
 */
export function VehicleMarker({ vehicleName }: { vehicleName: string }) {
  const kind = vehicleKind(vehicleName);
  return (
    <AppView center collapsable={false} className="h-[52px] w-[44px]">
      {kind === 'bike' ? <ScooterTopDown /> : kind === 'auto' ? <AutoTopDown /> : <TruckTopDown />}
    </AppView>
  );
}

export function vehicleKind(vehicleName: string): 'bike' | 'auto' | 'truck' {
  const name = vehicleName.toLowerCase();
  if (name.includes('2 wheel') || name.includes('bike')) return 'bike';
  if (name.includes('3 wheel')) return 'auto';
  return 'truck';
}

/** The signed-in driver's own position on their map. */
export function SelfMarker() {
  return (
    <AppView center collapsable={false} className="size-9">
      <Svg width={36} height={36} viewBox="0 0 36 36">
        <G>
          <Circle cx={18} cy={18} r={18} fill="rgba(14, 165, 233, 0.25)" />
          <Circle cx={18} cy={18} r={7} fill="#0EA5E9" stroke="#FFFFFF" strokeWidth={2} />
        </G>
      </Svg>
    </AppView>
  );
}
