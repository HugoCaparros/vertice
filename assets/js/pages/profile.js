import DataLoader from '../services/dataLoader.js';
import notifications from '../services/notifications.js';

/* ==========================================================================
   USER PROFILE LOGIC (ES6 Module)
   Ubicación: assets/js/pages/profile.js
   ========================================================================== */

function safeText(elementId, text) { 
    const el = document.getElementById(elementId); 
    if (el) el.textContent = text; 
}

/**
 * Inicializa la página de perfil con lógica diferenciada y carga masiva
 */
export async function initUserProfile() {
    const usuario = await DataLoader.getUsuarioActual();
    
    if (!usuario) {
        const base = DataLoader.getBasePath();
        window.location.href = base + 'pages/auth/login.html';
        return;
    }

    // 1. Identidad básica (UI Inmediata)
    renderUserIdentity(usuario);

    try {
        // 2. CARGA MASIVA (Simultánea)
        const [obras, artistas] = await Promise.all([
            DataLoader.getObras(),
            DataLoader.getArtistas()
        ]);
        
        console.log(`📦 Datos cargados: ${obras.length} obras, ${artistas.length} artistas.`);

        // 3. Vistas Diferenciadas: Tus Obras (Si es Artista)
        if (usuario.rol === 'Artista') {
            document.getElementById('artist-works-section').style.display = 'block';
            const misObras = obras.filter(o => o.artista_id === usuario.id);
            renderList('artist-works-grid', misObras, renderMiniCard, "Aún no has subido obras.");
        }

        // 4. Secciones Comunes: Favoritos
        const misFavoritos = obras.filter(o => (usuario.favoritos || []).includes(o.id.toString()));
        renderList('favorites-grid', misFavoritos, renderMiniCard, "No tienes obras favoritas todavía.");

        // 5. Secciones Comunes: Artistas Seguidos
        const misSeguidos = artistas.filter(a => (usuario.siguiendo_ids || []).includes(a.id.toString()));
        renderList('artists-grid', misSeguidos, renderArtistMiniCard, "Aún no sigues a ningún artista.");

        // 6. Configurar Modal
        setupModal();

    } catch (error) {
        console.error("❌ Error cargando datos del perfil:", error);
        notifications.show("No pudimos cargar toda la información de tu perfil.", "error");
        showProfileError();
    }
}

function renderUserIdentity(usuario) {
    safeText('user-name', (usuario.nombre || 'CARGANDO...').toUpperCase());
    safeText('user-handle', usuario.handle || usuario.email);
    
    const roleBadge = document.getElementById('user-role-badge');
    if (roleBadge) {
        const role = usuario.rol || 'Coleccionista';
        roleBadge.textContent = role.toUpperCase();
        if (role === 'Artista') roleBadge.classList.add('is-artist');
    }

    const avatarEl = document.getElementById('user-avatar-img');
    const placeholder = document.getElementById('avatar-placeholder');
    if (avatarEl) {
        const avatarPath = usuario.avatar ? DataLoader.getAssetPath() + usuario.avatar : null;
        if (avatarPath) {
            avatarEl.src = avatarPath;
            avatarEl.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        }
    }
}

/**
 * Helper genérico para renderizar listas con mensaje de vacío
 */
function renderList(containerId, data, renderFn, emptyMsg) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<p class="empty-state-msg">${emptyMsg}</p>`;
        return;
    }

    container.innerHTML = data.map(item => renderFn(item)).join("");
}

function renderArtistMiniCard(artist) {
    const base = DataLoader.getAssetPath();
    return `
        <div class="artist-mini-card" onclick="window.location.href='../catalogo/artista-detalle.html?id=${artist.id}'">
            <div class="artist-mini-avatar">
                <img src="${base}${artist.imagen}" alt="${artist.nombre}">
            </div>
            <div class="artist-mini-info">
                <h4>${artist.nombre}</h4>
                <span>${artist.disciplina}</span>
            </div>
        </div>
    `;
}

function renderMiniCard(obra) {
    const base = DataLoader.getAssetPath();
    const isLiked = DataLoader.isFavorite(obra.id.toString());
    
    return `
        <div class="profile-mini-card">
            <div class="mini-card-img-wrapper">
                <img src="${base}${obra.imagen}" alt="${obra.titulo}" loading="lazy">
                <button class="card-like-btn ${isLiked ? 'liked' : ''}" style="top: 10px; right: 10px; width: 32px; height: 32px; font-size: 0.8rem;" onclick="window.toggleLike(event, '${obra.id}')">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
                <a href="../catalogo/obra-detalle.html?id=${obra.id}" class="card-overlay-link"></a>
            </div>
            <div class="mini-card-info">
                <h3>${obra.titulo}</h3>
                <span class="mini-card-artist">${obra.artista || ''}</span>
            </div>
        </div>
    `;
}

function showProfileError() {
    const container = document.querySelector('.profile-main-content');
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Lo sentimos, hubo un error al cargar tu información. Por favor, intenta recargar la página.</p>
                <button onclick="location.reload()" class="btn-profile-edit">REINTENTAR</button>
            </div>
        `;
    }
}

/* ==========================================================================
   LÓGICA DE MODAL PREMIUM
   ========================================================================== */

function setupModal() {
    const modal = document.getElementById('premium-modal');
    const closeBtn = document.getElementById('close-modal');
    if (!modal || !closeBtn) return;

    closeBtn.onclick = closeModal;
    
    // Cerrar al hacer clic fuera del contenedor
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    // Esc tecla para cerrar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
    });
}

async function openModal(type) {
    const modal = document.getElementById('premium-modal');
    const title = document.getElementById('modal-title');
    const grid = document.getElementById('modal-grid');
    const usuario = await DataLoader.getUsuarioActual();
    
    if (!modal || !title || !grid || !usuario) return;

    let data = [];
    let renderFn = null;
    let modalTitle = "";

    if (type === 'obras-artista') {
        const obras = await DataLoader.getObras();
        data = obras.filter(o => o.artista_id === usuario.id);
        renderFn = renderMiniCard;
        modalTitle = "Tus Obras";
    } else if (type === 'obras-favoritas') {
        const obras = await DataLoader.getObras();
        data = obras.filter(o => (usuario.favoritos || []).includes(o.id.toString()));
        renderFn = renderMiniCard;
        modalTitle = "Obras Favoritas";
    } else if (type === 'artistas-favoritos') {
        const artistas = await DataLoader.getArtistas();
        data = artistas.filter(a => (usuario.siguiendo_ids || []).includes(a.id.toString()));
        renderFn = renderArtistMiniCard;
        modalTitle = "Artistas Favoritos";
    }

    title.textContent = modalTitle;
    grid.innerHTML = data.map(item => renderFn(item)).join("");
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
}

function closeModal() {
    const modal = document.getElementById('premium-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Hacer globales
window.initUserProfile = initUserProfile;
window.logout = function() {
    notifications.show("Cerrando sesión en Vértice...", "info");
    setTimeout(() => {
        localStorage.removeItem('usuario_logueado');
        const base = DataLoader.getBasePath();
        window.location.href = base + 'index.html';
    }, 800);
};

// Sincronización de likes en perfil
window.toggleLike = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    
    const btn = event.currentTarget.closest('.card-like-btn');
    const icon = btn.querySelector('i');
    
    const isNowLiked = await FavoritesManager.toggleObra(id, icon);
    btn.classList.toggle('liked', isNowLiked);
    
    // Si estamos en el perfil, tal vez queramos refrescar la lista de favoritos si se quitó uno
    // Pero por UX, es mejor dejarlo y que desaparezca al recargar o refrescar suavemente
};