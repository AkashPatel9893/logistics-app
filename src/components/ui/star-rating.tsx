import { AppPressable } from './app-pressable';
import { AppView } from './app-view';
import { Icon } from './icon';

export interface StarRatingProps {
  value: number;
  /** Omit for a read-only rating. */
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
}

/** Tappable 1–N star rating; read-only when `onChange` is omitted. */
export function StarRating({ value, onChange, max = 5, size = 28 }: StarRatingProps) {
  const isInteractive = Boolean(onChange);

  return (
    <AppView
      row
      className="gap-2"
      accessibilityRole={isInteractive ? 'adjustable' : 'text'}
      accessibilityLabel={`${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= value;
        const star = (
          <Icon
            name={isFilled ? 'star.fill' : 'star'}
            size={size}
            tone={isFilled ? 'brand' : 'icon-faint'}
          />
        );
        if (!onChange) return <AppView key={starValue}>{star}</AppView>;
        return (
          <AppPressable
            key={starValue}
            onPress={() => onChange(starValue)}
            hitSlop={6}
            accessibilityLabel={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            {star}
          </AppPressable>
        );
      })}
    </AppView>
  );
}
