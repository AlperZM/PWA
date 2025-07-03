// Service Worker'ı kaydet
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker başarıyla kaydedildi:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker kaydı başarısız oldu:', error);
            });
    });
}

// ------ Müzik Çalar İşlevselliği Başlangıcı ------

// HTML elementlerini seçiyoruz
const playPauseButton = document.getElementById('play-pause-button');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const shuffleButton = document.getElementById('shuffle-button');
const repeatButton = document.getElementById('repeat-button');
const addSongButton = document.getElementById('add-song-button');
const createNewPlaylistButton = document.getElementById('create-new-playlist-button');
const songList = document.getElementById('song-list');
const currentSongTitle = document.getElementById('current-song-title');
const currentSongDuration = document.getElementById('current-song-duration');
const progressBar = document.querySelector('.progress-bar');

let audio = new Audio(); // HTML5 Audio nesnesi oluştur

let currentPlaylist = []; // Mevcut çalma listesi
let currentSongIndex = -1; // Çalan şarkının indeksi
let isPlaying = false; // Çalan durumda mı?
let isShuffled = false; // Karışık çalma açık mı?
let isRepeating = false; // Tekrar çalma açık mı?

// Olay Dinleyicileri
playPauseButton.addEventListener('click', togglePlayPause);
prevButton.addEventListener('click', playPreviousSong);
nextButton.addEventListener('click', playNextSong);
shuffleButton.addEventListener('click', toggleShuffle);
repeatButton.addEventListener('click', toggleRepeat);
addSongButton.addEventListener('click', selectAudioFiles);
createNewPlaylistButton.addEventListener('click', createNewPlaylist);

// Ses dosyasının oynatma süresi güncellendiğinde ilerleme çubuğunu ve süreyi güncelle
audio.addEventListener('timeupdate', updateProgressBar);
// Ses bittiğinde otomatik olarak sonraki şarkıyı çal
audio.addEventListener('ended', handleSongEnded);

// Fonksiyonlar

// Oynat/Duraklat Fonksiyonu
function togglePlayPause() {
    if (currentPlaylist.length === 0) {
        alert('Lütfen önce bir şarkı ekleyin.');
        return;
    }

    if (isPlaying) {
        audio.pause();
        playPauseButton.textContent = 'Oynat';
    } else {
        if (currentSongIndex === -1) { // Hiç şarkı seçilmediyse ilk şarkıyı çal
            currentSongIndex = 0;
            loadAndPlaySong(currentPlaylist[currentSongIndex]);
        } else {
            audio.play();
        }
        playPauseButton.textContent = 'Duraklat';
    }
    isPlaying = !isPlaying;
}

// Önceki Şarkı
function playPreviousSong() {
    if (currentPlaylist.length === 0) return;

    currentSongIndex--;
    if (currentSongIndex < 0) {
        currentSongIndex = currentPlaylist.length - 1; // Başa dön
    }
    loadAndPlaySong(currentPlaylist[currentSongIndex]);
}

// Sonraki Şarkı
function playNextSong() {
    if (currentPlaylist.length === 0) return;

    if (isShuffled) {
        currentSongIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else {
        currentSongIndex++;
        if (currentSongIndex >= currentPlaylist.length) {
            currentSongIndex = 0; // Başa dön
        }
    }
    loadAndPlaySong(currentPlaylist[currentSongIndex]);
}

// Karışık Çalmayı Aç/Kapat
function toggleShuffle() {
    isShuffled = !isShuffled;
    shuffleButton.classList.toggle('active', isShuffled); // CSS için 'active' sınıfı ekle
    alert(`Karışık Çalma: ${isShuffled ? 'Açık' : 'Kapalı'}`);
}

// Tekrar Çalmayı Aç/Kapat
function toggleRepeat() {
    isRepeating = !isRepeating;
    repeatButton.classList.toggle('active', isRepeating); // CSS için 'active' sınıfı ekle
    audio.loop = isRepeating; // HTML5 Audio nesnesinin loop özelliğini ayarla
    alert(`Tekrar Çalma: ${isRepeating ? 'Açık' : 'Kapalı'}`);
}

// Şarkıyı Yükle ve Çal
function loadAndPlaySong(file) {
    if (file instanceof File) { // Eğer bir File nesnesiyse URL oluştur
        audio.src = URL.createObjectURL(file);
        currentSongTitle.textContent = file.name;
    } else { // Eğer kaydedilmiş bir dosya yolu ise (ileride localStorage için)
        audio.src = file.path; // Varsayım: file objesinde path özelliği var
        currentSongTitle.textContent = file.name;
    }
    
    audio.play();
    isPlaying = true;
    playPauseButton.textContent = 'Duraklat';

    // Şarkı süresi yüklendiğinde süreyi göster
    audio.onloadedmetadata = () => {
        currentSongDuration.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
    };
}

// İlerleme Çubuğunu Güncelle
function updateProgressBar() {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentSongDuration.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
}

// Şarkı Bittiğinde Ne Yapılacak
function handleSongEnded() {
    if (isRepeating) {
        audio.play(); // Sadece mevcut şarkıyı tekrar çal
    } else {
        playNextSong(); // Sonraki şarkıya geç
    }
}

// Zamanı MM:SS formatına dönüştür
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Cihazdan Ses Dosyaları Seçme Fonksiyonu
async function selectAudioFiles() {
    // Input elementini programatik olarak oluştur
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mp3,audio/wav,audio/aac,audio/ogg'; // Sadece ses dosyalarını kabul et
    input.multiple = true; // Birden fazla dosya seçimine izin ver

    // Değişiklik olayı dinleyicisi
    input.onchange = async (event) => {
        const files = event.target.files;
        if (files.length === 0) {
            console.log('Dosya seçilmedi.');
            return;
        }

        // Seçilen dosyaları çalma listesine ekle
        for (const file of files) {
            if (file.type.startsWith('audio/')) {
                currentPlaylist.push(file);
                renderSongList(); // Çalma listesini ekranda güncelle
            } else {
                alert(`"${file.name}" bir ses dosyası değil ve eklenemedi.`);
            }
        }
        
        // Eğer hiçbir şarkı çalmıyorsa, ilk eklenen şarkıyı çalmaya başla
        if (!isPlaying && currentPlaylist.length > 0 && currentSongIndex === -1) {
            currentSongIndex = 0;
            loadAndPlaySong(currentPlaylist[currentSongIndex]);
            togglePlayPause(); // Şarkıyı başlat
        }
    };

    // Oluşturulan input elementini tetikle (tıklat)
    input.click();
}

// Çalma Listesini Ekranda Göster
function renderSongList() {
    songList.innerHTML = ''; // Mevcut listeyi temizle
    currentPlaylist.forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${file.name}`;
        li.dataset.index = index; // Şarkının indeksini kaydet
        li.addEventListener('click', () => {
            currentSongIndex = index;
            loadAndPlaySong(file);
            togglePlayPause(); // Şarkıyı başlat
        });
        songList.appendChild(li);
    });
}

// Yeni Çalma Listesi Oluşturma (Şimdilik Temel Fonksiyon)
function createNewPlaylist() {
    // İlerleyen adımlarda buraya daha karmaşık bir mantık gelecek.
    // Şimdilik sadece mevcut listeyi temizleyebiliriz.
    const confirmClear = confirm('Mevcut çalma listesini temizleyip yeni bir liste oluşturmak istediğinizden emin misiniz?');
    if (confirmClear) {
        currentPlaylist = [];
        currentSongIndex = -1;
        isPlaying = false;
        audio.pause();
        audio.src = ''; // Ses kaynağını temizle
        playPauseButton.textContent = 'Oynat';
        currentSongTitle.textContent = 'Şarkı Adı Bilinmiyor';
        currentSongDuration.textContent = '00:00 / 00:00';
        progressBar.style.width = '0%';
        renderSongList(); // Ekranı güncelle
        alert('Yeni boş çalma listesi oluşturuldu.');
    }
}

// ------ Müzik Çalar İşlevselliği Sonu ------
