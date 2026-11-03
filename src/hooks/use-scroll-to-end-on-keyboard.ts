import { useEffect, useRef, type ComponentRef } from 'react';
import { Keyboard, ScrollView } from 'react-native';

/**
 * For a form at the bottom of a scroll view: brings it above the keyboard when the keyboard opens,
 * so the field being typed in and its submit button stay visible.
 */
export function useScrollToEndOnKeyboard() {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => subscription.remove();
  }, []);

  return scrollRef;
}
