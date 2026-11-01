import { AppView } from '@/components/ui';
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

function Wheel({ style }: { style: object }) {
  return (
    <AppView
      style={[
        { position: 'absolute', width: 5, height: 12, borderRadius: 2.5, backgroundColor: '#111' },
        style,
      ]}
    />
  );
}

/** Top-down truck / pickup, facing up: cab at the front, open load bed behind. */
function TruckTopDown() {
  return (
    <AppView style={{ width: 34, height: 60 }}>
      <Wheel style={{ left: 0, top: 8 }} />
      <Wheel style={{ right: 0, top: 8 }} />
      <Wheel style={{ left: 0, top: 40 }} />
      <Wheel style={{ right: 0, top: 40 }} />
      {/* Load bed */}
      <AppView
        style={{
          position: 'absolute',
          left: 3,
          right: 3,
          top: 24,
          bottom: 0,
          borderRadius: 6,
          backgroundColor: DARK,
          borderWidth: 2,
          borderColor: '#fff',
        }}
      >
        <AppView style={{ flex: 1, margin: 3, borderRadius: 3, backgroundColor: '#3A404B' }} />
      </AppView>
      {/* Cab */}
      <AppView
        style={{
          position: 'absolute',
          left: 3,
          right: 3,
          top: 3,
          height: 26,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          backgroundColor: BODY,
          borderWidth: 2,
          borderColor: '#fff',
        }}
      >
        <AppView
          style={{
            marginTop: 3,
            marginHorizontal: 2,
            height: 8,
            borderRadius: 3,
            backgroundColor: GLASS,
          }}
        />
        <AppView
          style={{
            marginTop: 5,
            marginHorizontal: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.35)',
          }}
        />
      </AppView>
      {/* Headlights */}
      <AppView
        style={{
          position: 'absolute',
          left: 7,
          top: 1,
          width: 5,
          height: 3,
          borderRadius: 2,
          backgroundColor: '#FFE08A',
        }}
      />
      <AppView
        style={{
          position: 'absolute',
          right: 7,
          top: 1,
          width: 5,
          height: 3,
          borderRadius: 2,
          backgroundColor: '#FFE08A',
        }}
      />
    </AppView>
  );
}

/** Top-down delivery scooter: rider, handlebar and the cargo box on the back. */
function ScooterTopDown() {
  return (
    <AppView style={{ width: 34, height: 60, alignItems: 'center' }}>
      {/* Cargo box */}
      <AppView
        style={{
          position: 'absolute',
          top: 34,
          width: 26,
          height: 24,
          borderRadius: 6,
          backgroundColor: BODY,
          borderWidth: 2,
          borderColor: '#fff',
        }}
      />
      {/* Body */}
      <AppView
        style={{
          position: 'absolute',
          top: 6,
          width: 12,
          height: 40,
          borderRadius: 6,
          backgroundColor: DARK,
          borderWidth: 1.5,
          borderColor: '#fff',
        }}
      />
      {/* Handlebar */}
      <AppView
        style={{
          position: 'absolute',
          top: 10,
          width: 32,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#111',
          borderWidth: 1,
          borderColor: '#fff',
        }}
      />
      {/* Rider: shoulders and helmet */}
      <AppView
        style={{
          position: 'absolute',
          top: 18,
          width: 24,
          height: 14,
          borderRadius: 7,
          backgroundColor: '#fff',
        }}
      />
      <AppView
        style={{
          position: 'absolute',
          top: 18,
          width: 20,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#3B82F6',
        }}
      />
      <AppView
        style={{
          position: 'absolute',
          top: 22,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: BODY,
          borderWidth: 1.5,
          borderColor: '#fff',
        }}
      />
      <AppView
        style={{
          position: 'absolute',
          top: 1,
          width: 5,
          height: 3,
          borderRadius: 2,
          backgroundColor: '#FFE08A',
        }}
      />
    </AppView>
  );
}

/** Top-down three-wheeler: one front wheel, wide rear cargo body. */
function AutoTopDown() {
  return (
    <AppView style={{ width: 34, height: 60, alignItems: 'center' }}>
      <Wheel style={{ left: 14.5, top: 1 }} />
      <Wheel style={{ left: 0, top: 40 }} />
      <Wheel style={{ right: 0, top: 40 }} />
      <AppView
        style={{
          position: 'absolute',
          top: 8,
          width: 22,
          height: 14,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          backgroundColor: BODY,
          borderWidth: 2,
          borderColor: '#fff',
        }}
      >
        <AppView
          style={{
            marginTop: 2,
            marginHorizontal: 2,
            height: 5,
            borderRadius: 2,
            backgroundColor: GLASS,
          }}
        />
      </AppView>
      <AppView
        style={{
          position: 'absolute',
          top: 24,
          width: 30,
          height: 34,
          borderRadius: 6,
          backgroundColor: DARK,
          borderWidth: 2,
          borderColor: '#fff',
        }}
      >
        <AppView style={{ flex: 1, margin: 3, borderRadius: 3, backgroundColor: '#3A404B' }} />
      </AppView>
    </AppView>
  );
}

/**
 * The moving vehicle, drawn from above and facing north; the map turns it to the driver's heading
 * (`rotation` on a flat marker). The shape follows the vehicle type.
 */
export function VehicleMarker({ vehicleName }: { vehicleName: string }) {
  const kind = vehicleKind(vehicleName);
  return (
    <AppView center style={{ width: 44, height: 52 }}>
      <AppView style={{ transform: [{ scale: 0.62 }] }}>
        {kind === 'bike' ? (
          <ScooterTopDown />
        ) : kind === 'auto' ? (
          <AutoTopDown />
        ) : (
          <TruckTopDown />
        )}
      </AppView>
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
    <AppView center className="size-9">
      <AppView className="absolute size-9 rounded-full bg-sky-500/25" />
      <AppView className="size-4 rounded-full border-2 border-white bg-sky-500" />
    </AppView>
  );
}
