import { StatusBar, StatusBarProps } from 'expo-status-bar';
import React from 'react';

export function FocusAwareStatusBar(props: StatusBarProps) {
  return <StatusBar {...props} />;
}
