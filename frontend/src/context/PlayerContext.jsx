import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../services/api";
import { songsData as staticSongs, albumsData as staticAlbums } from "../assets/assets";
import { PlayerContext } from "./playerContext";

const PlayerProvider = (props) => {
  const audioRef = useRef();
  const seekBg = useRef();
  const seekBar = useRef();

  // Dynamic state stores (initialized to static fallback lists)
  const [songsData, setSongsData] = useState(staticSongs);
  const [albumsData, setAlbumsData] = useState(staticAlbums);
  
  // Audio playback tracking states
  const [track, setTrack] = useState(staticSongs[0]);
  const [playStatus, setPlayStatus] = useState(false);
  const [time, setTime] = useState({
    currentTime: { second: 0, minute: 0 },
    totalTime: { second: 0, minute: 0 }
  });

  // Authentication & Session states
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Real-time communication and custom notification states
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  // --- CUSTOM TOAST SYSTEM ---
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- DYNAMIC DATABASE HYDRATION ---
  const hydrateMusicCatalog = async () => {
    try {
      const [songsRes, albumsRes] = await Promise.all([
        api.getSongs(),
        api.getAlbums()
      ]);

      let formattedSongs = [];
      let formattedAlbums = [];

      // 1. Parse and format Songs from MongoDB
      if (songsRes.data && songsRes.data.length > 0) {
        formattedSongs = songsRes.data.map((song) => ({
          ...song,
          id: song._id, // Bridge backward-compatibility key
          name: song.title,
          image: song.imageUrl,
          file: song.audioUrl,
          desc: song.genre || 'Chill',
          duration: song.duration
        }));
        setSongsData(formattedSongs);
      }

      // 2. Parse and format Albums from MongoDB
      if (albumsRes.data && albumsRes.data.length > 0) {
        formattedAlbums = albumsRes.data.map((album) => ({
          ...album,
          id: album._id, // Bridge backward-compatibility key
          name: album.title,
          image: album.coverImage,
          desc: album.artist?.name ? `By ${album.artist.name}` : 'A beautiful MERN album collection',
          bgColor: album.bgColor || '#1db954',
          songs: album.songs?.map((song) => ({
            ...song,
            id: song._id,
            name: song.title,
            image: song.imageUrl,
            file: song.audioUrl,
            desc: song.genre || 'Chill',
            duration: song.duration
          })) || []
        }));
        setAlbumsData(formattedAlbums);
      }

      // Update active track to first loaded DB song if player is empty
      if (formattedSongs.length > 0) {
        setTrack(formattedSongs[0]);
      }
    } catch (err) {
      console.warn('Hydration warning: Fetching from DB failed. Falling back to static assets.', err);
    }
  };

  // --- OTP SESSION MANAGEMENT ---
  const sendOTP = async (emailOrPhone, flow = 'login') => {
    try {
      const data = await api.sendOTP(emailOrPhone, flow);
      if (data.devOtp) {
        console.log(`[DEV MODE] Generated OTP: ${data.devOtp}`);
        showToast(`[DEV MODE] OTP: ${data.devOtp}`, 'success');
      } else {
        showToast('OTP verification code sent successfully!', 'success');
      }
      return data;
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send OTP.', 'error');
      throw err;
    }
  };

  const verifyOTP = async (emailOrPhone, otp) => {
    try {
      const data = await api.verifyOTP(emailOrPhone, otp);
      setUser(data.data);
      showToast('Authentication complete. Welcome!', 'success');
      await hydrateMusicCatalog();
      return data.data;
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid verification code.', 'error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      setSongsData(staticSongs);
      setAlbumsData(staticAlbums);
      setTrack(staticSongs[0]);
      setPlayStatus(false);
      showToast('Logged out of session.', 'success');
    } catch (err) {
      showToast('Logout completed.', 'success');
    }
  };

  // Initial Auth validation
  useEffect(() => {
    const initAuthSession = async () => {
      const savedToken = localStorage.getItem('spotify_token');
      if (savedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile.data);
          await hydrateMusicCatalog();
        } catch (err) {
          console.warn('Saved token is invalid or expired. Removing.', err);
          localStorage.removeItem('spotify_token');
        }
      }
      setLoadingAuth(false);
    };
    initAuthSession();
  }, []);

  // --- SOCKET.IO REAL-TIME SYSTEM ---
  useEffect(() => {
    if (user) {
      const socketConn = io('http://localhost:5000');
      setSocket(socketConn);

      socketConn.on('connect', () => {
        console.log(`🔌 Real-time WebSocket established: ${socketConn.id}`);
        socketConn.emit('join', user._id);
      });

      socketConn.on('notification', (payload) => {
        // STATS_UPDATE is a silent refresh signal — don't show toast
        if (payload.type === 'STATS_UPDATE') {
          setProfileRefreshKey((k) => k + 1);
          return;
        }
        if (payload.message) showToast(`🔔 ${payload.message}`, 'info');
      });

      socketConn.on('play_count_update', (payload) => {
        setSongsData((prev) =>
          prev.map((song) =>
            song._id === payload.songId ? { ...song, totalPlays: payload.totalPlays } : song
          )
        );
      });

      return () => {
        socketConn.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [user]);

  // Emit play updates and increment backend plays count whenever active track changes
  useEffect(() => {
    if (track && user) {
      // 1. Broadcast song playing event
      if (socket) {
        socket.emit('song_playing', {
          userId: user._id,
          username: user.username,
          songId: track._id || track.id,
          title: track.name,
          artist: track.artist?.name || 'Spotify Artist',
          imageUrl: track.image,
        });
      }

      // 2. Increment play counter inside database in background
      if (track._id) {
        api.playSong(track._id).catch((err) => {
          console.warn('Failed to increment track play count:', err);
        });

        // 3. Record in user's Recently Played history (also accumulates listening time)
        api.recordPlayback(track._id).catch((err) => {
          console.warn('Failed to record playback history:', err);
        });
      }
    }
  }, [track, socket, user]);

  // --- AUDIO LOGIC ---
  const play = () => {
    audioRef.current?.play();
    setPlayStatus(true);
  };

  const pause = () => {
    audioRef.current?.pause();
    setPlayStatus(false);
  };

  const playWithId = (id) => {
    const selectedSong = songsData.find(
      (item) => String(item.id) === String(id) || String(item._id) === String(id)
    );
    if (selectedSong) {
      setTrack(selectedSong);
      setPlayStatus(true);
    }
  };

  const previous = () => {
    const currentIndex = songsData.findIndex(
      (item) => String(item.id) === String(track.id) || String(item._id) === String(track._id)
    );
    if (currentIndex > 0) {
      setTrack(songsData[currentIndex - 1]);
      setPlayStatus(true);
    }
  };

  const next = () => {
    const currentIndex = songsData.findIndex(
      (item) => String(item.id) === String(track.id) || String(item._id) === String(track._id)
    );
    if (currentIndex >= 0 && currentIndex < songsData.length - 1) {
      setTrack(songsData[currentIndex + 1]);
      setPlayStatus(true);
    }
  };

  const seekSong = async (e) => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
      audioRef.current.currentTime =
        (e.nativeEvent.offsetX / seekBg.current.offsetWidth) * audioRef.current.duration;
    }
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!audioRef.current) return;

      audioRef.current.ontimeupdate = () => {
        if (!audioRef.current) return;

        const currentTime = audioRef.current.currentTime || 0;
        const duration = Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0;
        const progress = duration ? Math.floor((currentTime / duration) * 100) : 0;

        if (seekBar.current) {
          seekBar.current.style.width = `${progress}%`;
        }

        setTime({
          currentTime: {
            second: Math.floor(currentTime % 60),
            minute: Math.floor(currentTime / 60),
          },
          totalTime: {
            second: Math.floor(duration % 60),
            minute: Math.floor(duration / 60),
          },
        });
      };

      audioRef.current.onended = () => {
        next();
      };
    }, 1000);

    return () => clearTimeout(timerId);
  }, [audioRef, songsData, track]);

  useEffect(() => {
    if (playStatus) {
      audioRef.current?.play();
    }
  }, [track, playStatus]);

  const contextValue = {
    audioRef,
    seekBg,
    seekBar,
    track,
    setTrack,
    playStatus,
    setPlayStatus,
    time,
    setTime,
    play,
    pause,
    playWithId,
    palyWithId: playWithId, // Backward-compat typo hook
    previous,
    next,
    seekSong,
    songsData,
    albumsData,
    profileRefreshKey,
    user,
    setUser,
    loadingAuth,
    sendOTP,
    verifyOTP,
    logout,
    showToast,
    toast
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {props.children}
    </PlayerContext.Provider>
  );
};

export default PlayerProvider;
