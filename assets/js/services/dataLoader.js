const DataLoader = {
    // 1. GESTIÓN DE RUTAS UNIVERSAL
    getBasePath: () => {
        const path = window.location.pathname;
        if (path.includes('/pages/')) {
            return '../../';
        }
        return './';
    },

    getDataPath: function () {
        return this.getBasePath() + 'data/';
    },

    getAssetPath: function () {
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

    async getUsuarios() {
        const defaultUsers = await this.loadJSON('usuarios.json');
        const localUsersRaw = localStorage.getItem('usuarios_locales');
        const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : [];

        // Combinar ambas fuentes
        return [...defaultUsers, ...localUsers];
    },

    async getNoticias() { return await this.loadJSON('noticias.json'); },
    async getColecciones() { return await this.loadJSON('colecciones.json'); },
    async getEventos() { return await this.loadJSON('eventos.json'); },
    async getComentarios() { return await this.loadJSON('comentarios.json'); },
    async getNotificaciones() { return await this.loadJSON('notificaciones.json'); },
    async getCategorias() { return await this.loadJSON('categorias.json'); },

    async getObrasPorCategoria(slug) {
        try {
            const [obras, artistas, categorias] = await Promise.all([
                this.getObras(),
                this.getArtistas(),
                this.getCategorias()
            ]);

            const categoria = categorias.find(c => c.slug === slug);
            if (!categoria) return { info: null, obras: [] };

            const filteredObras = obras.filter(o => o.categoria_id === slug);

            // Adjuntar datos del artista a cada obra
            const obrasConArtista = filteredObras.map(o => {
                const artista = artistas.find(a => a.id === o.artista_id);
                return {
                    ...o,
                    artista: artista ? artista.nombre : 'Artista Vértice',
                    artista_data: artista
                };
            });

            return {
                info: categoria,
                obras: obrasConArtista
            };
        } catch (error) {
            console.error(`Error al obtener obras por categoría (${slug}):`, error);
            return { info: null, obras: [] };
        }
    },

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
            let user = null;
            const uLogueado = localStorage.getItem('usuario_logueado');

            if (uLogueado) {
                user = JSON.parse(uLogueado);
            } else {
                // ANTES: user = usuarios[0]; (Bug: trataba al primer usuario como invitado)
                // AHORA: return null para indicar que no hay sesión activa
                return null;
            }

            if (user) {
                // NORMALIZACIÓN: Asegurar que los campos coincidan con lo que espera el resto de la app
                if (user.obras_megusta && !user.favoritos) {
                    user.favoritos = user.obras_megusta.map(id => id.toString());
                }
                if (user.siguiendo_artistas && !user.siguiendo_ids) {
                    user.siguiendo_ids = user.siguiendo_artistas.map(id => id.toString());
                }

                // Garantizar que existan como arrays
                user.favoritos = user.favoritos || [];
                user.siguiendo_ids = user.siguiendo_ids || [];
            }

            return user;
        } catch (error) {
            console.error("Error al obtener usuario actual:", error);
            return null;
        }
    },

    // 5. GESTIÓN DE FAVORITOS
    async toggleFavorite(obraId) {
        const usuario = await this.getUsuarioActual();
        if (!usuario) return false;

        const idStr = obraId.toString();
        if (!usuario.favoritos) usuario.favoritos = [];
        const index = usuario.favoritos.indexOf(idStr);

        if (index === -1) {
            usuario.favoritos.push(idStr);
        } else {
            usuario.favoritos.splice(index, 1);
        }

        localStorage.setItem('usuario_logueado', JSON.stringify(usuario));
        return true;
    },

    async isFavorite(obraId) {
        const usuario = await this.getUsuarioActual();
        const idStr = obraId.toString();
        return usuario && usuario.favoritos ? usuario.favoritos.includes(idStr) : false;
    },

    async getFavorites() {
        const usuario = await this.getUsuarioActual();
        if (!usuario || !usuario.favoritos) return [];

        const obras = await this.getObras();
        return obras.filter(o => usuario.favoritos.includes(o.id.toString()));
    },

    /* ==========================================================================
       GESTIÓN DE SEGUIDOS (Artistas)
       ========================================================================== */

    async toggleFollowArtist(artistaId) {
        const user = await this.getUsuarioActual();
        if (!user) return false;

        const idStr = artistaId.toString();
        if (!user.siguiendo_ids) user.siguiendo_ids = [];

        const index = user.siguiendo_ids.indexOf(idStr);
        if (index === -1) {
            user.siguiendo_ids.push(idStr);
        } else {
            user.siguiendo_ids.splice(index, 1);
        }

        localStorage.setItem('usuario_logueado', JSON.stringify(user));
        return true;
    },

    async isFollowingArtist(artistaId) {
        const user = await this.getUsuarioActual();
        if (!user || !user.siguiendo_ids) return false;
        const idStr = artistaId.toString();
        return user.siguiendo_ids.includes(idStr);
    },

    async getFollowedArtists() {
        const user = await this.getUsuarioActual();
        if (!user || !user.siguiendo_ids) return [];

        const artistas = await this.getArtistas();
        return artistas.filter(a => user.siguiendo_ids.includes(a.id.toString()));
    }
};

export default DataLoader;
window.DataLoader = DataLoader;