/* Ruta: /assets/js/components/layout.js
   Descripción: Gestión de la interfaz común, incluyendo la carga dinámica de navbar, footer y control de acceso. */

window.initLayout = async function () {
    // 1. SEGURIDAD
    if (typeof authGuard === 'function') authGuard();

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
                if (typeof initNavbarEvents === 'function') initNavbarEvents(rootPath);

                // RESALTAR PÁGINA ACTUAL
                const currentPath = window.location.pathname;
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    // Check if the link's href (resolved) matches the current path
                    if (link.href && currentPath.includes(link.getAttribute('href').split('/').pop())) {
                        link.style.fontWeight = '600';
                        link.classList.add('active'); // Por si acaso hay CSS para esto
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
    if (typeof fixLayoutPaths === 'function') fixLayoutPaths(rootPath);
};

/* ==========================================================================
   FUNCIONES AUXILIARES (LOGIN / UI)
   ========================================================================== */

function updateUserInfo(usuario) {
    // 1. Rellenar Nombre
    const nameEl = document.querySelector('.user-name-display');
    if (nameEl && usuario.nombre) {
        nameEl.textContent = usuario.nombre.split(' ')[0];
    }

    // 2. Lógica de Roles (Artista vs Usuario)
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
    // 1. LOGOUT (Para cuando sí estás logueado)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('usuario_logueado');
            window.location.href = rootPath + 'index.html';
        });
    }

    // 2. BLOQUEO DE ENLACES (Para Artistas, Obras, Categorías)
    // Seleccionamos todos los enlaces con la clase 'auth-trigger'
    const triggers = document.querySelectorAll('.auth-trigger');

    triggers.forEach(link => {
        link.addEventListener('click', (e) => {
            // ¡STOP! Evitamos que el navegador vaya a la página
            e.preventDefault();

            console.log("🔒 Acceso restringido: Abriendo modal...");

            // Abrimos el Popup
            // (Si showAuthModal no está definida aquí, asegúrate de que esté en layout.js)
            if (typeof showAuthModal === 'function') {
                showAuthModal(rootPath);
            } else {
                // Fallback de emergencia si no encuentra la función del modal
                window.location.href = rootPath + 'pages/auth/login.html';
            }
        });
    });
}

/* ==========================================================================
   GUARDIA DE SEGURIDAD (Protección de Rutas con Modal)
   ========================================================================== */

function authGuard() {
    const usuario = JSON.parse(localStorage.getItem('usuario_logueado'));
    const path = window.location.pathname;

    // LISTA NEGRA: Páginas que requieren estar logueado
    const protectedPages = [
        'perfil.html',
        'mis-colecciones.html',
        'ajustes.html',
        'dashboard.html',
        'subir-obra.html',
        'mis-obras.html',
        'artistas.html',
        'obras.html',
        'categorias.html',
        'obra-detalle.html',
        'artista-detalle.html',
    ];

    // LÓGICA: Si es protegida y NO hay usuario...
    if (protectedPages.some(page => path.includes(page)) && !usuario) {

        // Calculamos la ruta raíz para cargar imágenes/links correctamente
        const basePath = DataLoader.getBasePath();
        let rootPath = basePath.replace('assets/data/', '');
        if (rootPath === basePath) {
            rootPath = basePath.replace('data/', '').replace('assets/', '');
        }

        // CAMBIO PRINCIPAL: En lugar de redirigir, mostramos el MODAL
        showAuthModal(rootPath);

        // Bloqueamos el scroll para que no bajen a ver el contenido borroso
        document.body.style.overflow = 'hidden';
    }
}

/* --- NUEVA FUNCIÓN: INYECTAR Y MOSTRAR MODAL --- */
/* --- FUNCIÓN: INYECTAR Y GESTIONAR EL MODAL --- */
function showAuthModal(rootPath) {
    let modal = document.getElementById('authRequiredModal');

    // 1. Si no existe, lo creamos (HTML Injection)
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

    // 2. LÓGICA DE CIERRE (LA "X")
    const closeBtn = document.getElementById('closeAuthModal');

    // Definimos qué pasa al cerrar
    const closeModalAction = () => {
        // A. Restaurar el scroll de la página
        document.body.style.overflow = '';

        // B. Detectar si estamos en una página prohibida
        const path = window.location.pathname;
        const restrictedPages = [
            'obras.html', 'artistas.html', 'categorias.html',
            'perfil.html', 'dashboard.html',
            'obra-detalle.html', 'abstracto.html', 'moderno.html', 'clasico.html'
        ];

        const isRestricted = restrictedPages.some(page => path.includes(page));

        if (isRestricted) {
            // SI ESTÁS EN ZONA PROHIBIDA: Te mando al Home
            window.location.href = rootPath + 'index.html';
        } else {
            // SI ESTÁS EN ZONA SEGURA (HOME): Solo cierro el popup
            modal.classList.remove('active');
        }
    };

    // Asignar el evento al botón X
    closeBtn.onclick = closeModalAction;

    // Asignar evento al hacer clic fuera del cuadro blanco (fondo oscuro)
    modal.onclick = (e) => {
        if (e.target === modal) closeModalAction();
    };

    // 3. MOSTRAR EL MODAL
    // Bloqueamos el scroll del fondo
    document.body.style.overflow = 'hidden';

    // Pequeño retardo para que la animación CSS funcione
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}