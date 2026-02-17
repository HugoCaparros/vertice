/* Ruta: /assets/js/main.js
   Descripción: Motor principal de la aplicación que coordina el enrutamiento y la inicialización de componentes. */

document.addEventListener('DOMContentLoaded', async () => {

    // 0. VERIFICACIÓN CRÍTICA
    if (typeof DataLoader === 'undefined') {
        console.error("⛔ DataLoader no encontrado.");
        return;
    }

    // 1. INICIALIZAR LAYOUT (Navbar, Footer, Auth Guard)
    if (window.initLayout) await window.initLayout();

    // 1.1 INICIALIZAR AUTH SERVICE
    if (typeof AuthService !== 'undefined' && AuthService.init) {
        AuthService.init();
    }

    // 2. ENRUTAMIENTO Y LÓGICA DE PÁGINAS
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    // --- A. HOME / GRID PRINCIPAL ---
    if (document.getElementById('art-grid') || document.getElementById('viral-container')) {
        if (window.initHomePage) window.initHomePage();
    }

    // --- B. CATEGORÍAS ÍNDICE (categorias.html) ---
    if (document.getElementById('category-grid-container')) {
        const catParam = urlParams.get('categoria');
        if (window.initCatalogPage && catParam) {
            window.initCatalogPage(catParam);
        }
    }

    // --- C. DETALLE DE CATEGORÍA (abstracto.html, moderno.html...) ---
    if (document.querySelector('.category-container')) {
        if (window.initCategoryDetail) window.initCategoryDetail();
    }

    // --- D. CATÁLOGO GENERAL (obras.html) ---
    if (path.includes('obras.html')) {
        if (window.initGeneralCatalog) window.initGeneralCatalog();
    }

    // --- E. LÓGICA DE DETALLES (Modal vs Página) ---
    // Si estamos en la home pero la URL trae un ID, abrimos el modal
    const obraId = urlParams.get('id');
    if (obraId && window.openObraModal) {
        window.openObraModal(obraId);
    }

    // Si es la página independiente de detalle de artista
    if (path.includes('artista-detalle.html') && window.initArtistaDetalle) {
        window.initArtistaDetalle();
    }

    // --- F. LISTA DE ARTISTAS ---
    // Corregido: Llamada a la función correcta definida en details.js
    if (path.includes('artistas.html') || document.getElementById('artists-grid-container')) {
        if (window.initArtistsList) window.initArtistsList();
    }

    // --- G. PERFIL DE USUARIO ---
    if (path.includes('perfil.html') && window.initUserProfile) {
        window.initUserProfile();
    }
});