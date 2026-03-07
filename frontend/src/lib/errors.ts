/**
 * Centralised API error handler.
 * Shows a red toast popup centered on screen that auto-dismisses.
 */
export function handleApiError(err: unknown, message?: string): void {
    const text = message ?? (err instanceof Error ? err.message : 'An unexpected error occurred');

    const toast = document.createElement('div');
    toast.textContent = text;
    Object.assign(toast.style, {
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#f8d7da',
        color: '#842029',
        padding: '12px 24px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '400',
        zIndex: '10000',
        border: '1px solid #f5c2c7',
        opacity: '0',
        transition: 'opacity 0.2s ease',
        textAlign: 'center',
        maxWidth: '80vw',
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}
