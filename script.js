const encodedApiKey = 'OTJjMTUwN2NjMThkODUyOTBlN2EwYjk2YWJiMzczMTY=';

// Função para decodificar a chave
function decodeApiKey() {
    return atob(encodedApiKey); // Decodifica a chave Base64
}

// Função para buscar links magnéticos no TorrentGalaxy
async function findMagnetLinkOnTorrentGalaxy(query) {
    const searchUrl = `https://torrentgalaxy.to/torrents.php?search=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(searchUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Encontra o primeiro link magnético na página de resultados
        const magnetLink = doc.querySelector('a[href^="magnet:?"]')?.href;
        return magnetLink || null;
    } catch (error) {
        console.error('Erro ao buscar no TorrentGalaxy:', error);
        return null;
    }
}

// Função para buscar o link magnético
function findMagnetLink(imdbId, season, episode) {
    if (season && episode) {
        // Para séries, use o nome da série, temporada e episódio na busca
        const query = `Série ${imdbId} Temporada ${season} Episódio ${episode}`;
        return findMagnetLinkOnTorrentGalaxy(query);
    } else {
        // Para filmes, use o nome do filme
        const query = `Filme ${imdbId}`;
        return findMagnetLinkOnTorrentGalaxy(query);
    }
}

// Função para reproduzir um filme
function playContent(tmdb_id, type) {
    const api_key = decodeApiKey();
    var url = `https://api.themoviedb.org/3/${type}/${tmdb_id}?api_key=${api_key}&language=pt-BR&append_to_response=external_ids`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const imdb_id = data.imdb_id;
            if (!imdb_id) {
                alert('IMDb ID não encontrado para este conteúdo.');
                return;
            }

            findMagnetLink(imdb_id)
                .then(magnet => {
                    if (magnet) {
                        openModalWithPlayer(magnet);
                    } else {
                        alert('Magnet link não encontrado no TorrentGalaxy.');
                    }
                });
        })
        .catch(error => {
            console.error('Erro ao buscar detalhes no TMDB:', error);
            alert('Erro ao buscar o conteúdo. Tente novamente.');
        });
}

// Função para reproduzir um episódio
function playEpisode(tv_id, season_number, episode_number) {
    const api_key = decodeApiKey();
    var url = `https://api.themoviedb.org/3/tv/${tv_id}?api_key=${api_key}&language=pt-BR&append_to_response=external_ids`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const imdb_id = data.external_ids?.imdb_id;
            if (!imdb_id) {
                alert('IMDb ID não encontrado para esta série.');
                return;
            }

            findMagnetLink(imdb_id, season_number, episode_number)
                .then(magnet => {
                    if (magnet) {
                        openModalWithPlayer(magnet);
                    } else {
                        alert('Magnet link não encontrado no TorrentGalaxy.');
                    }
                });
        })
        .catch(error => {
            console.error('Erro ao buscar detalhes no TMDB:', error);
            alert('Erro ao buscar o conteúdo. Tente novamente.');
        });
}

// Função para abrir o modal com o player
function openModalWithPlayer(magnetLink) {
    const modal = document.getElementById('playerModal');
    const playerDiv = document.getElementById('player');

    // Limpa o player anterior
    playerDiv.innerHTML = '';

    // Inicializa o player do Webtor
    window.webtor = window.webtor || [];
    window.webtor.push({
        id: 'player',
        magnet: magnetLink,
        on: function(e) {
            if (e.name == window.webtor.TORRENT_FETCHED) {
                console.log('Torrent fetched!', e.data);
            }
            if (e.name == window.webtor.TORRENT_ERROR) {
                console.log('Torrent error!');
            }
        },
        poster: 'https://wallpapers.com/images/hd/overlapping-fine-neon-green-matrix-dvfxd08moa4d5hy8.jpg',
        title: 'Reprodução de Torrent'
    });

    // Mostra o modal
    modal.style.display = 'flex';
}

// Função para fechar o modal
function closeModal() {
    const modal = document.getElementById('playerModal');
    const playerDiv = document.getElementById('player');

    // Esconde o modal e limpa o player
    modal.style.display = 'none';
    playerDiv.innerHTML = '';
}

// Fecha o modal ao pressionar a tecla ESC
window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Adiciona o evento de clique no botão de fechar
document.getElementById('closeButton').addEventListener('click', closeModal);
