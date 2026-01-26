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

const API_BASE = 'https://player-api.gpinheiro.cloud'; // dev: 'http://localhost:8082' -- prod: 'https://player-api.gpinheiro.cloud'

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
const homeButton = document.getElementById('homeButton');

// Top navigation (início / voltar) container
const topNav = document.querySelector('.navigation-buttons');

// Esconder navegação superior inicialmente (apenas mostrar quando abrir um álbum)
if (topNav) topNav.style.display = 'none';

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
        let coverUrl = album.cover;
        if (coverUrl) {
            // Se a URL não for absoluta, tornar absoluta apontando para o backend
            if (!coverUrl.startsWith('http')) {
                if (coverUrl.startsWith('/')) {
                    coverUrl = `${API_BASE}${coverUrl}`;
                } else {
                    coverUrl = `${API_BASE}/${coverUrl}`;
                }
            }
        } else {
            coverUrl = 'placeholder-album.jpg';
        }
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
                const resp = await fetch(`${API_BASE}/musicas/album/${albumId}`);
                if (!resp.ok) throw new Error('Erro ao buscar músicas do álbum');
                const musicas = await resp.json();
                currentAlbum = musicData.albums.find(album => album.id === albumId);
                if (currentAlbum) {
                    currentAlbum.songs = musicas.map(m => ({
                        id: m.id,
                        title: m.nome,
                        url: `${API_BASE}${m.url}`
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
        audio.src = currentTrack.url.startsWith('http') ? currentTrack.url : `${API_BASE}${currentTrack.url}`;
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
                <div class="track-options">
                    <button class="track-options-btn" aria-label="Opções"><i class="fas fa-ellipsis-v"></i></button>
                    <div class="track-options-menu hidden">
                        <button class="track-option delete-track danger">Remover música</button>
                    </div>
                </div>
            `;

            // Reproduzir ao clicar na linha (exceto quando clicar no menu)
            trackRow.addEventListener('click', (ev) => {
                if (ev.target.closest('.track-options')) return;
                currentTrack = song;
                loadAndPlayTrack();
            });

            // Configurar botão de opções da faixa
            setTimeout(() => {
                const btn = trackRow.querySelector('.track-options-btn');
                const menu = trackRow.querySelector('.track-options-menu');
                const deleteBtn = trackRow.querySelector('.delete-track');

                if (btn && menu) {
                    btn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        // fechar outros menus
                        document.querySelectorAll('.track-options-menu').forEach(m => { if (m !== menu) m.classList.add('hidden'); });
                        menu.classList.toggle('hidden');
                    });
                }

                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        trackToDelete = { songId: song.id, albumId: album.id };
                        openModal('deleteTrack');
                        if (menu) menu.classList.add('hidden');
                    });
                }
            }, 0);

            tracksContainer.appendChild(trackRow);
        });
    }

    // Mostrar vista de álbum, ocultar grid
    albumsGrid.classList.add('hidden');
    albumView.classList.remove('hidden');
    // Mostrar apenas a seta de voltar no topo quando dentro do álbum
    if (topNav) {
        topNav.style.display = 'flex';
        // mostrar somente o backBtn dentro do container
        topNav.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.id === 'backBtn') btn.style.display = 'inline-flex';
            else btn.style.display = 'none';
        });
    }
}

// Função para fechar a vista do álbum e voltar à grid
function closeAlbumView() {
    const albumView = document.getElementById('albumView');
    const albumsGrid = document.getElementById('albumsGrid');
    
    if (!albumView) return;
    
    albumView.classList.add('hidden');
    albumsGrid.classList.remove('hidden');
    currentAlbum = null;
    // Ao voltar para listagem, esconder a navegação superior
    if (topNav) topNav.style.display = 'none';
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

// Clique no botão Início: voltar para listagem principal
if (homeButton) {
    homeButton.addEventListener('click', () => {
        // fechar vista se aberta e garantir grid visível
        closeAlbumView();
        // esconder navegação superior na listagem
        if (topNav) topNav.style.display = 'none';
    });
}

if (playAllBtn) {
    playAllBtn.addEventListener('click', () => {
        if (currentAlbum && currentAlbum.songs && currentAlbum.songs.length > 0) {
            currentTrack = currentAlbum.songs[0];
            loadAndPlayTrack();
        }
    });
}

// Botão de upload dentro da vista do álbum
const uploadInAlbumBtn = document.getElementById('uploadInAlbumBtn');
if (uploadInAlbumBtn) {
    uploadInAlbumBtn.addEventListener('click', () => {
        if (!currentAlbum) return alert('Abra um álbum primeiro.');
        // Pré-selecionar o álbum atual no formulário
        const selectAlbum = document.getElementById('selectAlbum');
        if (selectAlbum) {
            selectAlbum.value = currentAlbum.id;
            selectAlbum.disabled = true;
        }
        // Abrir modal de upload
        openModal('upload');
    });
}

// Flag para controlar se estamos no upload via álbum
let uploadFromAlbumPage = false;

// Função para habilitar/desabilitar seleção de álbum (reabre modal a partir do botão principal)
function enableAlbumSelection() {
    const selectAlbum = document.getElementById('selectAlbum');
    if (selectAlbum) {
        selectAlbum.disabled = false;
    }
    uploadFromAlbumPage = false;
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

// Alternar mudo ao clicar no ícone de volume
const volumeIcon = document.querySelector('.volume-control i');
let previousVolume = audio.volume || 1;
if (volumeIcon) {
    volumeIcon.style.cursor = 'pointer';
    volumeIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!audio.muted) {
            // guardar volume atual e mutar
            previousVolume = audio.volume;
            audio.muted = true;
            // trocar ícone para mudo
            volumeIcon.classList.remove('fa-volume-up');
            volumeIcon.classList.add('fa-volume-xmark');
            // esvaziar visualmente o slider
            if (volumeFilled) volumeFilled.style.width = '0%';
        } else {
            // desmutar e restaurar volume
            audio.muted = false;
            audio.volume = (previousVolume !== undefined && previousVolume !== null) ? previousVolume : 1;
            // trocar ícone para volume
            volumeIcon.classList.remove('fa-volume-xmark');
            volumeIcon.classList.add('fa-volume-up');
            if (volumeFilled) volumeFilled.style.width = `${audio.volume * 100}%`;
        }
    });
}

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

// Quando a música terminar, avançar automaticamente para a próxima
audio.addEventListener('ended', () => {
    if (!currentAlbum || !currentTrack) {
        isPlaying = false;
        updatePlayButton();
        return;
    }
    const currentIndex = currentAlbum.songs.findIndex(song => song.id === currentTrack.id);
    if (currentIndex < currentAlbum.songs.length - 1) {
        playNextTrack();
    } else {
        // fim da lista
        isPlaying = false;
        updatePlayButton();
    }
});

// Gerenciamento de Modais
const modals = {
    artist: document.getElementById('artistModal'),
    album: document.getElementById('albumModal'),
    upload: document.getElementById('uploadModal')
};

// Novos modais (editar nome, editar capa, confirmar exclusão)
modals.editName = document.getElementById('editNameModal');
modals.editCover = document.getElementById('editCoverModal');
modals.deleteConfirm = document.getElementById('deleteConfirmModal');
modals.deleteTrack = document.getElementById('deleteTrackModal');

const buttons = {
    artist: document.getElementById('addArtistButton'),
    album: document.getElementById('addAlbumButton')
};

const forms = {
    artist: document.getElementById('artistForm'),
    album: document.getElementById('albumForm'),
    upload: document.getElementById('uploadForm')
};

// Formulários/modais relacionados a edição/exclusão de álbum
const editNameForm = document.getElementById('editNameForm');
const editCoverForm = document.getElementById('editCoverForm');
const editNameInput = document.getElementById('editNameInput');
const editCoverFile = document.getElementById('editCoverFile');

// Menu de opções do álbum (três pontos)
const albumOptionsBtn = document.getElementById('albumOptionsBtn');
const albumOptionsMenu = document.getElementById('albumOptionsMenu');
const changeAlbumNameBtn = document.getElementById('changeAlbumNameBtn');
const changeAlbumCoverBtn = document.getElementById('changeAlbumCoverBtn');
const deleteAlbumBtn = document.getElementById('deleteAlbumBtn');

// Botões de confirmação/cancelamento no modal de exclusão
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteTrackBtn = document.getElementById('confirmDeleteTrackBtn');
const cancelDeleteTrackBtn = document.getElementById('cancelDeleteTrackBtn');

// Estado temporário para exclusão de faixa
let trackToDelete = null;

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
    buttons[key].addEventListener('click', () => {
        openModal(key);
    });
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

// --- Menu de opções do álbum (três pontos) ---
if (albumOptionsBtn && albumOptionsMenu) {
    albumOptionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        albumOptionsMenu.classList.toggle('hidden');
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!albumOptionsMenu.contains(e.target) && e.target !== albumOptionsBtn) {
            albumOptionsMenu.classList.add('hidden');
        }
        // Fechar menus de opções das faixas
        document.querySelectorAll('.track-options-menu').forEach(menu => {
            const btn = menu.parentElement ? menu.parentElement.querySelector('.track-options-btn') : null;
            if (menu && !menu.contains(e.target) && e.target !== btn) {
                menu.classList.add('hidden');
            }
        });
    });
}

// Ações do menu
if (changeAlbumNameBtn) {
    changeAlbumNameBtn.addEventListener('click', () => {
        albumOptionsMenu.classList.add('hidden');
        if (!currentAlbum) return alert('Abra um álbum primeiro.');
        editNameInput.value = currentAlbum.nome || currentAlbum.title || '';
        openModal('editName');
    });
}

if (changeAlbumCoverBtn) {
    changeAlbumCoverBtn.addEventListener('click', () => {
        albumOptionsMenu.classList.add('hidden');
        if (!currentAlbum) return alert('Abra um álbum primeiro.');
        // reset input label
        const lbl = document.querySelector('#editCoverFile').parentElement.querySelector('.file-input-label');
        if (lbl) lbl.textContent = 'Escolher arquivo';
        openModal('editCover');
    });
}

if (deleteAlbumBtn) {
    deleteAlbumBtn.addEventListener('click', () => {
        albumOptionsMenu.classList.add('hidden');
        if (!currentAlbum) return alert('Abra um álbum primeiro.');
        openModal('deleteConfirm');
    });
}

// Editar nome do álbum (rota /albuns/{id}/nome)
if (editNameForm) {
    editNameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentAlbum) return alert('Nenhum álbum selecionado.');
        const newName = editNameInput.value.trim();
        if (!newName) return alert('Nome inválido.');
        try {
            const resp = await fetch(`${API_BASE}/albuns/${currentAlbum.id}/nome`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: newName })
            });
            if (!resp.ok) throw new Error('Erro ao atualizar nome do álbum');

            // Atualizar localmente
            const albumLocal = musicData.albums.find(a => a.id === currentAlbum.id);
            if (albumLocal) {
                albumLocal.nome = newName;
                albumLocal.title = newName;
            }
            if (currentAlbum) {
                currentAlbum.nome = newName;
                currentAlbum.title = newName;
            }
            document.getElementById('albumViewTitle').textContent = newName;
            renderAlbums();
            updateAlbumSelects();
            closeModal('editName');
            alert('Nome do álbum atualizado com sucesso.');
        } catch (err) {
            alert('Erro ao atualizar nome: ' + err.message);
        }
    });
}

// Alterar capa do álbum (rota /albuns/{id}/capa)
if (editCoverForm) {
    editCoverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentAlbum) return alert('Nenhum álbum selecionado.');
        const file = editCoverFile.files[0];
        if (!file) return alert('Selecione um arquivo de imagem.');
        try {
            const formData = new FormData();
            formData.append('capa', file);
            const resp = await fetch(`${API_BASE}/albuns/${currentAlbum.id}/capa`, {
                method: 'PUT',
                body: formData
            });
            if (!resp.ok) throw new Error('Erro ao enviar nova capa');

            // Atualizar URL localmente (assume rota está servindo em /albuns/{id}/capa)
            const newCoverUrl = `${API_BASE}/albuns/${currentAlbum.id}/capa`;  
            const albumLocal = musicData.albums.find(a => a.id === currentAlbum.id);
            if (albumLocal) albumLocal.cover = newCoverUrl;
            if (currentAlbum) currentAlbum.cover = newCoverUrl;
            document.getElementById('albumViewCover').src = newCoverUrl;
            renderAlbums();
            updateAlbumSelects();
            closeModal('editCover');
            alert('Capa atualizada com sucesso.');
        } catch (err) {
            alert('Erro ao atualizar capa: ' + err.message);
        }
    });
}

// Excluir álbum
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!currentAlbum) return alert('Nenhum álbum selecionado.');
        try {
            const resp = await fetch(`${API_BASE}/albuns/${currentAlbum.id}`, { method: 'DELETE' });
            if (!resp.ok) throw new Error('Erro ao excluir álbum');

            // Remover localmente e atualizar UI
            musicData.albums = musicData.albums.filter(a => a.id !== currentAlbum.id);
            closeModal('deleteConfirm');
            closeAlbumView();
            renderAlbums();
            updateAlbumSelects();
            alert('Álbum excluído com sucesso.');
        } catch (err) {
            alert('Erro ao excluir álbum: ' + err.message);
        }
    });
}

if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => closeModal('deleteConfirm'));
}

// Excluir música (confirmar)
if (confirmDeleteTrackBtn) {
    confirmDeleteTrackBtn.addEventListener('click', async () => {
        if (!trackToDelete || !trackToDelete.songId) return alert('Nenhuma música selecionada para exclusão.');
        try {
            const resp = await fetch(`${API_BASE}/musicas/${trackToDelete.songId}`, { method: 'DELETE' });
            if (!resp.ok) throw new Error('Erro ao excluir música');

            // Remover localmente
            const albumLocal = musicData.albums.find(a => a.id === trackToDelete.albumId);
            if (albumLocal && Array.isArray(albumLocal.songs)) {
                albumLocal.songs = albumLocal.songs.filter(s => s.id !== trackToDelete.songId);
            }
            if (currentAlbum && currentAlbum.id === trackToDelete.albumId) {
                currentAlbum.songs = currentAlbum.songs.filter(s => s.id !== trackToDelete.songId);
                openAlbumView(currentAlbum);
            }
            closeModal('deleteTrack');
            trackToDelete = null;
            alert('Música excluída com sucesso.');
        } catch (err) {
            alert('Erro ao excluir música: ' + err.message);
        }
    });
}

if (cancelDeleteTrackBtn) {
    cancelDeleteTrackBtn.addEventListener('click', () => {
        trackToDelete = null;
        closeModal('deleteTrack');
    });
}

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
        const response = await fetch(`${API_BASE}/artistas`, {
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
            await fetch(`${API_BASE}/artistas/${artista.id}/foto`, {
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
        const response = await fetch(`${API_BASE}/albuns`, {
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
            formData.append('capa', coverFile);
            const capaResp = await fetch(`${API_BASE}/albuns/${album.id}/capa`, {
                method: 'PUT',
                body: formData
            });
            if (capaResp.ok) {
                urlCapa = `${API_BASE}/albuns/${album.id}/capa`;  
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
    // Determina artistaId suportando diferentes formatos retornados pela API
    const artistaId = album ? (album.artistId || (album.artista && (album.artista.id || album.artistaId)) || null) : null;

    // Duração será calculada no backend
    const dados = {
        nome,
        albumId: parseInt(albumId),
        artistaId: (artistaId !== null && artistaId !== undefined) ? parseInt(artistaId) : null,
        duracaoSegundos: 0,
        duracaoFormatada: "0:00"
    };

    try {
        // Montar multipart
        const formData = new FormData();
        formData.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
        formData.append('arquivo', musicFile);

        // POST para /musicas
        const response = await fetch(`${API_BASE}/musicas`, {
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
        // Se estamos na vista de um álbum, re-renderizar a lista de faixas
        if (currentAlbum && currentAlbum.id === parseInt(albumId)) {
            openAlbumView(currentAlbum);
        }
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

// Buscar artistas do backend e popular `musicData.artists`
async function fetchArtists() {
    try {
        const resp = await fetch(`${API_BASE}/artistas`);
        if (!resp.ok) throw new Error('Erro ao buscar artistas');
        const data = await resp.json();
        if (Array.isArray(data)) {
            musicData.artists = data.map(a => ({
                id: a.id,
                name: a.nome || a.name || 'Artista',
                image: `${API_BASE}/artistas/${a.id}/foto`
            }));
            updateArtistSelects();
        }
    } catch (err) {
        console.warn('Não foi possível carregar artistas:', err.message);
    }
}

// Função para atualizar selects de álbuns
function updateAlbumSelects() {
    const albumSelect = document.getElementById('selectAlbum');
    albumSelect.innerHTML = musicData.albums.map(album => {
        const albumName = album.title || album.nome || 'Álbum';
        const artistId = album.artistId || (album.artista && album.artista.id) || null;
        const artist = musicData.artists.find(a => a.id === artistId);
        const artistName = artist ? artist.name : (album.artista ? (album.artista.nome || album.artista.name) : 'Artista Desconhecido');
        return `<option value="${album.id}">${albumName} - ${artistName}</option>`;
    }).join('');
}

// Inicializar selects: buscar artistas antes de carregar álbuns
fetchArtists().then(() => {
    updateAlbumSelects();
    // Inicializar a aplicação (buscar álbuns)
    fetchAlbums();
}).catch(() => {
    // Mesmo que falhe, tentar buscar álbuns
    fetchAlbums();
});

// Função para buscar álbuns da API (com paginação)
async function fetchAlbums(page = 0, size = 20) {
    if (isLoadingAlbums || !hasMoreAlbums) return;
    isLoadingAlbums = true;
    try {
        const resp = await fetch(`${API_BASE}/albuns?pagina=${page}&tamanho=${size}`);
        if (!resp.ok) throw new Error('Erro ao buscar álbuns');
        const data = await resp.json();
        if (Array.isArray(data.content)) {
            // Ajusta as URLs das imagens antes de adicionar ao musicData
            const albumsWithUrls = data.content.map(album => ({
                ...album,
                cover: `${API_BASE}/albuns/${album.id}/capa`,
                artista: {
                    ...album.artista,
                    foto: `${API_BASE}/artistas/${album.artista.id}/foto`
                }
            }));
            musicData.albums = musicData.albums.concat(albumsWithUrls);
            renderAlbums();
            // Atualizar select de álbumes após carregar novos álbuns
            updateAlbumSelects();
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