var playlist = [];
var currentSongIndex = 0;
var token = "";
var playlistLength = 50;
var serverURL = "";

const getRandomPlaylist = async () => {
  serverURL = document.getElementById("server").value;
  token = document.getElementById("token").value;
  const connectionStatus = document.getElementById("connectionStatus");
  const endpoint = `${serverURL}/randomPlaylist?length=${playlistLength}`;
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    });
    if (response.ok) {
      const data = await response.json();
      connectionStatus.className = "connected";
      playlist = data["uuids"];
      if (playlist.length < playlistLength) {
        playlistLength = playlist.length;
      }
      console.log(playlist);
      loadAudio();
    } else {
      console.error("Error response:", errorText);
    }
  } catch (error) {
    console.error("Connection error:", error);
  }
};

document
  .getElementById("randomPlaylistButton")
  .addEventListener("click", getRandomPlaylist);

const loadSongDetails = async () => {
  const endpoint = `${serverURL}/songDetails?UUID=${playlist[currentSongIndex]}`;
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data);
      document.getElementById("songName").textContent = data["name"];
      document.getElementById("artistName").textContent =
        data["artists"] || "Unknown";
      document.getElementById("albumName").textContent = data["album"] || "-";
    } else {
      console.error("Error response:", errorText);
    }
  } catch (error) {
    console.error("Connection error:", error);
  }
};

const loadAudio = (playAfterLoad = false) => {
  var audio = document.querySelector("#player");

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
    if (playAfterLoad) {
      audio.play();
    }
    loadSongDetails();

    const albumArtSrc = `${serverURL}/Music/${playlist[currentSongIndex]}/${playlist[currentSongIndex]}.png`;
    const albumArtOptions = {
      headers: {
        Authorization: token,
      },
    };

    fetch(albumArtSrc, albumArtOptions)
      .then((res) => res.blob())
      .then((blob) => {
        document.getElementById("albumArt").src = URL.createObjectURL(blob);
      })
      .catch(() => {
        document.getElementById("albumArt").src = null;
      });
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

document
  .getElementById("previousSong")
  .addEventListener("click", () => changeSong(true));
document
  .getElementById("nextSong")
  .addEventListener("click", () => changeSong(false));
