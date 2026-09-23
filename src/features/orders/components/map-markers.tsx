import type { ImageSourcePropType } from 'react-native';

import { AppImage, AppView } from '@/components/ui';
import { cn } from '@/lib/cn';

/** Moving driver marker: the booked vehicle inside a pulsing brand ring. */
export function DriverMarker({ vehicleImage }: { vehicleImage: ImageSourcePropType }) {
  return (
    <AppView center>
      <AppView className="absolute size-14 rounded-full bg-brand/15" />
      <AppView center className="size-10 rounded-full border-2 border-brand bg-white shadow-md">
        <AppImage source={vehicleImage} contentFit="contain" style={{ width: 26, height: 26 }} />
      </AppView>
    </AppView>
  );
}

export function RouteEndpointMarker({ variant }: { variant: 'pickup' | 'drop' }) {
  return (
    <AppView
      accessibilityLabel={variant === 'pickup' ? 'Pickup point' : 'Drop point'}
      className={cn(
        'size-6 items-center justify-center rounded-full border-2 border-white',
        variant === 'pickup' ? 'bg-pickup' : 'bg-brand',
      )}
    />
  );
}
