/* ==========================================================================
   USER PROFILE LOGIC
   Ubicación: assets/js/pages/profile.js
   ========================================================================== */

// Función helper para rellenar texto si el elemento existe
function safeText(elementId, text) { 
    const el = document.getElementById(elementId); 
    if (el) el.textContent = text; 
}

// Carga los datos del perfil
window.initUserProfile = async function() {
    const usuario = await DataLoader.getUsuarioActual();
    
    if (usuario) {
        safeText('user-name', usuario.nombre);
        safeText('user-handle', usuario.handle);
        safeText('user-bio', usuario.bio || "Amante del arte y coleccionista en Vértice.");
        
        safeText('stats-followers', usuario.seguidores || 0);
        safeText('stats-following', usuario.siguiendo || 0);
        
        const avatarEl = document.getElementById('user-avatar-img');
        if (avatarEl) avatarEl.src = usuario.avatar;
    } else {
        // Si no hay usuario logueado en la página de perfil, redirigir a login
        window.location.href = 'auth/login.html';
    }
};