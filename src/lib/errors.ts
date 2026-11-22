export class AppServiceError extends Error {
  public readonly code: string;
  public readonly status?: number;

  constructor(message: string, code = 'UNKNOWN_ERROR', status?: number) {
    super(message);
    this.name = 'AppServiceError';
    this.code = code;
    this.status = status;
  }
}

export function extractErrorMessage(err: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
  if (err instanceof AppServiceError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message || fallback;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      return msg;
    }
  }
  return fallback;
}
