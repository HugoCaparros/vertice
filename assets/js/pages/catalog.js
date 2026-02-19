import DataLoader from '../services/dataLoader.js';

/**
 * Inicializa la página del catálogo general (obras.html).
 */
export async function initGeneralCatalog() {
    const container = document.getElementById('gallery-container');
    if (!container) return;

    try {
        container.innerHTML = '<p class="loading-msg">Cargando obras...</p>';
        
        // Obtener obras desde el servicio
        const obras = await DataLoader.getObras();
        
        if (!obras || obras.length === 0) {
            container.innerHTML = '<p class="error-msg">No se encontraron obras disponibles.</p>';
            return;
        }

        renderArtworks(obras, container);
    } catch (error) {
        console.error("❌ Error inicializando el catálogo:", error);
        container.innerHTML = '<p class="error-msg">Hubo un error al cargar las obras.</p>';
    }
}

/**
 * Renderiza el HTML de las tarjetas de obras.
 */
function renderArtworks(obras, container) {
    container.innerHTML = ""; // Limpiar contenedor

    const html = obras.map(obra => {
        const precioFormateado = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(obra.precio || 0);

        const isLiked = DataLoader.isFavorite(obra.id.toString());

        return `
            <div class="cat-card">
                <div class="cat-card-img-wrapper">
                    ${obra.nuevo ? '<span class="cat-card-badge">NUEVO</span>' : ''}
                    <img src="${DataLoader.getAssetPath()}${obra.imagen}" alt="${obra.titulo}" class="cat-card-img" loading="lazy">
                    <button class="card-like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(event, '${obra.id}')">
                        <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                </div>
                <div class="cat-card-info">
                    <span class="cat-card-artist">${obra.artista || 'Artista Desconocido'}</span>
                    <h3 class="cat-card-title">${obra.titulo}</h3>
                    <div class="info-secondary">
                        <span>${obra.tecnica || 'Técnica Mixta'}</span>
                        <span>•</span>
                        <span>${obra.ano || '2024'}</span>
                    </div>
                    <span class="info-price">${precioFormateado}</span>
                </div>
                <a href="obra-detalle.html?id=${obra.id}" class="card-overlay-link"></a>
            </div>
        `;
    }).join("");

    container.innerHTML = html;
}

// Global para eventos inline
window.initGeneralCatalog = initGeneralCatalog;
window.toggleLike = (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    
    const success = DataLoader.toggleFavorite(id.toString());
    if (!success) {
        if (window.showAuthModal) {
            const base = DataLoader.getBasePath();
            let rootPath = base.replace('assets/data/', '');
            if (rootPath === base) rootPath = base.replace('data/', '').replace('assets/', '');
            window.showAuthModal(rootPath);
        }
        return;
    }

    const btn = event.currentTarget.closest('.card-like-btn');
    const icon = btn.querySelector('i');
    btn.classList.toggle('liked');
    if (btn.classList.contains('liked')) {
        icon.classList.replace('fa-regular', 'fa-solid');
    } else {
        icon.classList.replace('fa-solid', 'fa-regular');
    }
};
