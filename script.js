var playlist = [];
var playlistLength = 50;
var currentSongIndex = 0;
var audio = document.querySelector("#AudioPlayer");

const loadHomeScreen = () => {
  let serverURL = localStorage.getItem("serverURL");
  let token = localStorage.getItem("token");

  if (serverURL !== null && token !== null) {
    getRandomPlaylist(serverURL, token);
  } else {
    promptLogin();
  }
};

const promptLogin = () => {
  localStorage.removeItem("serverURL");
  localStorage.removeItem("token");
  document
    .getElementsByClassName("AuthContainer")[0]
    .classList.remove("Hidden");
};

const getRandomPlaylist = async (serverURL, token) => {
  const endpoint = `${serverURL}/randomPlaylist?length=${playlistLength}`;
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    });
    if (response.ok) {
      localStorage.setItem("serverURL", serverURL);
      localStorage.setItem("token", token);
      document
        .getElementsByClassName("LogOutButton")[0]
        .classList.remove("Hidden");
      const data = await response.json();
      playlist = data["uuids"];
      if (playlist.length < playlistLength) {
        playlistLength = playlist.length;
      }
      console.log(playlist);
      loadAudio(false);
      document
        .getElementsByClassName("AuthContainer")[0]
        .classList.add("Hidden");
    } else {
      console.error("Error response:", response);
      promptLogin();
    }
  } catch (error) {
    console.error("Connection error:", error);
    promptLogin();
  }
};

const getRandomPlaylistWithNewCreds = async () => {
  serverURL = document.getElementById("serverURL").value;
  token = document.getElementById("token").value;
  getRandomPlaylist(serverURL, token);
};

loadHomeScreen();

//---------------------------------------------
// Player logic
//---------------------------------------------

const albumArtImg = document.getElementById("AlbumArt");
const colorThief = new ColorThief();
albumArtImg.addEventListener("load", function () {
  const [r, g, b] = colorThief.getColor(albumArtImg);
  if (albumArtImg.src.endsWith("music_icon.svg")) {
    const randomBgColors = [
      "#1B5625",
      "#206676",
      "#95326a",
      "#a44528",
      "#7a7422",
    ];
    const randomColor =
      randomBgColors[Math.floor(Math.random() * randomBgColors.length)];
    document.documentElement.style.setProperty("--bg-color", randomColor);
  } else document.documentElement.style.setProperty("--bg-color", `rgb(${r}, ${g}, ${b})`);
});

const loadSongDetails = async () => {
  let serverURL = localStorage.getItem("serverURL");
  let token = localStorage.getItem("token");
  const endpoint = `${serverURL}/songDetails?UUID=${playlist[currentSongIndex]}`;
  let song = "";
  let artist = "";
  let album = "";
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    });

    if (response.ok) {
      const data = await response.json();
      song = data["name"];
      artist = data["artists"] || "Unknown";
      album = data["album"] || "-";
      document.getElementById("Song").textContent = song;
      document.getElementById("Artist").textContent = artist;
      document.getElementById("Album").textContent = album;
    } else {
      console.error("Error response:", errorText);
    }
  } catch (error) {
    console.error("Connection error:", error);
  }

  const albumArtSrc = `${serverURL}/Music/${playlist[currentSongIndex]}/${playlist[currentSongIndex]}.png`;
  const albumArtOptions = {
    headers: {
      Authorization: token,
    },
  };

  fetch(albumArtSrc, albumArtOptions)
    .then((res) => res.blob())
    .then((blob) => {
      objectURL = URL.createObjectURL(blob);
      albumArtImg.src = objectURL;
      updateNotificationControls(song, artist, album, objectURL);
    })
    .catch(() => {
      albumArtImg.src = null;
      updateNotificationControls(song, artist, album, null);
    });
};

const loadAudio = (playAfterLoad = false) => {
  let serverURL = localStorage.getItem("serverURL");
  let token = localStorage.getItem("token");

  if (Hls.isSupported()) {
    var config = {
      xhrSetup: function (xhr, url) {
        xhr.setRequestHeader("Authorization", token);
      },
    };

    var hls = new Hls(config);
    hls.loadSource(
      `${serverURL}/Music/${playlist[currentSongIndex]}/${playlist[currentSongIndex]}.m3u8`
    );
    hls.attachMedia(audio);
    navigator.mediaSession.setPositionState(null);
    if (playAfterLoad) {
      audio.play();
    }
    loadSongDetails();
  }
};

const changeSong = (next = true) => {
  currentSongIndex += next ? 1 : -1;
  if (currentSongIndex >= playlistLength) {
    currentSongIndex = 0;
  }
  if (currentSongIndex == -1) {
    currentSongIndex = playlistLength - 1;
  }
  loadAudio(true);
};

const maximizePlayer = () => {
  document
    .getElementsByClassName("PlayerContainer")[0]
    .classList.remove("SmallPlayer");
};

const minimizePlayer = () => {
  document
    .getElementsByClassName("PlayerContainer")[0]
    .classList.add("SmallPlayer");
};
const pauseMusic = () => {
  audio.pause();
};
const playMusic = () => {
  audio.play();
};
audio.onplay = () => {
  const button = document.getElementById("PlayPause");
  button.src = "images/Pause.svg";
  button.onclick = () => {
    pauseMusic();
  };
};

audio.onpause = () => {
  const button = document.getElementById("PlayPause");
  button.src = "images/Play.svg";
  button.onclick = () => {
    playMusic();
  };
};

audio.onloadedmetadata = () => {
  var duration = audio.duration; // Total duration in seconds
  var minutes = Math.floor(duration / 60);
  var seconds = Math.floor(duration % 60)
    .toString()
    .padStart(2, "0");
  document.getElementById("SongDuration").innerText = `${minutes}:${seconds}`;
  document.getElementById("Timeline").max = duration;
};

audio.ontimeupdate = () => {
  var currentTime = audio.currentTime; // Current time in seconds
  var minutes = Math.floor(currentTime / 60);
  var seconds = Math.floor(currentTime % 60)
    .toString()
    .padStart(2, "0");
  document.getElementById("CurrentTime").innerText = `${minutes}:${seconds}`;
  document.getElementById("Timeline").value = currentTime;
  // console.log(audio.buffered, audio.buffered.length);
};

seekToPosition = (targetTime) => {
  console.log(`user wants to seek to ${targetTime}`);
  audio.currentTime = targetTime;
};

audio.onended = () => {
  changeSong(true);
};

//---------------------------------------------
// Notifications control
//---------------------------------------------

const updateNotificationControls = (song, artist, album, albumArtURL) => {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song,
      artist: artist,
      album: album,
      artwork: [
        {
          src: albumArtURL,
          type: "image/png",
        },
      ],
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      changeSong(false);
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      changeSong(true);
    });
  }
};
