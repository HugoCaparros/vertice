/* ==========================================================================
   PAGE TRANSITIONS ENGINE (Optimized)
   Ubicación: assets/js/transitions.js
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    
    // Detectamos enlaces que cambian el layout (Login <-> Registro)
    const transitionLinks = document.querySelectorAll('.btn-auth-outline, .auth-link');

    transitionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Verificaciones de seguridad (mismo dominio, no new tab, etc.)
            if (link.href && 
                link.origin === window.location.origin && 
                !link.target && 
                !link.href.includes('#')) {
                
                e.preventDefault(); // Stop carga inmediata
                const targetUrl = link.href;

                // 1. Activar animación de SALIDA
                document.body.classList.add('page-exiting');

                // 2. Esperar EXACTAMENTE lo que dura la animación CSS de salida (0.4s)
                // Si esperamos más, el usuario ve la pantalla blanca y se rompe la magia.
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 400); 
            }
        });
    });
});