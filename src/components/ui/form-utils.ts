export interface FieldMeta {
  isTouched?: boolean;
  errors?: unknown[];
  error?: unknown;
}

export interface FormFieldLike {
  state?: {
    meta?: FieldMeta;
  };
}

export function getFieldError(
  field: FormFieldLike | string | unknown[] | null | undefined,
): string | undefined {
  if (!field) return undefined;

  if (typeof field === 'string') {
    return field.length > 0 ? field : undefined;
  }

  if (Array.isArray(field)) {
    const first = field[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && first !== null && 'message' in first) {
      return String((first as { message: unknown }).message);
    }
    return undefined;
  }

  if (typeof field === 'object' && field !== null && 'state' in field) {
    const meta = (field as FormFieldLike).state?.meta;

    if (meta?.isTouched === false) {
      return undefined;
    }

    if (Array.isArray(meta?.errors) && meta.errors.length > 0) {
      const firstError = meta.errors[0];
      if (typeof firstError === 'string') return firstError;
      if (typeof firstError === 'object' && firstError !== null && 'message' in firstError) {
        return String((firstError as { message: unknown }).message);
      }
    }

    if (meta?.error) {
      if (typeof meta.error === 'string') return meta.error;
      if (typeof meta.error === 'object' && 'message' in meta.error) {
        return String((meta.error as { message: unknown }).message);
      }
    }
  }

  return undefined;
}
