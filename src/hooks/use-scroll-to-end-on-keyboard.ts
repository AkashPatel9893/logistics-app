import { useEffect, useRef, type ComponentRef } from 'react';
import { Keyboard, ScrollView } from 'react-native';

/**
 * For a form at the bottom of a scroll view: brings it above the keyboard when the keyboard opens,
 * so the field being typed in and its submit button stay visible.
 */
export function useScrollToEndOnKeyboard() {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      // The keyboard-avoiding padding is applied on this same event, so scrolling right away
      // used the old height: on Android the submit button stayed behind the keyboard.
      timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    });
    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, []);

  return scrollRef;
}
