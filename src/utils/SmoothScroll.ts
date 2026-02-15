/** Hace scroll suave hasta el elemento con el id dado. */
export function smoothScroll(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}