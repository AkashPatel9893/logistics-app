import NativeSegmentedControl from '@expo/ui/community/segmented-control';
import type { StyleProp, ViewStyle } from 'react-native';
import { useUniwind } from 'uniwind';

import { useThemeColor } from '@/hooks/use-theme-color';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * App segmented control: a typed value/options API over the native
 * `@expo/ui` segmented control (SwiftUI on iOS, Compose on Android).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  style,
  testID,
}: SegmentedControlProps<T>) {
  const { theme } = useUniwind();
  const brandColor = useThemeColor('brand');
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <NativeSegmentedControl
      values={options.map((option) => option.label)}
      selectedIndex={selectedIndex}
      enabled={!disabled}
      tintColor={brandColor}
      appearance={theme === 'dark' ? 'dark' : 'light'}
      onChange={(event) => {
        const next = options[event.nativeEvent.selectedSegmentIndex];
        if (next && next.value !== value) onChange(next.value);
      }}
      style={[{ minHeight: 36 }, style]}
      testID={testID}
    />
  );
}
