import React from 'react';
import { Modal as RNModal, ModalProps as RNModalProps } from 'react-native';

import { AppPressable } from '@/components/ui/app-pressable';
import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { cn } from '@/lib/cn';

export interface ModalProps extends RNModalProps {
  isOpen?: boolean;
  title?: string;
  onClose?: () => void;
  className?: string;
}

export function Modal({
  isOpen = false,
  title,
  onClose,
  className,
  children,
  ...props
}: ModalProps) {
  return (
    <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={onClose} {...props}>
      <AppView className="flex-1 justify-center items-center bg-black/50 px-5">
        <AppPressable
          onPress={onClose}
          className="absolute inset-0"
          accessibilityLabel="Close modal overlay"
        />

        <AppView
          className={cn(
            'w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-xl border border-neutral-100 dark:border-neutral-800 z-10',
            className,
          )}
        >
          {title && (
            <AppView className="flex-row items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
              <AppText variant="heading">{title}</AppText>
              {onClose && (
                <AppPressable
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
                >
                  <AppText className="text-sm font-bold text-neutral-500">✕</AppText>
                </AppPressable>
              )}
            </AppView>
          )}

          {children}
        </AppView>
      </AppView>
    </RNModal>
  );
}
