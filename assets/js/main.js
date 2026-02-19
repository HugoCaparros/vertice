import DataLoader from './services/dataLoader.js';
import { initLayout } from './components/layout.js';
import { AuthService } from './services/auth.js';

/* Ruta: /assets/js/main.js
   Descripción: Motor principal de la aplicación que coordina el enrutamiento y la inicialización de componentes. */

document.addEventListener('DOMContentLoaded', async () => {

    // 1. INICIALIZAR LAYOUT (Navbar, Footer, Auth Guard)
    await initLayout();

    // 1.1 INICIALIZAR AUTH SERVICE
    AuthService.init();

    // 2. ENRUTAMIENTO Y LÓGICA DE PÁGINAS
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    // --- A. HOME / INTERACTIVA ---
    if (document.getElementById('interactive-container') || document.getElementById('art-grid')) {
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
    const obraId = urlParams.get('id');
    const artistaIdParam = urlParams.get('id');

    if (document.getElementById('obra-titulo')) {
        if (window.initObraDetalle) window.initObraDetalle();
    }

    if (document.getElementById('nombre-artista') && !document.getElementById('obra-titulo')) {
        if (window.initArtistaDetalle) window.initArtistaDetalle();
    }

    // --- F. LISTA DE ARTISTAS ---
    if (path.includes('artistas.html') || document.getElementById('artists-grid-container')) {
        if (window.initArtistsList) window.initArtistsList();
    }

    // --- G. PERFIL DE USUARIO ---
    if (path.includes('perfil.html') || document.getElementById('user-name')) {
        if (window.initUserProfile) window.initUserProfile();
    }
});