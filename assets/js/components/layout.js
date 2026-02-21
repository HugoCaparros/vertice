import DataLoader from '../services/dataLoader.js';

/* Ruta: /assets/js/components/layout.js
   Descripción: Gestión de la interfaz común, incluyendo la carga dinámica de navbar, footer y control de acceso. */

export const initLayout = async function () {
    // 1. CARGAR ESTILOS GLOBALES DE ALERTAS
    const basePath = DataLoader.getBasePath();
    let rootPath = basePath.replace('assets/data/', '');
    if (rootPath === basePath) rootPath = basePath.replace('data/', '').replace('assets/', '');

    if (!document.getElementById('vrt-alerts-css')) {
        const link = document.createElement('link');
        link.id = 'vrt-alerts-css';
        link.rel = 'stylesheet';
        link.href = rootPath + 'assets/css/components/alerts.css';
        document.head.appendChild(link);
    }

    // 2. SEGURIDAD
    authGuard();

    // 3. RENDERIZADO (NAVBAR & FOOTER)
    const navPlaceholder = document.getElementById('navbar-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

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

                // REPLACING BLOCK 1 (Call site)
                // PERSONALIZAR EL MENÚ SEGÚN EL ROL
                if (usuario) updateUserInfo(usuario, rootPath);
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

function updateUserInfo(usuario, rootPath = './') {
    const welcomeEl = document.querySelector('.welcome-label');
    if (welcomeEl) welcomeEl.textContent = 'BIENVENIDO,';

    const nameEl = document.querySelector('.user-name-display');
    if (nameEl && usuario.nombre) {
        nameEl.textContent = usuario.nombre.split(' ')[0].toUpperCase();
    }

    const roleEl = document.querySelector('.user-role-badge');
    const artistLinks = document.querySelectorAll('.artist-only-link');

    if (roleEl) {
        const rol = usuario.rol || 'Coleccionista';
        roleEl.textContent = rol.toUpperCase();

        if (rol === 'Artista') {
            roleEl.classList.add('is-artist');
            artistLinks.forEach(link => { link.style.display = 'inline-flex'; });
        } else {
            roleEl.classList.remove('is-artist');
            artistLinks.forEach(link => { link.style.display = 'none'; });
        }
    }

    const avatarEl = document.getElementById('navbar-user-avatar');
    if (avatarEl && usuario.avatar) {
        // En `layout.js`, rootPath maneja la relativización (ej. '../../' o './')
        avatarEl.src = rootPath + usuario.avatar;
        avatarEl.style.display = 'block';
    }

    // Sincronizar también elementos específicos de la página de perfil si existen
    const profileName = document.getElementById('user-name');
    if (profileName && usuario.nombre) profileName.textContent = usuario.nombre;

    const profileRole = document.getElementById('user-role-badge');
    if (profileRole) profileRole.textContent = (usuario.rol || 'Coleccionista').toUpperCase();
}

function fixLayoutPaths(rootPath) {
    // 1. Imágenes y Logos
    const navLogo = document.getElementById('dynamic-logo');
    if (navLogo) navLogo.src = rootPath + 'assets/icons/logo_letras.svg';

    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        const footerLogo = footerPlaceholder.querySelector('img');
        if (footerLogo) footerLogo.src = rootPath + 'assets/icons/logo_blanco.svg';
    }

    // 2. Enlaces de Navegación (Evitar navegación rota entre carpetas)
    const brandLink = document.querySelector('.brand-link');
    if (brandLink) brandLink.href = rootPath + 'index.html';

    // Ajustar todos los enlaces en el navbar
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-item:not(.logout-item)');
    navLinks.forEach(link => {
        const originalHref = link.getAttribute('href');
        if (originalHref && !originalHref.startsWith('http') && !originalHref.startsWith('#')) {
            // Reconstruir ruta relativa desde el rootPath
            // Esperamos rutas tipo: ../../pages/catalogo/artistas.html o ../usuario/perfil.html
            const cleanPath = originalHref.replace(/\.\.\//g, ''); // Quitamos los ../
            // Si el originalHref ya empieza con 'pages/', lo dejamos así, sino lo añadimos si no es index
            const isIndex = cleanPath === 'index.html';
            link.href = isIndex ? rootPath + 'index.html' : rootPath + (cleanPath.startsWith('pages/') ? '' : 'pages/') + cleanPath;
        }
    });

    // Casos específicos de rutas que podrían estar mal en el HTML parcial
    const profileLink = document.querySelector('a[href*="perfil.html"]');
    if (profileLink) profileLink.href = rootPath + 'pages/usuario/perfil.html';
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
    // 1. Obtener usuario del almacenamiento de forma segura
    const uRaw = localStorage.getItem('usuario_logueado');
    let usuario = null;
    try {
        if (uRaw) usuario = JSON.parse(uRaw);
    } catch (e) {
        console.error("❌ Error parseando sesión:", e);
        localStorage.removeItem('usuario_logueado');
    }

    const path = window.location.pathname;

    // 2. Si hay usuario, limpiar cualquier modal previo y permitir navegación libre
    if (usuario) {
        console.log("🔓 Acceso concedido a:", usuario.nombre);
        const modal = document.getElementById('authRequiredModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        return; // Éxito: No hacemos nada más
    }

    // 3. Páginas que requieren protección obligatoria (Redirección o Modal)
    const protectedPages = [
        'perfil.html', 'dashboard.html', 'subir-obra.html', 'mis-obras.html', 'mis-colecciones.html'
    ];

    // 4. Páginas de navegación exclusiva (Vértice es una galería privada)
    const browsePages = [
        'obras.html', 'artistas.html', 'categorias.html', 'obra-detalle.html', 'artista-detalle.html'
    ];

    const isProtected = protectedPages.some(page => path.includes(page));
    const isBrowse = browsePages.some(page => path.includes(page));

    // 5. Si es una página de acceso restringido y NO estamos logueados -> Mostrar Modal
    if (isProtected || isBrowse) {
        // Pequeño retardo para asegurar que el DOM esté listo o evitar race conditions con auth.js
        setTimeout(() => {
            const checkFinal = localStorage.getItem('usuario_logueado');
            if (checkFinal) return; // Si se logueó justo ahora, cancelar

            const basePath = DataLoader.getBasePath();
            let rootPath = basePath.replace('assets/data/', '').replace('data/', '').replace('assets/', '');
            if (!rootPath.endsWith('/')) rootPath = rootPath === '' ? './' : rootPath;

            showAuthModal(rootPath);
        }, 100);
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
                    <a href="${rootPath}pages/auth/login.html?mode=register" class="btn-modal-outline">REGISTRARSE</a>
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