import { create } from 'zustand';

export type LocationPromptKind = 'services-off';

export type LocationPromptChoice = 'primary' | 'secondary';

type PromptState = {
  kind: LocationPromptKind | null;
  resolve: ((choice: LocationPromptChoice) => void) | null;
};

const _usePromptStore = create<PromptState>(() => ({ kind: null, resolve: null }));

export const usePromptStore = _usePromptStore;

export function showLocationPrompt(kind: LocationPromptKind): Promise<LocationPromptChoice> {
  return new Promise((resolve) => {
    _usePromptStore.getState().resolve?.('secondary');
    _usePromptStore.setState({ kind, resolve });
  });
}

export function answerLocationPrompt(choice: LocationPromptChoice): void {
  const { resolve } = _usePromptStore.getState();
  _usePromptStore.setState({ kind: null, resolve: null });
  resolve?.(choice);
}
