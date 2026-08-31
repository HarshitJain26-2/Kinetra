export function sanitizeAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const message = (typeof error === 'string' ? error : error.message || '').toLowerCase();
  const status = error.status;

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Email or password is incorrect.';
  }

  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'An account with this email already exists. Please sign in.';
  }

  if (message.includes('password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }

  if (message.includes('rate limit') || status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
    return 'Something went wrong. Check your connection and try again.';
  }

  if (message.includes('email not confirmed')) {
    return 'Please check your email and confirm your account before signing in.';
  }

  return 'Unable to complete request. Please verify your details and try again.';
}
