import { AxiosError } from 'axios';
import type { ApiErrorBody } from '@/utils/types';

/** Extracts a human-readable message from an Axios/API error. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.details?.length) {
      return body.details.join('; ');
    }
    if (body?.message) {
      return body.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

/** Returns the HTTP status code of an Axios error, or null if not an Axios error. */
export function getApiErrorStatus(error: unknown): number | null {
  if (error instanceof AxiosError) {
    return error.response?.status ?? null;
  }
  return null;
}
