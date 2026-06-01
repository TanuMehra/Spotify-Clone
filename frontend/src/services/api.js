import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for cookies like refresh-token
});

// Automatically inject Authorization Header if token exists in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('spotify_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Reusable API service actions
export const api = {
  // --- OTP AUTH APIs ---
  sendOTP: async (email, flow = 'login') => {
    const cleanEmail = email.trim().toLowerCase();
    const response = await apiClient.post('/auth/send-otp', { emailOrPhone: cleanEmail, flow });
    return response.data;
  },

  verifyOTP: async (email, otp) => {
    const cleanEmail = email.trim().toLowerCase();
    const response = await apiClient.post('/auth/verify-otp', { emailOrPhone: cleanEmail, otp });
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('spotify_token', response.data.data.accessToken);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('API logout endpoint failed or already logged out:', err);
    }
    localStorage.removeItem('spotify_token');
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me'); // Hits getMe endpoint under auth routes
    return response.data;
  },

  // --- CONTENT CATALOG APIs ---
  getSongs: async () => {
    const response = await apiClient.get('/songs');
    return response.data;
  },

  getSongById: async (id) => {
    const response = await apiClient.get(`/songs/${id}`);
    return response.data;
  },

  playSong: async (id) => {
    const response = await apiClient.post(`/songs/${id}/play`);
    return response.data;
  },

  getAlbums: async () => {
    const response = await apiClient.get('/albums');
    return response.data;
  },

  getAlbumById: async (id) => {
    const response = await apiClient.get(`/albums/${id}`);
    return response.data;
  },

  getArtists: async () => {
    const response = await apiClient.get('/artists');
    return response.data;
  },

  getArtistById: async (id) => {
    const response = await apiClient.get(`/artists/${id}`);
    return response.data;
  },

  searchSongs: async (query) => {
    const response = await apiClient.get(`/songs/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // --- ADMIN APIs ---
  getDashboardAnalytics: async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  createArtist: async (formData) => {
    const response = await apiClient.post('/artists', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  createAlbum: async (formData) => {
    const response = await apiClient.post('/albums', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadSong: async (formData) => {
    const response = await apiClient.post('/admin/songs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // --- PLAYLIST APIs ---
  createPlaylist: async (formData) => {
    const response = await apiClient.post('/playlists', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUserPlaylists: async () => {
    const response = await apiClient.get('/playlists');
    return response.data;
  },

  addSongToPlaylist: async (playlistId, songId) => {
    const response = await apiClient.post(`/playlists/${playlistId}/song`, { songId });
    return response.data;
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    const response = await apiClient.delete(`/playlists/${playlistId}/song/${songId}`);
    return response.data;
  },

  updatePlaylist: async (playlistId, data) => {
    const response = await apiClient.put(`/playlists/${playlistId}`, data);
    return response.data;
  },

  deletePlaylist: async (playlistId) => {
    const response = await apiClient.delete(`/playlists/${playlistId}`);
    return response.data;
  },

  // --- USER PROFILE & SOCIAL APIs ---
  getUserProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateUserProfile: async (data) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },

  uploadAvatar: async (formData) => {
    const response = await apiClient.post('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getLikedSongs: async () => {
    const response = await apiClient.get('/users/liked-songs');
    return response.data;
  },

  getRecentlyPlayed: async () => {
    const response = await apiClient.get('/users/recently-played');
    return response.data;
  },

  getFollowingArtists: async () => {
    const response = await apiClient.get('/users/following-artists');
    return response.data;
  },

  likeSong: async (songId) => {
    const response = await apiClient.post(`/users/like/${songId}`);
    return response.data;
  },

  unlikeSong: async (songId) => {
    const response = await apiClient.delete(`/users/unlike/${songId}`);
    return response.data;
  },

  followArtist: async (artistId) => {
    const response = await apiClient.post(`/users/follow/${artistId}`);
    return response.data;
  },

  unfollowArtist: async (artistId) => {
    const response = await apiClient.delete(`/users/unfollow/${artistId}`);
    return response.data;
  },

  recordPlayback: async (songId) => {
    const response = await apiClient.post(`/users/recent/${songId}`);
    return response.data;
  }
};

