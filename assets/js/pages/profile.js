import DataLoader from '../services/dataLoader.js';

/* ==========================================================================
   USER PROFILE LOGIC (ES6 Module)
   Ubicación: assets/js/pages/profile.js
   ========================================================================== */

function safeText(elementId, text) { 
    const el = document.getElementById(elementId); 
    if (el) el.textContent = text; 
}

/**
 * Inicializa la página de perfil con lógica diferenciada
 */
export async function initUserProfile() {
    const usuario = await DataLoader.getUsuarioActual();
    
    if (usuario) {
        // 1. Identidad básica
        safeText('user-name', usuario.nombre);
        safeText('user-handle', usuario.handle || usuario.email);
        
        const roleBadge = document.getElementById('user-role-badge');
        if (roleBadge) {
            const role = usuario.rol || 'Coleccionista';
            roleBadge.textContent = role;
            if (role === 'Artista') roleBadge.classList.add('is-artist');
        }

        // 2. Avatar
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

        // 3. Vistas Diferenciadas
        if (usuario.rol === 'Artista') {
            document.getElementById('artist-works-section').style.display = 'block';
            renderArtistWorks(usuario.id);
        }

        // 4. Secciones Comunes
        renderFavorites();
        renderFollowedArtists();
        
    } else {
        // Si no hay usuario y estamos en perfil, el auth guard de layout ya debería habernos sacado,
        // pero por si acaso redirigimos a login.
        const base = DataLoader.getBasePath();
        window.location.href = base + 'pages/auth/login.html';
    }
}

/**
 * Renderiza las obras que pertenecen al artista logueado
 */
async function renderArtistWorks(artistaId) {
    const container = document.getElementById('artist-works-grid');
    if (!container) return;

    try {
        const artista = await DataLoader.getArtistaCompleto(artistaId);
        if (!artista || !artista.lista_obras || artista.lista_obras.length === 0) {
            container.innerHTML = `<p class="text-muted">Aún no has subido obras.</p>`;
            return;
        }

        container.innerHTML = artista.lista_obras.map(o => renderMiniCard(o)).join("");
    } catch (e) { console.error(e); }
}

/**
 * Renderiza las obras marcadas como favoritas
 */
async function renderFavorites() {
    const container = document.getElementById('favorites-grid');
    if (!container) return;

    try {
        const favorites = await DataLoader.getFavorites();
        if (!favorites || favorites.length === 0) {
            container.innerHTML = `<p class="text-muted">No tienes obras favoritas todavía.</p>`;
            return;
        }
        container.innerHTML = favorites.map(o => renderMiniCard(o)).join("");
    } catch (e) { console.error(e); }
}

/**
 * Renderiza los artistas seguidos
 */
async function renderFollowedArtists() {
    const container = document.getElementById('artists-grid');
    if (!container) return;

    try {
        const followed = await DataLoader.getFollowedArtists();
        if (!followed || followed.length === 0) {
            container.innerHTML = `<p class="text-muted">Aún no sigues a ningún artista.</p>`;
            return;
        }

        const base = DataLoader.getBasePath();
        container.innerHTML = followed.map(a => `
            <div class="artist-card-mini" onclick="window.location.href='../catalogo/artista-detalle.html?id=${a.id}'" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid var(--border-sutil); cursor: pointer;">
                <img src="${base}${a.imagen}" alt="${a.nombre}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                <div>
                    <h4 style="font-family: var(--font-serif); font-size: 0.9rem;">${a.nombre}</h4>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">${a.disciplina}</span>
                </div>
            </div>
        `).join("");
    } catch (e) { console.error(e); }
}

/**
 * Helper para renderizar una tarjeta pequeña de obra
 */
function renderMiniCard(obra) {
    const base = DataLoader.getBasePath();
    return `
        <div class="cat-card mini">
            <div class="cat-card-img-wrapper" style="aspect-ratio: 1;">
                <img src="${base}${obra.imagen}" alt="${obra.titulo}" class="cat-card-img" loading="lazy">
                <a href="../catalogo/obra-detalle.html?id=${obra.id}" class="card-overlay-link"></a>
            </div>
            <div class="cat-card-info" style="padding: 1rem;">
                <h3 class="cat-card-title" style="font-size: 0.85rem;">${obra.titulo}</h3>
            </div>
        </div>
    `;
}

// Hacer globales
window.initUserProfile = initUserProfile;
window.logout = function() {
    localStorage.removeItem('usuario_logueado');
    const base = DataLoader.getBasePath();
    window.location.href = base + 'index.html';
};