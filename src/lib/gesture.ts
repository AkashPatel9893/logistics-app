import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView as RNGestureHandlerRootView,
} from 'react-native-gesture-handler';
import { withUniwind } from 'uniwind';

export const GestureHandlerRootView = withUniwind(RNGestureHandlerRootView);
export { Gesture, GestureDetector };
