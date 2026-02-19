import DataLoader from '../services/dataLoader.js';
import notifications from '../services/notifications.js';

/**
 * FAVORITES MANAGER
 * Centraliza la lógica de interacción para obras y artistas.
 */
const FavoritesManager = {
    
    /**
     * Alterna el estado de favorito de una obra
     */
    async toggleObra(id, iconEl = null) {
        const success = DataLoader.toggleFavorite(id);
        if (!success) {
            notifications.show("Debes iniciar sesión para guardar favoritos", "warning");
            if (window.showAuthModal) window.showAuthModal('../../');
            return false;
        }

        const isFav = DataLoader.isFavorite(id);
        
        // Actualizar icono si existe
        if (iconEl) {
            this.updateIcon(iconEl, isFav, 'heart');
        }

        const msg = isFav ? 'Obra añadida a favoritos' : 'Obra eliminada de tu colección';
        notifications.show(msg, isFav ? 'success' : 'error');
        
        return isFav;
    },

    /**
     * Alterna el estado de seguimiento de un artista
     */
    async toggleArtista(id, btnEl = null, iconEl = null) {
        const success = DataLoader.toggleFollowArtist(id);
        if (!success) {
            notifications.show("Debes iniciar sesión para seguir artistas", "warning");
            if (window.showAuthModal) window.showAuthModal('../../');
            return false;
        }

        const isFollowing = DataLoader.isFollowingArtist(id);

        if (btnEl) {
            btnEl.textContent = isFollowing ? 'SIGUIENDO' : 'SEGUIR ARTISTA';
            btnEl.classList.toggle('following', isFollowing);
        }

        if (iconEl) {
            this.updateIcon(iconEl, isFollowing, 'star');
        }

        const msg = isFollowing ? 'Siguiendo al artista' : 'Has dejado de seguir al artista';
        notifications.show(msg, isFollowing ? 'success' : 'error');

        return isFollowing;
    },

    /**
     * Actualiza el estado visual de un icono (FontAwesome)
     */
    updateIcon(el, active, type = 'heart') {
        const baseClass = type === 'heart' ? 'fa-heart' : 'fa-star';
        if (active) {
            el.classList.replace('fa-regular', 'fa-solid');
            if (type === 'heart') el.style.color = 'var(--color-rojo)';
        } else {
            el.classList.replace('fa-solid', 'fa-regular');
            el.style.color = '';
        }
        
        // Micro-animación
        el.style.transform = 'scale(1.2)';
        setTimeout(() => el.style.transform = 'scale(1)', 150);
    },

    /**
     * Sincroniza el estado inicial al cargar una página
     */
    syncUI(id, type = 'obra', elements = {}) {
        if (type === 'obra') {
            const isFav = DataLoader.isFavorite(id);
            if (elements.icon) this.updateIcon(elements.icon, isFav, 'heart');
        } else {
            const isFollowing = DataLoader.isFollowingArtist(id);
            if (elements.btn) {
                elements.btn.textContent = isFollowing ? 'SIGUIENDO' : 'SEGUIR ARTISTA';
                elements.btn.classList.toggle('following', isFollowing);
            }
            if (elements.icon) this.updateIcon(elements.icon, isFollowing, 'star');
        }
    }
};

export default FavoritesManager;
window.FavoritesManager = FavoritesManager;
