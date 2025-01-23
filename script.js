const encodedApiKey = 'OTJjMTUwN2NjMThkODUyOTBlN2EwYjk2YWJiMzczMTY=';

// Função para decodificar a chave
function decodeApiKey() {
    return atob(encodedApiKey); // Decodifica a chave Base64
}

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const catalogo = document.getElementById('catalogo');

    // Evento para buscar filmes/séries ao digitar na barra de pesquisa
    searchInput.addEventListener('input', function () {
        const query = searchInput.value;
        if (query.length > 2) {
            // Faz a busca na API do TMDB
            const api_key = decodeApiKey();
            fetch(`https://api.themoviedb.org/3/search/multi?api_key=${api_key}&language=pt-BR&query=${query}`)
                .then(response => response.json())
                .then(data => {
                    catalogo.innerHTML = ''; // Limpa o catálogo anterior
                    data.results.forEach(item => {
                        const catalogoItem = document.createElement('div');
                        catalogoItem.classList.add('item');

                        // Extrai o ano do filme ou série
                        const year = item.release_date
                            ? new Date(item.release_date).getFullYear()
                            : item.first_air_date
                            ? new Date(item.first_air_date).getFullYear()
                            : 'Desconhecido';

                        if (item.media_type === 'movie') {
                            catalogoItem.innerHTML = `
                                <h3>Filme: ${item.title} (${year})</h3>
                                <img src="https://image.tmdb.org/t/p/w200${item.poster_path}" alt="${item.title}">
                                <button class="playButton">Assistir Filme</button>
                            `;
                            // Adiciona evento de clique na caixa
                            catalogoItem.addEventListener('click', function () {
                                playContent(item.id, 'movie');
                            });
                        } else if (item.media_type === 'tv') {
                            catalogoItem.innerHTML = `
                                <h3>Série: ${item.name} (${year})</h3>
                                <img src="https://image.tmdb.org/t/p/w200${item.poster_path}" alt="${item.name}">
                                <button class="playButton">Ver Temporadas e Episódios</button>
                            `;
                            // Adiciona evento de clique na caixa
                            catalogoItem.addEventListener('click', function () {
                                showSeasons(item.id);
                            });
                        }

                        catalogo.appendChild(catalogoItem);
                    });
                });
        }
    });
});

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
                        alert('Magnet link não encontrado no data.json.');
                    }
                });
        })
        .catch(error => {
            console.error('Erro ao buscar detalhes no TMDB:', error);
            alert('Erro ao buscar o conteúdo. Tente novamente.');
        });
}

// Função para mostrar as temporadas de uma série
function showSeasons(tv_id) {
    const api_key = decodeApiKey();
    fetch(`https://api.themoviedb.org/3/tv/${tv_id}?api_key=${api_key}&language=pt-BR`)
        .then(response => response.json())
        .then(data => {
            const seasons = data.seasons;
            const catalogo = document.getElementById('catalogo');
            catalogo.innerHTML = '';
            seasons.forEach(season => {
                const seasonItem = document.createElement('div');
                seasonItem.classList.add('item');
                seasonItem.innerHTML = `
                    <h3>Temporada ${season.season_number}</h3>
                    <button onclick="showEpisodes('${tv_id}', '${season.season_number}')">Ver Episódios</button>
                `;
                catalogo.appendChild(seasonItem);
            });
            catalogo.innerHTML += `<button onclick="searchInput.dispatchEvent(new Event('input'))">Voltar para a Busca</button>`;
        });
}

// Função para mostrar os episódios de uma temporada
function showEpisodes(tv_id, season_number) {
    const api_key = decodeApiKey();
    fetch(`https://api.themoviedb.org/3/tv/${tv_id}/season/${season_number}?api_key=${api_key}&language=pt-BR`)
        .then(response => response.json())
        .then(data => {
            const episodes = data.episodes;
            const catalogo = document.getElementById('catalogo');
            catalogo.innerHTML = '';
            const backButton = document.createElement('button');
            backButton.innerText = 'Voltar para Temporadas';
            backButton.onclick = function () {
                showSeasons(tv_id);
            }
            catalogo.appendChild(backButton);
            episodes.forEach(episode => {
                const episodeItem = document.createElement('div');
                episodeItem.classList.add('item');
                episodeItem.innerHTML = `
                    <h3>Episódio ${episode.episode_number}: ${episode.name}</h3>
                    <button onclick="playEpisode('${tv_id}', '${season_number}', '${episode.episode_number}')">Assistir Episódio</button>
                `;
                catalogo.appendChild(episodeItem);
            });
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
                        alert('Magnet link não encontrado no data.json.');
                    }
                });
        })
        .catch(error => {
            console.error('Erro ao buscar detalhes no TMDB:', error);
            alert('Erro ao buscar o conteúdo. Tente novamente.');
        });
}

// Função auxiliar para buscar o magnet link no data.json
function findMagnetLink(imdbId, season, episode) {
    if (season && episode) {
        //const url = `https://94c8cb9f702d-brazuca-torrents.baby-beamup.club/stream/series/${imdbId}:${season}:${episode}.json`;
        const url = `https://torrentio.strem.fun/providers=comando,bludv%7Csort=qualitysize%7Clanguage=portuguese%7Cqualityfilter=threed,4k,480p/stream/series/${imdbId}:${season}:${episode}.json`;
        console.log(url);
        return fetch(url)
        .then(response => response.json()) // Converte a resposta para JSON
        .then(data => {
           // return 'magnet:?xt=urn:btih:' + data.streams[data.streams.length - 1].infoHash; // Corrigido: concatenando a string corretamente
           try {
                return 'magnet:?xt=urn:btih:' + data.streams[0].infoHash; // Corrigido: concatenando a string corretamente
            } catch (error) {
                return 'magnet:?xt=urn:btih:' + data.streams[data.streams.length - 1].infoHash; // Corrigido: concatenando a string corretamente
            }           
        })
        .catch(error => {
          console.error('Erro:', error);
          return null; // Caso haja erro, retorna null
        });        

    } else {
        //const url = `https://94c8cb9f702d-brazuca-torrents.baby-beamup.club/stream/movie/${imdbId}.json`;
        const url = `https://torrentio.strem.fun/providers=comando,bludv%7Csort=qualitysize%7Clanguage=portuguese%7Cqualityfilter=threed,4k,480p/stream/movie/${imdbId}.json`;
        console.log(url);
        return fetch(url)
        .then(response => response.json()) // Converte a resposta para JSON
        .then(data => {
            //return 'magnet:?xt=urn:btih:' + data.streams[data.streams.length - 1].infoHash; // Corrigido: concatenando a string corretamente
            try {
                return 'magnet:?xt=urn:btih:' + data.streams[0].infoHash; // Corrigido: concatenando a string corretamente
            } catch (error) {
                return 'magnet:?xt=urn:btih:' + data.streams[data.streams.length - 1].infoHash; // Corrigido: concatenando a string corretamente
            }
        })
        .catch(error => {
          console.error('Erro:', error);
          return null; // Caso haja erro, retorna null
        });         
    }
}
