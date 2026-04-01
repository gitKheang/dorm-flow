export class DomainError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export function toErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
