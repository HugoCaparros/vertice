/**
 * DETALLE DE OBRA - CONTROLADOR SOCIAL (Feed Style)
 * Transforma la vista en una publicación de red social.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const obraId = params.get('id');

    if (obraId) {
        initObraDetalle(obraId);
    } else {
        console.error("No se encontró el ID de la obra en la URL");
    }
});

/**
 * Inicializa la carga de la obra con estructura de Post de Red Social
 */
async function initObraDetalle(obraId) {
    const content = document.getElementById('detalle-content');
    if (!content) return;

    content.innerHTML = `<div class="loader-v">Cargando publicación...</div>`;

    try {
        const obra = await DataLoader.getObraCompleta(obraId);
        const root = DataLoader.getAssetPath();
        const cleanPath = obra.imagen.replace(/^(\.\/|\/|\.\.\/)+/, '');
        const finalImgUrl = root + cleanPath;

        // Renderizado estilo Instagram (Post)
        content.innerHTML = `
            <article class="instagram-post">
                <header class="post-header">
                    <div class="user-avatar">${obra.artista_data?.nombre.charAt(0) || 'V'}</div>
                    <div class="user-info">
                        <span class="username">${obra.artista_data?.nombre || 'Artista Vértice'}</span>
                        <span class="location">Galería Vértice • ${obra.categoria_id.toUpperCase()}</span>
                    </div>
                    <button class="more-options"><i class="fa-solid fa-ellipsis"></i></button>
                </header>

                <div class="post-media" ondblclick="toggleLike('${obra.id}')">
                    <img src="${finalImgUrl}" alt="${obra.titulo}" class="main-featured-img">
                </div>

                <div class="post-actions">
                    <div class="main-actions">
                        <button onclick="toggleLike('${obra.id}')" class="action-btn">
                            <i id="like-icon-${obra.id}" class="fa-regular fa-heart"></i>
                        </button>
                        <button class="action-btn" onclick="focusComment()">
                            <i class="fa-regular fa-comment"></i>
                        </button>
                        <button class="action-btn" onclick="shareSocial()">
                            <i class="fa-regular fa-paper-plane"></i>
                        </button>
                    </div>
                    <button class="action-btn save-btn" onclick="saveToCollection('${obra.id}')">
                        <i id="save-icon-${obra.id}" class="fa-regular fa-bookmark"></i>
                    </button>
                </div>

                <div class="post-content">
                    <p class="likes-count">Les gusta a <strong>vertice_gallery</strong> y <strong>otros</strong></p>
                    
                    <div class="post-caption">
                        <strong>${(obra.artista_data?.nombre || 'artista').toLowerCase().replace(/\s/g, '_')}</strong> 
                        <span class="social-title">${obra.titulo}</span>
                        <p class="description-text">${obra.descripcion}</p>
                    </div>

                    <div class="post-tech-specs">
                        <span>#${obra.tecnica.replace(/\s/g, '')}</span> 
                        <span>#${obra.anio}</span> 
                        <span>#VérticeExhibition</span>
                    </div>
                </div>
            </article>
        `;

        // Cargar componentes adicionales (Comentarios estilo feed y relacionados)
        if (typeof renderComments === "function") renderComments(obraId);
        if (typeof loadRelated === "function") loadRelated(obra.categoria_id, obra.id);

    } catch (e) {
        console.error("Error cargando post:", e);
        content.innerHTML = `<div class="error-toast">Error: No se pudo cargar la publicación.</div>`;
    }
}

/**
 * Interacción de Like (Cambia a rojo solo el corazón relleno)
 */
window.toggleLike = (id) => {
    const icon = document.getElementById(`like-icon-${id}`);
    if (!icon) return;

    const isLiked = icon.classList.contains('fa-regular');
    
    if (isLiked) {
        icon.classList.replace('fa-regular', 'fa-solid');
        icon.style.color = '#ed4956'; // Rojo Instagram (solo para el corazón activo)
        // Podrías añadir una pequeña animación de escala aquí
        icon.style.transform = 'scale(1.2)';
        setTimeout(() => icon.style.transform = 'scale(1)', 150);
    } else {
        icon.classList.replace('fa-solid', 'fa-regular');
        icon.style.color = 'inherit';
    }
};

/**
 * Guardar en colección (Bookmark)
 */
window.saveToCollection = (id) => {
    const icon = document.getElementById(`save-icon-${id}`);
    if (!icon) return;
    icon.classList.toggle('fa-regular');
    icon.classList.toggle('fa-solid');
};

/**
 * Foco en el input de comentarios
 */
window.focusComment = () => {
    const input = document.getElementById('user-comment');
    if (input) input.focus();
};

/**
 * Compartir Publicación
 */
window.shareSocial = () => {
    if (navigator.share) {
        navigator.share({
            title: 'VÉRTICE | Arte Digital',
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Enlace copiado al portapapeles");
    }
};

/**
 * Copiar enlace (Función de utilidad)
 */
window.copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
};