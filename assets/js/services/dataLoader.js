const DataLoader = {
    // 1. GESTIÓN DE RUTAS UNIVERSAL
    getBasePath: () => {
        const path = window.location.pathname;
        if (path.includes('/pages/')) {
            return '../../'; 
        }
        return './'; 
    },

    getDataPath: function() {
        return this.getBasePath() + 'data/';
    },

    getAssetPath: function() {
        return this.getBasePath();
    },

    // 2. CARGADOR GENÉRICO
    async loadJSON(filename) {
        const url = `${this.getDataPath()}${filename}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} loading ${url}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`❌ Error en DataLoader.loadJSON para ${url}:`, error);
            return [];
        }
    },

    // 3. GETTERS BÁSICOS
    async getArtistas() { return await this.loadJSON('artistas.json'); },
    async getObras() { return await this.loadJSON('obras.json'); },
    async getUsuarios() { return await this.loadJSON('usuarios.json'); },
    async getNoticias() { return await this.loadJSON('noticias.json'); },
    async getColecciones() { return await this.loadJSON('colecciones.json'); },
    async getEventos() { return await this.loadJSON('eventos.json'); },
    async getComentarios() { return await this.loadJSON('comentarios.json'); },
    async getNotificaciones() { return await this.loadJSON('notificaciones.json'); },
    async getCategorias() { return await this.loadJSON('categorias.json'); },

    // 4. FUNCIONES RELACIONALES
    async getObraCompleta(id) {
        try {
            const obraId = parseInt(id);
            const [obras, artistas, categorias, comentarios] = await Promise.all([
                this.getObras(),
                this.getArtistas(),
                this.getCategorias(),
                this.getComentarios()
            ]);

            const obra = obras.find(o => o.id === obraId);
            if (!obra) return null;

            obra.artista_data = artistas.find(a => a.id === obra.artista_id);
            obra.categoria_data = categorias.find(c => c.id === obra.categoria_id);
            obra.lista_comentarios = comentarios.filter(c => c.obra_id === obraId);

            return obra;
        } catch (error) {
            console.error("Error al obtener obra completa:", error);
            return null;
        }
    },

    async getArtistaCompleto(id) {
        try {
            const artistaId = parseInt(id);
            const [artistas, obras, colecciones] = await Promise.all([
                this.getArtistas(),
                this.getObras(),
                this.getColecciones()
            ]);

            const artista = artistas.find(a => a.id === artistaId);
            if (!artista) return null;

            artista.lista_obras = obras.filter(o => o.artista_id === artistaId);

            if (artista.colecciones_ids) {
                artista.lista_colecciones = colecciones.filter(c => artista.colecciones_ids.includes(c.id));
            }
            return artista;
        } catch (error) {
            console.error("Error al obtener artista completo:", error);
            return null;
        }
    },

    async getUsuarioActual() {
        try {
            const uLogueado = localStorage.getItem('usuario_logueado');
            if (uLogueado) return JSON.parse(uLogueado);
            
            const usuarios = await this.getUsuarios();
            return usuarios[0]; 
        } catch (error) {
            console.error("Error al obtener usuario actual:", error);
            return null;
        }
    },

    // 5. GESTIÓN DE FAVORITOS
    toggleFavorite(obraId) {
        const usuario = this.getUsuarioActual();
        if (!usuario) return false;

        if (!usuario.favoritos) usuario.favoritos = [];
        const index = usuario.favoritos.indexOf(obraId);

        if (index === -1) {
            usuario.favoritos.push(obraId);
        } else {
            usuario.favoritos.splice(index, 1);
        }

        localStorage.setItem('usuario_logueado', JSON.stringify(usuario));
        return true;
    },

    isFavorite(obraId) {
        const usuario = this.getUsuarioActual();
        return usuario && usuario.favoritos ? usuario.favoritos.includes(obraId) : false;
    },

    async getFavorites() {
        const usuario = this.getUsuarioActual();
        if (!usuario || !usuario.favoritos) return [];

        const obras = await this.getObras();
        return obras.filter(o => usuario.favoritos.includes(o.id.toString()));
    },

    /* ==========================================================================
       GESTIÓN DE SEGUIDOS (Artistas)
       ========================================================================== */

    toggleFollowArtist(artistaId) {
        const user = this.getUsuarioActual();
        if (!user) return false;

        if (!user.siguiendo_ids) user.siguiendo_ids = [];

        const index = user.siguiendo_ids.indexOf(artistaId.toString());
        if (index === -1) {
            user.siguiendo_ids.push(artistaId.toString());
        } else {
            user.siguiendo_ids.splice(index, 1);
        }

        localStorage.setItem('usuario_logueado', JSON.stringify(user));
        return true;
    },

    isFollowingArtist(artistaId) {
        const user = this.getUsuarioActual();
        if (!user || !user.siguiendo_ids) return false;
        return user.siguiendo_ids.includes(artistaId.toString());
    },

    async getFollowedArtists() {
        const user = this.getUsuarioActual();
        if (!user || !user.siguiendo_ids) return [];
        
        const artistas = await this.getArtistas();
        return artistas.filter(a => user.siguiendo_ids.includes(a.id.toString()));
    }
};

export default DataLoader;
window.DataLoader = DataLoader;