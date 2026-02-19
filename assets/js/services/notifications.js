/* Ruta: /assets/js/services/notifications.js
   Descripción: Servicio global para la gestión de notificaciones (Toasts) con estética premium. */

/**
 * Servicio de Notificaciones Vértice
 * Permite lanzar avisos visuales elegantes en toda la aplicación.
 */
class NotificationService {
    constructor() {
        this.containerId = 'vrt-toast-container';
        this.container = null;
        this.createContainer();
    }

    /**
     * Crea el contenedor principal si no existe
     */
    createContainer() {
        if (document.getElementById(this.containerId)) {
            this.container = document.getElementById(this.containerId);
            return;
        }

        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.className = 'vrt-notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Lanza una notificación
     * @param {string} message - Texto a mostrar
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - Tiempo en ms (default 4000)
     */
    show(message, type = 'success', duration = 4000) {
        if (!this.container) this.createContainer();

        const toast = document.createElement('div');
        toast.className = `vrt-toast vrt-toast-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-triangle-exclamation',
            warning: 'fa-circle-exclamation',
            info: 'fa-circle-info'
        };

        const icon = icons[type] || icons.info;

        toast.innerHTML = `
            <div class="vrt-toast-content">
                <i class="fa-solid ${icon}"></i>
                <span class="vrt-toast-message">${message}</span>
            </div>
            <div class="vrt-toast-progress"></div>
        `;

        this.container.appendChild(toast);

        // Autofundido y eliminación
        setTimeout(() => {
            toast.classList.add('vrt-toast-exit');
            setTimeout(() => toast.remove(), 500);
        }, duration);

        // Permitir cerrar al click
        toast.onclick = () => {
            toast.classList.add('vrt-toast-exit');
            setTimeout(() => toast.remove(), 500);
        };
    }
}

// Exportar instancia única
const notifications = new NotificationService();
export default notifications;

// Para acceso global rápido (opcional pero útil en JS inline)
window.VRT = window.VRT || {};
window.VRT.showNotification = (msg, type, duration) => notifications.show(msg, type, duration);
