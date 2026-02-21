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
        renderList('favorites-grid', misFavoritos, (o) => renderMiniCard(o, true), "No tienes obras favoritas todavía.");

        // 5. Secciones Comunes: Artistas Seguidos
        const misSeguidos = artistas.filter(a => (usuario.siguiendo_ids || []).includes(a.id.toString()));
        renderList('artists-grid', misSeguidos, (a) => renderArtistMiniCard(a, true), "Aún no sigues a ningún artista.");

        // 6. Configurar Modal
        setupModal();

        // 7. Configurar Modal de Avatar
        setupAvatarModal(usuario);

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

function renderArtistMiniCard(artist, isFollowing) {
    const base = DataLoader.getAssetPath();
    return `
        <div class="artist-mini-card" onclick="window.location.href='../catalogo/artista-detalle.html?id=${artist.id}'">
            <div class="artist-mini-avatar">
                <img src="${base}${artist.imagen}" alt="${artist.nombre}">
                <div class="card-follow-badge ${isFollowing ? 'active' : ''}">
                    <i class="fa-solid fa-star"></i>
                </div>
            </div>
            <div class="artist-mini-info">
                <h4>${artist.nombre}</h4>
                <span>${artist.disciplina}</span>
            </div>
        </div>
    `;
}

function renderMiniCard(obra, isLiked) {
    const base = DataLoader.getAssetPath();

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
        renderFn = (item) => renderMiniCard(item, false); // No necesariamente favoritos aquí
        modalTitle = "Tus Obras";
    } else if (type === 'obras-favoritas') {
        const obras = await DataLoader.getObras();
        data = obras.filter(o => (usuario.favoritos || []).includes(o.id.toString()));
        renderFn = (item) => renderMiniCard(item, true);
        modalTitle = "Obras Favoritas";
    } else if (type === 'artistas-favoritos') {
        const artistas = await DataLoader.getArtistas();
        data = artistas.filter(a => (usuario.siguiendo_ids || []).includes(a.id.toString()));
        renderFn = (item) => renderArtistMiniCard(item, true);
        modalTitle = "Artistas Favoritos";
    }

    title.textContent = modalTitle;
    grid.innerHTML = data.map(item => renderFn(item)).join("");

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
}

function closeModal() {
    const modal = document.getElementById('premium-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function setupAvatarModal(usuarioActual) {
    const avatarBtn = document.getElementById('btn-edit-avatar');
    const avatarModal = document.getElementById('avatarModal');
    const closeAvatarBtn = document.getElementById('closeAvatarModal');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const currentUserImg = document.getElementById('user-avatar-img');
    const placeholder = document.getElementById('avatar-placeholder');

    if (!avatarBtn || !avatarModal) return;

    // Abrir modal
    avatarBtn.addEventListener('click', () => {
        avatarModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Cerrar modal local
    const closeAvModal = () => {
        avatarModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeAvatarBtn.addEventListener('click', closeAvModal);
    avatarModal.addEventListener('click', (e) => {
        if (e.target === avatarModal) closeAvModal();
    });

    // Seleccionar Avatar
    avatarOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const newSrc = e.target.getAttribute('data-src');

            // 1. Actualizar UI visualmente
            if (currentUserImg) {
                currentUserImg.src = newSrc;
                currentUserImg.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
            }

            // Destacar selección actual (Opcional visual)
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');

            // 2. Persistir en la Sesión Actual
            const sessionUserRaw = localStorage.getItem('usuario_logueado');
            if (sessionUserRaw) {
                let sessionUser = JSON.parse(sessionUserRaw);
                // Extraer la ruta a partir de 'assets/...' para compatibilidad universal
                let cleanRoute = newSrc;
                if (newSrc.includes('../../')) {
                    cleanRoute = newSrc.split('../../')[1];
                }
                sessionUser.avatar = cleanRoute;
                localStorage.setItem('usuario_logueado', JSON.stringify(sessionUser));
            }

            // 3. Persistir en LocalStorage (Base de datos local simulada)
            const localUsersRaw = localStorage.getItem('usuarios_locales');
            if (localUsersRaw) {
                let localUsers = JSON.parse(localUsersRaw);
                const userIndex = localUsers.findIndex(u => u.id === usuarioActual.id);
                if (userIndex !== -1) {
                    let cleanRoute = newSrc;
                    if (newSrc.includes('../../')) {
                        cleanRoute = newSrc.split('../../')[1];
                    }
                    localUsers[userIndex].avatar = cleanRoute;
                    localStorage.setItem('usuarios_locales', JSON.stringify(localUsers));
                }
            }

            // 4. Feedback y Cerrar
            notifications.show("Avatar actualizado con éxito.", "success");
            closeAvModal();
        });
    });
}

// Hacer globales
window.initUserProfile = initUserProfile;
window.logout = function () {
    notifications.show("Cerrando sesión en Vértice...", "info");
    setTimeout(() => {
        localStorage.removeItem('usuario_logueado');
        const base = DataLoader.getBasePath();
        window.location.href = base + 'index.html';
    }, 800);
};

// Sincronización de likes en perfil con actualización en tiempo real
window.toggleLike = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();

    const btn = event.currentTarget.closest('.card-like-btn');
    const icon = btn.querySelector('i');
    const card = event.currentTarget.closest('.profile-mini-card');

    const isNowLiked = await FavoritesManager.toggleObra(id, icon);
    btn.classList.toggle('liked', isNowLiked);

    // Si estamos en el perfil y dejamos de dar like, eliminamos la tarjeta con una transición suave
    if (!isNowLiked && card) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        card.style.transition = 'all 0.4s ease';

        setTimeout(() => {
            const grid = card.parentElement;
            card.remove();

            // Si el grid se queda vacío, mostrar el mensaje de "No tienes obras favoritas"
            if (grid && grid.children.length === 0) {
                const emptyMsg = grid.id === 'favorites-grid'
                    ? "No tienes obras favoritas todavía."
                    : "No tienes obras subidas todavía.";
                grid.innerHTML = `<p class="empty-state-msg">${emptyMsg}</p>`;
            }
        }, 400);
    }
};