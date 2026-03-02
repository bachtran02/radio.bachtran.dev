/**
 * Centralised API error handler.
 * Eventually swap the alert() call here for a toast/snackbar notification.
 */
export function handleApiError(err: unknown, message?: string): void {
    const text = message ?? (err instanceof Error ? err.message : 'An unexpected error occurred');
    alert(text);
}
