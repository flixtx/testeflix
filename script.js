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
                    if (item.media_type === 'movie' || item.media_type === 'tv') {
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
                    }
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
                        openModalWithPlayer(magnet, imdb_id);
                    } else {
                        alert('Magnet link não encontrado no data.json.');
                    }
                })
                .catch(error => {
                    console.error(error);
                    alert('Erro ao selecionar o torrent.');
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
                        openModalWithPlayer(magnet, imdb_id);
                    } else {
                        alert('Magnet link não encontrado no data.json.');
                    }
                })
                .catch(error => {
                    console.error(error);
                    alert('Erro ao selecionar o torrent.');
                });
        })
        .catch(error => {
            console.error('Erro ao buscar detalhes no TMDB:', error);
            alert('Erro ao buscar o conteúdo. Tente novamente.');
        });
}

// Função auxiliar para buscar o magnet link no data.json
function findMagnetLink(imdbId, season, episode) {
    const isSeries = season && episode;
    const url = isSeries
        ? `https://torrentio.strem.fun/providers=comando,bludv/stream/series/${imdbId}:${season}:${episode}.json`
        : `https://torrentio.strem.fun/providers=comando,bludv/stream/movie/${imdbId}.json`;

    console.log(url);

    // Requisição para obter os torrents
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.streams && data.streams.length > 0) {
                // Criação do modal de torrents
                const torrentsContainer = $('#torrentModal');
                const selectElement = $('#torrentSelect');
                
                // Limpa o conteúdo da seleção antes de adicionar novos
                selectElement.empty();
                selectElement.append('<option value="">Selecione um Torrent</option>'); // Opção padrão

                // Adiciona o texto no topo do modal
                // const textElement = $('<h3>Escolha o Torrent:</h3>');
                // torrentsContainer.prepend(textElement); // Insere no topo da caixa do modal

                // Adiciona as opções de torrents no select
                data.streams.forEach(torrent => {
                    const option = $('<option></option>')
                        .attr('value', torrent.infoHash)
                        .text(torrent.title);
                    selectElement.append(option);
                });

                // Exibe o modal
                torrentsContainer.show();

                return new Promise((resolve, reject) => {
                    // Quando o usuário selecionar um torrent, gerar o link magnético
                    selectElement.on('change', function () {
                        const selectedInfoHash = selectElement.val();
                        if (selectedInfoHash) {
                            const magnetLink = 'magnet:?xt=urn:btih:' + selectedInfoHash;
                            console.log('Magnet Link:', magnetLink);
                            $('#torrentModal').hide(); // Fecha o modal automaticamente após a seleção
                            resolve(magnetLink); // Resolve o link magnético
                        } else {
                            reject('Nenhum torrent selecionado.');
                        }
                    });
                });
            } else {
                console.log('Nenhum torrent encontrado.');
                alert('Nenhum torrent encontrado.');
                return null;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            return null; // Caso haja erro, retorna null
        });
}



// Função para fechar o modal manualmente (caso o usuário queira fechar)
$(document).ready(function () {
    // Fecha o modal quando o botão de fechar for clicado
    $('#closeModal').on('click', function () {
        $('#torrentModal').hide();
    });

    // Fecha o modal quando clicar fora do modal
    $(window).on('click', function (event) {
        if ($(event.target).is('#torrentModal')) {
            $('#torrentModal').hide();
        }
    });
});


// Função para desativar qualquer iframe com o nome 'webtor' ou qualquer iframe carregado
function bloquearIframes() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        if (iframe.title === 'offer') {
            iframe.style.display = 'none';
            iframe.src = '';
        }
    });
}

// Executa ao carregar a página
document.addEventListener('DOMContentLoaded', bloquearIframes);

// Observa mudanças no DOM para capturar iframes adicionados dinamicamente
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'IFRAME') {
                // Verifica se o iframe não tem um atributo src ou se está vazio
                if (!node.hasAttribute('src') || !node.src.trim()) {
                    console.log('Iframe sem src detectado e removido:', node);
                    node.remove();
                }
            }
        });
    });
});
observer.observe(document.body, { childList: true, subtree: true });




