// Dados simulados de artistas, álbuns e músicas
const musicData = {
    artists: [
        {
            id: 1,
            name: "Artista 1",
            image: "https://via.placeholder.com/300"
        }
    ],
    albums: [
        {
            id: 1,
            title: "Album 1",
            artistId: 1,
            year: 2023,
            cover: "https://via.placeholder.com/300",
            songs: [
                {
                    id: 1,
                    title: "Música 1",
                    duration: "3:45",
                    url: "path/to/music1.mp3"
                },
                {
                    id: 2,
                    title: "Música 2",
                    duration: "4:20",
                    url: "path/to/music2.mp3"
                }
            ]
        },
        {
            id: 2,
            title: "Album 2",
            artist: "Artista 2",
            cover: "https://via.placeholder.com/300",
            songs: [
                {
                    id: 3,
                    title: "Música 3",
                    duration: "3:30",
                    url: "path/to/music3.mp3"
                },
                {
                    id: 4,
                    title: "Música 4",
                    duration: "4:15",
                    url: "path/to/music4.mp3"
                }
            ]
        }
    ]
};

// Elementos do DOM
const albumsGrid = document.getElementById('albumsGrid');
const playButton = document.querySelector('.play-btn');
const previousButton = document.querySelector('.control-btn:nth-child(2)');
const nextButton = document.querySelector('.control-btn:nth-child(4)');
const progressBar = document.querySelector('.progress');
const progressFilled = document.querySelector('.progress-filled');
const currentTimeDisplay = document.querySelector('.current-time');
const totalTimeDisplay = document.querySelector('.total-time');
const volumeSlider = document.querySelector('.volume-slider');
const volumeFilled = document.querySelector('.volume-filled');
const backBtn = document.getElementById('backBtn');
const playAllBtn = document.getElementById('playAllBtn');

// Variáveis de controle do player

let isPlaying = false;
let currentTrack = null;
let currentAlbum = null;
const audio = new Audio();

// Controle de paginação
let currentPage = 0;
let isLoadingAlbums = false;
let hasMoreAlbums = true;
musicData.albums = [];

// Renderizar álbuns
function renderAlbums() {
    albumsGrid.innerHTML = '';
    musicData.albums.forEach(album => {
        const artistName = album.artista ? album.artista.nome : (album.artistName || 'Artista');
        // A foto já vem com a URL construída em fetchAlbums
        const artistPhoto = album.artista && album.artista.foto ? album.artista.foto : null;
        const coverUrl = album.cover;
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        albumCard.dataset.albumId = album.id;
        
        let artistHtml = artistName;
        if (artistPhoto) {
            artistHtml = `<img src="${artistPhoto}" alt="${artistName}" class="artist-photo" onerror="this.style.display='none'"> <span>${artistName}</span>`;
        }
        
        albumCard.innerHTML = `
            <img src="${coverUrl}" alt="${album.nome || album.title}" class="album-cover" onerror="this.style.display='none'">
            <div class="album-title">${album.nome || album.title}</div>
            <div class="album-artist">
                ${artistHtml}
            </div>
        `;
        albumsGrid.appendChild(albumCard);
    });
    // Adicionar evento de clique nos álbuns
    document.querySelectorAll('.album-card').forEach(card => {
        card.addEventListener('click', async () => {
            const albumId = parseInt(card.dataset.albumId);
            // Buscar músicas do álbum via API
            try {
                const resp = await fetch(`http://localhost:8080/musicas/album/${albumId}`);
                if (!resp.ok) throw new Error('Erro ao buscar músicas do álbum');
                const musicas = await resp.json();
                currentAlbum = musicData.albums.find(album => album.id === albumId);
                if (currentAlbum) {
                    currentAlbum.songs = musicas.map(m => ({
                        id: m.id,
                        title: m.nome,
                        url: `http://localhost:8080${m.url}`
                    }));
                    openAlbumView(currentAlbum);
                }
            } catch (err) {
                alert('Erro ao buscar músicas do álbum: ' + err.message);
            }
        });
    });
}

// Iniciar reprodução da primeira música do álbum
function playFirstSong() {
    if (currentAlbum && currentAlbum.songs.length > 0) {
        currentTrack = currentAlbum.songs[0];
        loadAndPlayTrack();
    }
}

// Carregar e reproduzir faixa
function loadAndPlayTrack() {
    if (currentTrack) {
        // Atualizar interface
        document.querySelector('.track-name').textContent = currentTrack.title;
        // Buscar nome do artista do álbum
        let artistName = '';
        if (currentAlbum.artista && currentAlbum.artista.nome) {
            artistName = currentAlbum.artista.nome;
        } else if (currentAlbum.artistName) {
            artistName = currentAlbum.artistName;
        } else {
            artistName = 'Artista';
        }
        document.querySelector('.artist-name').textContent = artistName;
        // Capa do álbum
        let coverUrl = currentAlbum.cover;
        document.querySelector('.current-album-cover').src = coverUrl;

    // Mostrar a barra do player quando carregar uma faixa
    showPlayerBar();

        // Configurar áudio para streaming
        audio.src = currentTrack.url.startsWith('http') ? currentTrack.url : `http://localhost:8080${currentTrack.url}`;
        audio.play()
            .then(() => {
                isPlaying = true;
                updatePlayButton();
            })
            .catch(error => {
                console.error('Erro ao reproduzir áudio:', error);
                // Em um ambiente real, você deve tratar os erros adequadamente
            });
    }
}

// Funções para mostrar/ocultar a barra do player
function showPlayerBar() {
    const bar = document.querySelector('.player-bar');
    if (bar) bar.classList.remove('hidden');
}

function hidePlayerBar() {
    const bar = document.querySelector('.player-bar');
    if (bar) bar.classList.add('hidden');
}

// Função para abrir a vista do álbum (Spotify-like)
function openAlbumView(album) {
    const albumView = document.getElementById('albumView');
    const albumsGrid = document.getElementById('albumsGrid');
    
    if (!albumView) return;

    // Preencher informações do álbum
    const artistName = album.artista ? album.artista.nome : (album.artistName || 'Artista');
    const artistPhoto = album.artista && album.artista.foto ? album.artista.foto : null;
    const cover = album.cover || 'placeholder-album.jpg';
    const year = album.anoLancamento || album.year || new Date().getFullYear();

    document.getElementById('albumViewTitle').textContent = album.nome || album.title;
    document.getElementById('albumViewCover').src = cover;
    document.getElementById('albumViewArtist').textContent = artistName;
    if (artistPhoto) {
        document.getElementById('albumViewArtistPhoto').src = artistPhoto;
    }
    document.getElementById('albumViewYear').textContent = year;

    // Renderizar lista de músicas
    const tracksContainer = document.getElementById('albumViewTracks');
    tracksContainer.innerHTML = '';

    if (!album.songs || album.songs.length === 0) {
        tracksContainer.innerHTML = '<div class="no-tracks-message">Nenhuma música disponível</div>';
    } else {
        album.songs.forEach((song, index) => {
            const trackRow = document.createElement('div');
            trackRow.className = 'track-row';
            trackRow.innerHTML = `
                <div class="track-index">${index + 1}</div>
                <div class="track-play-icon"><i class="fas fa-play"></i></div>
                <div class="track-title">${song.title}</div>
                <div class="track-duration">${song.duration || '0:00'}</div>
            `;
            trackRow.addEventListener('click', () => {
                currentTrack = song;
                loadAndPlayTrack();
            });
            tracksContainer.appendChild(trackRow);
        });
    }

    // Mostrar vista de álbum, ocultar grid
    albumsGrid.classList.add('hidden');
    albumView.classList.remove('hidden');
}

// Função para fechar a vista do álbum e voltar à grid
function closeAlbumView() {
    const albumView = document.getElementById('albumView');
    const albumsGrid = document.getElementById('albumsGrid');
    
    if (!albumView) return;
    
    albumView.classList.add('hidden');
    albumsGrid.classList.remove('hidden');
    currentAlbum = null;
}

// Atualizar botão de play/pause
function updatePlayButton() {
    playButton.innerHTML = isPlaying 
        ? '<i class="fas fa-pause"></i>' 
        : '<i class="fas fa-play"></i>';
}

// Controle de reprodução
playButton.addEventListener('click', () => {
    if (!currentTrack) return;

    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
    isPlaying = !isPlaying;
    updatePlayButton();
});

// Event listeners para voltar e reproduzir tudo
if (backBtn) {
    backBtn.addEventListener('click', closeAlbumView);
}

if (playAllBtn) {
    playAllBtn.addEventListener('click', () => {
        if (currentAlbum && currentAlbum.songs && currentAlbum.songs.length > 0) {
            currentTrack = currentAlbum.songs[0];
            loadAndPlayTrack();
        }
    });
}

// Controle de progresso
audio.addEventListener('timeupdate', () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFilled.style.width = `${percent}%`;
    
    // Atualizar tempo atual
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
    totalTimeDisplay.textContent = formatTime(audio.duration);
});

// Clique na barra de progresso
progressBar.addEventListener('click', (e) => {
    const progressTime = (e.offsetX / progressBar.offsetWidth) * audio.duration;
    audio.currentTime = progressTime;
});

// Controle de volume
volumeSlider.addEventListener('click', (e) => {
    const volume = e.offsetX / volumeSlider.offsetWidth;
    audio.volume = volume;
    volumeFilled.style.width = `${volume * 100}%`;
});

// Formatar tempo em minutos:segundos
function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Próxima/Anterior música
function playNextTrack() {
    if (!currentAlbum) return;
    
    const currentIndex = currentAlbum.songs.findIndex(song => song.id === currentTrack.id);
    if (currentIndex < currentAlbum.songs.length - 1) {
        currentTrack = currentAlbum.songs[currentIndex + 1];
        loadAndPlayTrack();
    }
}

function playPreviousTrack() {
    if (!currentAlbum) return;
    
    const currentIndex = currentAlbum.songs.findIndex(song => song.id === currentTrack.id);
    if (currentIndex > 0) {
        currentTrack = currentAlbum.songs[currentIndex - 1];
        loadAndPlayTrack();
    }
}

nextButton.addEventListener('click', playNextTrack);
previousButton.addEventListener('click', playPreviousTrack);

// Gerenciamento de Modais
const modals = {
    artist: document.getElementById('artistModal'),
    album: document.getElementById('albumModal'),
    upload: document.getElementById('uploadModal')
};

const buttons = {
    artist: document.getElementById('addArtistButton'),
    album: document.getElementById('addAlbumButton'),
    upload: document.getElementById('uploadButton')
};

const forms = {
    artist: document.getElementById('artistForm'),
    album: document.getElementById('albumForm'),
    upload: document.getElementById('uploadForm')
};

// Função para abrir modal
function openModal(modalId) {
    modals[modalId].style.display = 'flex';
    setTimeout(() => modals[modalId].classList.add('active'), 10);
}

// Função para fechar modal
function closeModal(modalId) {
    modals[modalId].classList.remove('active');
    setTimeout(() => modals[modalId].style.display = 'none', 300);
}

// Configurar eventos dos botões
Object.keys(buttons).forEach(key => {
    buttons[key].addEventListener('click', () => openModal(key));
});

// Configurar eventos de fechar
document.querySelectorAll('.close').forEach(button => {
    const modalId = button.dataset.modal.replace('Modal', '');
    button.addEventListener('click', () => closeModal(modalId));
});

// Fechar modal ao clicar fora
window.addEventListener('click', (event) => {
    Object.keys(modals).forEach(key => {
        if (event.target === modals[key]) {
            closeModal(key);
        }
    });
});

// Atualizar labels dos inputs de arquivo
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', function() {
        const label = this.parentElement.querySelector('.file-input-label');
        label.textContent = this.files[0] ? this.files[0].name : 'Escolher arquivo';
    });
});

// Manipular formulário de artista
forms.artist.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('newArtistName').value;
    const imageFile = document.getElementById('artistImage').files[0];

    try {
        // 1. Cadastrar artista (POST JSON)
        const response = await fetch('http://localhost:8080/artistas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome })
        });
        if (!response.ok) throw new Error('Erro ao cadastrar artista');
        const artista = await response.json();

        // 2. Upload da foto (POST multipart)
        if (imageFile) {
            const formData = new FormData();
            formData.append('arquivo', imageFile);
            await fetch(`http://localhost:8080/artistas/${artista.id}/foto`, {
                method: 'POST',
                body: formData
            });
        }

        // 3. Atualizar interface (adiciona artista localmente)
        musicData.artists.push({
            id: artista.id,
            name: artista.nome,
            image: imageFile ? URL.createObjectURL(imageFile) : null
        });
        forms.artist.reset();
        closeModal('artist');
        alert('Artista adicionado com sucesso!');
        updateArtistSelects();
    } catch (err) {
        alert('Erro ao cadastrar artista: ' + err.message);
    }
});

// Manipular formulário de álbum
forms.album.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('newAlbumTitle').value;
    const artistaId = document.getElementById('albumArtist').value;
    const anoLancamento = document.getElementById('releaseYear').value;
    const coverFile = document.getElementById('albumCover').files[0];

    try {
        // 1. Cadastrar álbum (POST JSON)
        const response = await fetch('http://localhost:8080/albuns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                nome, 
                artistaId: parseInt(artistaId), 
                anoLancamento: parseInt(anoLancamento) 
            })
        });
        if (!response.ok) throw new Error('Erro ao cadastrar álbum');
        const album = await response.json();

        // 2. Upload da capa (POST multipart, se houver)
        let urlCapa = null;
        if (coverFile) {
            const formData = new FormData();
            formData.append('arquivo', coverFile);
            const capaResp = await fetch(`http://localhost:8080/albuns/${album.id}/capa`, {
                method: 'POST',
                body: formData
            });
            if (capaResp.ok) {
                urlCapa = `/albuns/${album.id}/capa`;
            }
        }

        // 3. Atualizar interface (adiciona álbum localmente)
        musicData.albums.push({
            id: album.id,
            title: album.nome,
            artistId: album.artista.id,
            year: album.anoLancamento,
            cover: urlCapa || null,
            songs: []
        });
        forms.album.reset();
        closeModal('album');
        alert('Álbum adicionado com sucesso!');
        renderAlbums();
        updateAlbumSelects();
    } catch (err) {
        alert('Erro ao cadastrar álbum: ' + err.message);
    }
});

// Manipular formulário de upload de música
forms.upload.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('musicTitle').value;
    const albumId = document.getElementById('selectAlbum').value;
    const musicFile = document.getElementById('musicFile').files[0];
    // Buscar artistaId do álbum
    const album = musicData.albums.find(a => a.id === parseInt(albumId));
    const artistaId = album ? album.artistId : null;

    // Duração será calculada no backend
    const dados = {
        nome,
        albumId: parseInt(albumId),
        artistaId: parseInt(artistaId),
        duracaoSegundos: 0,
        duracaoFormatada: "0:00"
    };

    try {
        // Montar multipart
        const formData = new FormData();
        formData.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
        formData.append('arquivo', musicFile);

        // POST para /musicas
        const response = await fetch('http://localhost:8080/musicas', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Erro ao cadastrar música');
        const musica = await response.json();

        // Atualizar interface local
        if (album) {
            album.songs.push({
                id: musica.id,
                title: musica.nome,
                url: musica.url,
                duration: "0:00"
            });
        }
        forms.upload.reset();
        closeModal('upload');
        alert('Música adicionada com sucesso!');
        renderAlbums();
    } catch (err) {
        alert('Erro ao cadastrar música: ' + err.message);
    }
});

// Função para atualizar selects de artistas
function updateArtistSelects() {
    const artistSelect = document.getElementById('albumArtist');
    artistSelect.innerHTML = musicData.artists.map(artist => 
        `<option value="${artist.id}">${artist.name}</option>`
    ).join('');
}

// Função para atualizar selects de álbuns
function updateAlbumSelects() {
    const albumSelect = document.getElementById('selectAlbum');
    albumSelect.innerHTML = musicData.albums.map(album => {
        const artist = musicData.artists.find(a => a.id === album.artistId);
        return `<option value="${album.id}">${album.title} - ${artist ? artist.name : 'Artista Desconhecido'}</option>`;
    }).join('');
}

// Inicializar selects
updateArtistSelects();
updateAlbumSelects();

// Inicializar a aplicação

// Função para buscar álbuns da API (com paginação)
async function fetchAlbums(page = 0, size = 20) {
    if (isLoadingAlbums || !hasMoreAlbums) return;
    isLoadingAlbums = true;
    try {
        const resp = await fetch(`http://localhost:8080/albuns?pagina=${page}&tamanho=${size}`);
        if (!resp.ok) throw new Error('Erro ao buscar álbuns');
        const data = await resp.json();
        if (Array.isArray(data.content)) {
            // Ajusta as URLs das imagens antes de adicionar ao musicData
            const albumsWithUrls = data.content.map(album => ({
                ...album,
                cover: `http://localhost:8080/albuns/${album.id}/capa`,
                artista: {
                    ...album.artista,
                    foto: `http://localhost:8080/artistas/${album.artista.id}/foto`
                }
            }));
            musicData.albums = musicData.albums.concat(albumsWithUrls);
            renderAlbums();
            hasMoreAlbums = data.content.length === size;
            currentPage = data.pageable.pageNumber + 1;
        } else {
            hasMoreAlbums = false;
        }
    } catch (err) {
        alert('Erro ao buscar álbuns: ' + err.message);
    }
    isLoadingAlbums = false;
}

// Scroll infinito
albumsGrid.addEventListener('scroll', () => {
    if (albumsGrid.scrollTop + albumsGrid.clientHeight >= albumsGrid.scrollHeight - 100) {
        fetchAlbums(currentPage);
    }
});

// Inicialização
fetchAlbums();