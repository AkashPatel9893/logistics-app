import { AppPressable } from './app-pressable';
import { AppView } from './app-view';
import { Icon } from './icon';

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  disabled?: boolean;
}

const ACTIVE_COLOR = '#FF5A1F';
const INACTIVE_COLOR = '#D1D5DB';

/** Tappable 1–N star rating; renders read-only when `onChange` is omitted or disabled. */
export function StarRating({
  value,
  onChange,
  max = 5,
  size = 28,
  disabled = false,
}: StarRatingProps) {
  const isInteractive = !!onChange && !disabled;

  return (
    <AppView
      className="flex-row gap-2"
      accessibilityRole={isInteractive ? 'adjustable' : 'text'}
      accessibilityLabel={`${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= value;
        return (
          <AppPressable
            key={starValue}
            disabled={!isInteractive}
            onPress={() => onChange?.(starValue)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Icon
              name={isFilled ? 'star.fill' : 'star'}
              size={size}
              color={isFilled ? ACTIVE_COLOR : INACTIVE_COLOR}
            />
          </AppPressable>
        );
      })}
    </AppView>
  );
}
