import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView as RNGestureHandlerRootView,
  ScrollView as RNGHScrollView,
} from 'react-native-gesture-handler';
import { withUniwind } from 'uniwind';

export const GestureHandlerRootView = withUniwind(RNGestureHandlerRootView);
export const GestureScrollView = withUniwind(RNGHScrollView, {
  style: { fromClassName: 'className' },
  contentContainerStyle: { fromClassName: 'contentContainerClassName' },
});
export { Gesture, GestureDetector };
