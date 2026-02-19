import DataLoader from '../services/dataLoader.js';

/* Ruta: /assets/js/components/layout.js
   Descripción: Gestión de la interfaz común, incluyendo la carga dinámica de navbar, footer y control de acceso. */

export const initLayout = async function () {
    // 1. SEGURIDAD
    authGuard();

    // 2. RENDERIZADO (NAVBAR & FOOTER)
    const navPlaceholder = document.getElementById('navbar-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    // Corrección de ruta raíz
    const basePath = DataLoader.getBasePath();
    let rootPath = basePath.replace('assets/data/', '');
    if (rootPath === basePath) rootPath = basePath.replace('data/', '').replace('assets/', '');

    // --- CARGAR NAVBAR ---
    if (navPlaceholder) {
        const usuario = JSON.parse(localStorage.getItem('usuario_logueado'));

        // LÓGICA SIMPLIFICADA: Solo existen dos estados (Logueado o No Logueado)
        const archivoMenu = usuario ? 'sesion_iniciada.html' : 'iniciar_sesion.html';

        const fullUrl = rootPath + 'pages/partials/' + archivoMenu;

        try {
            const resp = await fetch(fullUrl);
            if (resp.ok) {
                navPlaceholder.innerHTML = await resp.text();

                // Inicializar eventos (Logout)
                initNavbarEvents(rootPath);

                // RESALTAR PÁGINA ACTUAL
                const currentPath = window.location.pathname;
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    if (link.href && currentPath.includes(link.getAttribute('href').split('/').pop())) {
                        link.style.fontWeight = '600';
                        link.classList.add('active');
                    }
                });

                // PERSONALIZAR EL MENÚ SEGÚN EL ROL
                if (usuario) updateUserInfo(usuario);
            } else {
                console.error(`❌ Error 404: No se encuentra ${fullUrl}`);
            }
        } catch (e) { console.error("Error Navbar:", e); }
    }

    // --- CARGAR FOOTER ---
    if (footerPlaceholder) {
        try {
            const resp = await fetch(rootPath + 'pages/partials/footer.html');
            if (resp.ok) footerPlaceholder.innerHTML = await resp.text();
        } catch (e) { console.error("Error Footer:", e); }
    }

    // 3. ARREGLAR RUTAS DE IMÁGENES
    fixLayoutPaths(rootPath);
};

/* ==========================================================================
   FUNCIONES AUXILIARES (LOGIN / UI)
   ========================================================================== */

function updateUserInfo(usuario) {
    const nameEl = document.querySelector('.user-name-display');
    if (nameEl && usuario.nombre) {
        nameEl.textContent = usuario.nombre.split(' ')[0];
    }

    const roleEl = document.querySelector('.user-role-badge');
    const artistLinks = document.querySelectorAll('.artist-only-link');

    if (roleEl) {
        const rol = usuario.rol || 'Usuario';
        roleEl.textContent = rol;

        if (rol === 'Artista') {
            roleEl.classList.add('is-artist');
            artistLinks.forEach(link => { link.style.display = 'inline-flex'; });
        } else {
            roleEl.classList.remove('is-artist');
            artistLinks.forEach(link => { link.style.display = 'none'; });
        }
    }
}

function fixLayoutPaths(rootPath) {
    const navLogo = document.getElementById('dynamic-logo');
    if (navLogo) navLogo.src = rootPath + 'assets/icons/logo_letras.svg';
    const brandLink = document.querySelector('.brand-link');
    if (brandLink) brandLink.href = rootPath + 'index.html';
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        const footerLogo = footerPlaceholder.querySelector('img');
        if (footerLogo) footerLogo.src = rootPath + 'assets/icons/logo_blanco.svg';
    }
}

function initNavbarEvents(rootPath) {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('usuario_logueado');
            window.location.href = rootPath + 'index.html';
        });
    }

    const triggers = document.querySelectorAll('.auth-trigger');
    triggers.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("🔒 Acceso restringido: Abriendo modal...");
            showAuthModal(rootPath);
        });
    });
}

export function authGuard() {
    const usuario = JSON.parse(localStorage.getItem('usuario_logueado'));
    const path = window.location.pathname;

    const protectedPages = [
        'perfil.html', 'mis-colecciones.html', 'ajustes.html', 'dashboard.html',
        'subir-obra.html', 'mis-obras.html', 'artistas.html', 'obras.html',
        'categorias.html', 'obra-detalle.html', 'artista-detalle.html',
    ];

    if (protectedPages.some(page => path.includes(page)) && !usuario) {
        const basePath = DataLoader.getBasePath();
        let rootPath = basePath.replace('assets/data/', '');
        if (rootPath === basePath) {
            rootPath = basePath.replace('data/', '').replace('assets/', '');
        }
        showAuthModal(rootPath);
        document.body.style.overflow = 'hidden';
    }
}

export function showAuthModal(rootPath) {
    let modal = document.getElementById('authRequiredModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'authRequiredModal';
        modal.className = 'modal-overlay';

        modal.innerHTML = `
            <div class="modal-content modal-exclusive">
                <button class="modal-close" id="closeAuthModal">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="modal-header-logo">
                    <img src="${rootPath}assets/icons/logo_letras.svg" alt="VÉRTICE">
                </div>
                <h2 class="modal-title">CLUB PRIVADO</h2>
                <p class="modal-description">
                    Este contenido es exclusivo para miembros. 
                    Únete a Vértice para acceder a la colección completa.
                </p>
                <div class="modal-buttons">
                    <a href="${rootPath}pages/auth/login.html" class="btn-modal-solid">INICIAR SESIÓN</a>
                    <a href="${rootPath}pages/auth/register.html" class="btn-modal-outline">REGISTRARSE</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const closeBtn = document.getElementById('closeAuthModal');
    const closeModalAction = () => {
        document.body.style.overflow = '';
        const path = window.location.pathname;
        const restrictedPages = [
            'obras.html', 'artistas.html', 'categorias.html',
            'perfil.html', 'dashboard.html',
            'obra-detalle.html', 'abstracto.html', 'moderno.html', 'clasico.html'
        ];

        const isRestricted = restrictedPages.some(page => path.includes(page));

        if (isRestricted) {
            window.location.href = rootPath + 'index.html';
        } else {
            modal.classList.remove('active');
        }
    };

    closeBtn.onclick = closeModalAction;
    modal.onclick = (e) => {
        if (e.target === modal) closeModalAction();
    };

    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

// Para retrocompatibilidad si otros scripts lo necesitan globalmente
window.initLayout = initLayout;
window.authGuard = authGuard;
window.showAuthModal = showAuthModal;