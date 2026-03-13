/**
 * Centralised API error handler.
 * Shows a red toast popup centered on screen that auto-dismisses.
 */
export function handleApiError(err: unknown, message?: string): void {
    const text = message ?? (err instanceof Error ? err.message : 'An unexpected error occurred');

    const toast = document.createElement('div');
    toast.className = 'app-error-toast';
    toast.textContent = text;

    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.add('app-error-toast--visible'); });

    setTimeout(() => {
        toast.classList.remove('app-error-toast--visible');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}
