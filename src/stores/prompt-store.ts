import { create } from 'zustand';

/** The situations the app explains to the customer, each with its own wording. */
export type LocationPromptKind = 'services-off';

export type LocationPromptChoice = 'primary' | 'secondary';

type PromptState = {
  kind: LocationPromptKind | null;
  resolve: ((choice: LocationPromptChoice) => void) | null;
};

const _usePromptStore = create<PromptState>(() => ({ kind: null, resolve: null }));

export const usePromptStore = _usePromptStore;

/**
 * Shows the location sheet and resolves with the customer's choice. One at a time: a new
 * request while one is open answers the open one with "secondary" first.
 */
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
