import Animated from 'react-native-reanimated';

import { AppView } from './app-view';

/**
 * Reanimated view that keeps Uniwind `className` support — use it for
 * `entering` / `exiting` / `layout` animations and animated styles.
 */
export const AnimatedView = Animated.createAnimatedComponent(AppView);
