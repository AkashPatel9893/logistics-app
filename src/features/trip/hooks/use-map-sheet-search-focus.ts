import { useRef, useState } from 'react';

import type { AppTextInputInstance } from '@/components/ui';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { Keyboard } from '@/lib/native';

export function useMapSheetSearchFocus() {
  const keyboardHeight = useKeyboardHeight();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isTypingInSheet = keyboardHeight > 0 && !isSearchFocused;

  const [isSheetCollapsed, setIsSheetCollapsed] = useState(true);
  const searchInputRef = useRef<AppTextInputInstance>(null);
  const focusSearchAfterCollapseRef = useRef(false);

  const requestSearchFocus = () => {
    focusSearchAfterCollapseRef.current = true;
    setIsSheetCollapsed(true);
  };

  const handleSheetCollapsed = () => {
    if (!focusSearchAfterCollapseRef.current) return;
    focusSearchAfterCollapseRef.current = false;
    searchInputRef.current?.focus();
  };

  const reopenSheet = () => {
    Keyboard.dismiss();
    setIsSheetCollapsed(false);
  };

  return {
    isSheetCollapsed,
    setIsSheetCollapsed,
    isSearchFocused,
    setIsSearchFocused,
    isTypingInSheet,
    keyboardHeight,
    searchInputRef,
    requestSearchFocus,
    handleSheetCollapsed,
    reopenSheet,
  };
}
