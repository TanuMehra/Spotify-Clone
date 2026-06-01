import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { PlayerContext } from "../context/playerContext";
import { api } from "../services/api";

// ── helper: extract 2-char initials ──────────────────────────────────────────
const getInitials = (name) => {
  if (!name || name === "Spotify Listener") return "SU";
  return name.split(" ").filter(Boolean).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
};

// ── helper: format minutes ────────────────────────────────────────────────────
const fmtTime = (minutes) => {
  if (!minutes || minutes === 0) return "0 mins";
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} hrs ${Math.floor(minutes % 60)} mins`
    : `${Math.floor(minutes)} mins`;
};

// ── EmptyState component ──────────────────────────────────────────────────────
const EmptyState = ({ icon, message }) => (
  <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-3">
    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-2xl">{icon}</div>
    <span className="text-sm font-medium">{message}</span>
  </div>
);

// ── Main Profile Component ────────────────────────────────────────────────────
const Profile = () => {
  const { playWithId, logout, showToast, user, setUser, songsData, profileRefreshKey } =
    useContext(PlayerContext);
  const fileInputRef = useRef(null);

  // ── Core state ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [followingArtists, setFollowingArtists] = useState([]);

  // ── Edit profile state ──────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", username: "", email: "" });
  const [updating, setUpdating] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // ── Playlist management state ───────────────────────────────────────────────
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [editPlaylistDesc, setEditPlaylistDesc] = useState("");

  // ── Add-song-to-playlist modal state ───────────────────────────────────────
  const [songPickerPlaylistId, setSongPickerPlaylistId] = useState(null);
  const [songPickerSearch, setSongPickerSearch] = useState("");

  // ── Fetch profile stats ─────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.getUserProfile();
      if (res.success) {
        setProfile(res.data);
        setEditForm({
          fullName: res.data.fullName || "",
          username: res.data.username || "",
          email: res.data.email === "N/A" ? "" : res.data.email || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  }, []);

  // ── Fetch tab-specific content ──────────────────────────────────────────────
  const fetchTabContent = useCallback(async (tab) => {
    try {
      if (tab === "recent") {
        const res = await api.getRecentlyPlayed();
        if (res.success) setRecentlyPlayed(res.data || []);
      } else if (tab === "liked") {
        const res = await api.getLikedSongs();
        if (res.success) setLikedSongs(res.data || []);
      } else if (tab === "playlists") {
        const res = await api.getUserPlaylists();
        if (res.success) setPlaylists(res.data || []);
      } else if (tab === "artists") {
        const res = await api.getFollowingArtists();
        if (res.success) setFollowingArtists(res.data || []);
      }
    } catch (err) {
      console.error(`Failed to load ${tab} data`, err);
    }
  }, []);

  // ── Initial mount load ──────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProfile();
      await fetchTabContent("recent");
      setLoading(false);
    };
    init();
  }, [fetchProfile, fetchTabContent]);

  // ── Reactive tab switching ──────────────────────────────────────────────────
  useEffect(() => {
    fetchTabContent(activeTab);
  }, [activeTab, fetchTabContent]);

  // ── Socket-driven profile stat refresh (profileRefreshKey changes on STATS_UPDATE) ──
  useEffect(() => {
    if (profileRefreshKey > 0) {
      fetchProfile();
      if (activeTab === "recent") fetchTabContent("recent");
    }
  }, [profileRefreshKey, fetchProfile, fetchTabContent, activeTab]);

  // ── Play a song and silently record (playerContext auto-records in background) ──
  const handlePlay = (songId) => {
    playWithId(songId);
  };

  // ── Like a song (from Recently Played tab) ──────────────────────────────────
  const handleLike = async (songId) => {
    try {
      const res = await api.likeSong(songId);
      if (res.success) {
        showToast("Added to Liked Songs ❤️", "success");
        if (activeTab === "liked") fetchTabContent("liked");
        fetchProfile();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Could not like song.", "error");
    }
  };

  // ── Unlike a song ──────────────────────────────────────────────────────────
  const handleUnlike = async (songId) => {
    try {
      const res = await api.unlikeSong(songId);
      if (res.success) {
        showToast("Removed from Liked Songs.", "success");
        setLikedSongs((prev) => prev.filter((s) => s._id !== songId));
        fetchProfile();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Could not unlike song.", "error");
    }
  };

  // ── Unfollow artist ────────────────────────────────────────────────────────
  const handleUnfollow = async (artistId) => {
    try {
      const res = await api.unfollowArtist(artistId);
      if (res.success) {
        showToast("Artist unfollowed.", "success");
        setFollowingArtists((prev) => prev.filter((a) => a._id !== artistId));
        fetchProfile();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unfollow.", "error");
    }
  };

  // ── Edit profile form ──────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim() || !editForm.username.trim()) {
      showToast("Full Name and Username cannot be empty.", "error");
      return;
    }
    setUpdating(true);
    try {
      const res = await api.updateUserProfile(editForm);
      if (res.success) {
        showToast("Profile updated successfully!", "success");
        setIsEditing(false);
        if (setUser) setUser(res.data);
        fetchProfile();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save.", "error");
    } finally {
      setUpdating(false);
    }
  };

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const processAvatarUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please upload an image file.", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("Image must be under 5MB.", "error"); return; }
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarUploading(true);
    try {
      const res = await api.uploadAvatar(formData);
      if (res.success) {
        showToast("Avatar updated!", "success");
        setProfile((p) => ({ ...p, avatar: res.avatarUrl }));
        if (setUser && user) setUser((p) => ({ ...p, avatar: res.avatarUrl }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed.", "error");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) processAvatarUpload(e.dataTransfer.files[0]);
  };

  // ── Playlist: Create ───────────────────────────────────────────────────────
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) { showToast("Playlist name is required.", "error"); return; }
    setCreatingPlaylist(true);
    try {
      const formData = new FormData();
      formData.append("name", newPlaylistName.trim());
      formData.append("description", newPlaylistDesc.trim());
      const res = await api.createPlaylist(formData);
      if (res.success) {
        showToast("Playlist created!", "success");
        setNewPlaylistName(""); setNewPlaylistDesc("");
        setShowCreatePlaylist(false);
        fetchTabContent("playlists");
        fetchProfile();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create playlist.", "error");
    } finally {
      setCreatingPlaylist(false);
    }
  };

  // ── Playlist: Save edit ────────────────────────────────────────────────────
  const handleSavePlaylistEdit = async (playlistId) => {
    if (!editPlaylistName.trim()) { showToast("Playlist name required.", "error"); return; }
    try {
      const res = await api.updatePlaylist(playlistId, {
        name: editPlaylistName.trim(),
        description: editPlaylistDesc.trim(),
      });
      if (res.success) {
        showToast("Playlist updated!", "success");
        setEditingPlaylistId(null);
        setPlaylists((prev) =>
          prev.map((p) => p._id === playlistId ? { ...p, name: res.data.name, description: res.data.description } : p)
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update playlist.", "error");
    }
  };

  // ── Playlist: Delete ───────────────────────────────────────────────────────
  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm("Delete this playlist? This cannot be undone.")) return;
    try {
      const res = await api.deletePlaylist(playlistId);
      if (res.success) {
        showToast("Playlist deleted.", "success");
        setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
        fetchProfile();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete.", "error");
    }
  };

  // ── Playlist: Remove song ──────────────────────────────────────────────────
  const handleRemoveSongFromPlaylist = async (playlistId, songId) => {
    try {
      const res = await api.removeSongFromPlaylist(playlistId, songId);
      if (res.success) {
        showToast("Song removed from playlist.", "success");
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlistId ? { ...p, songs: p.songs.filter((s) => s._id !== songId) } : p
          )
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove song.", "error");
    }
  };

  // ── Playlist: Add song (from song picker) ─────────────────────────────────
  const handleAddSongToPlaylist = async (songId) => {
    if (!songPickerPlaylistId) return;
    try {
      const res = await api.addSongToPlaylist(songPickerPlaylistId, songId);
      if (res.success) {
        showToast("Song added to playlist!", "success");
        setPlaylists((prev) =>
          prev.map((p) => p._id === songPickerPlaylistId ? res.data : p)
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add song.", "error");
    }
  };

  // ── Filtered songs for picker ─────────────────────────────────────────────
  const filteredSongs = (songsData || []).filter((s) => {
    if (!songPickerSearch.trim()) return true;
    const q = songPickerSearch.toLowerCase();
    return (s.name || s.title || "").toLowerCase().includes(q) ||
      (s.artist?.name || "").toLowerCase().includes(q);
  }).filter((s) => s._id); // only DB songs

  // ── Song already in target playlist check ─────────────────────────────────
  const targetPlaylist = playlists.find((p) => p._id === songPickerPlaylistId);
  const existingIds = new Set((targetPlaylist?.songs || []).map((s) => s._id?.toString()));

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DB954]"></div>
        <p className="text-gray-400 font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-white/5 border border-white/10 rounded-2xl m-4">
        <svg className="w-16 h-16 text-red-500 mb-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        <h2 className="text-xl font-bold mb-2">Profile Unavailable</h2>
        <p className="text-gray-400 max-w-sm mb-6">Make sure your backend server is running and you are logged in.</p>
        <button onClick={logout} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-transform">
          Logout
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full text-white pb-10">

      {/* ── 1. Profile Header ────────────────────────────────────────────── */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-b from-[#181818] to-[#121212] border border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-8 mb-8 backdrop-blur-md">

        {/* Avatar upload zone */}
        <div
          onDragEnter={handleDrag} onDragOver={handleDrag}
          onDragLeave={handleDrag} onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`relative group w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 cursor-pointer flex-shrink-0 transition-all duration-300 shadow-xl ${
            dragActive ? "border-[#1DB954] scale-105" : "border-white/10"
          }`}
        >
          {profile.avatar ? (
            <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full bg-[#282828] flex items-center justify-center text-gray-400 font-bold text-4xl">
              {getInitials(profile.fullName)}
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-xs font-semibold gap-2 text-center p-2">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{avatarUploading ? "Uploading..." : "Click or Drop"}</span>
          </div>
          {avatarUploading && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1DB954]"></div>
            </div>
          )}
        </div>
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && processAvatarUpload(e.target.files[0])} className="hidden" accept="image/*" />

        {/* User info */}
        <div className="flex-grow text-center md:text-left flex flex-col gap-2">
          <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
            <span className="bg-[#1DB954]/20 border border-[#1DB954]/30 text-[#1DB954] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              {profile.role || "User"}
            </span>
            {profile.isVerified && (
              <span className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            {profile.fullName || "Spotify User"}
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            {profile.username ? `@${profile.username}` : ""} {profile.email && profile.email !== "N/A" ? `· ${profile.email}` : ""}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 mt-3 text-xs font-semibold text-gray-400">
            <span>Joined: <strong className="text-white">{profile.joiningDate || "—"}</strong></span>
            <span className="hidden md:inline text-white/20">|</span>
            <span>Listening Time: <strong className="text-[#1DB954]">{profile.stats?.totalListeningTime || "0 mins"}</strong></span>
            <span className="hidden md:inline text-white/20">|</span>
            <span>Following: <strong className="text-white">{profile.stats?.followingCount ?? 0}</strong></span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex-1 md:w-40 py-2.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 font-bold rounded-full transition-all text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isEditing ? "Close Settings" : "Edit Profile"}
          </button>
          <button
            onClick={logout}
            className="flex-1 md:w-40 py-2.5 px-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold rounded-full transition-all text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>

      {/* ── 2. Edit Profile Form ─────────────────────────────────────────── */}
      {isEditing && (
        <form onSubmit={handleUpdate} className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-md shadow-2xl">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-[#1DB954]">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            Edit Profile Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[
              { label: "Full Name", name: "fullName", type: "text", placeholder: "Your full name" },
              { label: "Username", name: "username", type: "text", placeholder: "your_handle" },
              { label: "Email Address", name: "email", type: "email", placeholder: "you@example.com" },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name} className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">{label}</label>
                <input
                  type={type} name={name} value={editForm[name]} placeholder={placeholder}
                  onChange={(e) => setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }))}
                  className="w-full bg-[#282828] border border-white/5 focus:border-[#1DB954] outline-none text-sm p-3 rounded-xl transition-all"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 font-bold rounded-full transition-all text-sm">
              Cancel
            </button>
            <button type="submit" disabled={updating} className="px-6 py-2 bg-[#1DB954] text-white hover:scale-105 active:scale-95 disabled:opacity-50 font-bold rounded-full transition-all text-sm flex items-center gap-2">
              {updating && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* ── 3. Stats Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Song Streams", value: profile.stats?.recentlyPlayedCount ?? 0, color: "orange", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /> },
          { label: "Liked Songs", value: profile.stats?.likedSongsCount ?? 0, color: "pink", fill: true, icon: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /> },
          { label: "Playlists", value: profile.stats?.playlistsCreatedCount ?? 0, color: "green", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
          { label: "Followed Artists", value: profile.stats?.followingArtistsCount ?? 0, color: "purple", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /> },
        ].map(({ label, value, color, fill, icon }) => {
          const colors = {
            orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
            pink: "bg-pink-500/10 border-pink-500/20 text-pink-500",
            green: "bg-[#1DB954]/10 border-[#1DB954]/20 text-[#1DB954]",
            purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
          };
          return (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xl group">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                <span className="text-3xl font-black tracking-tight">{value}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${colors[color]}`}>
                <svg className="w-6 h-6" fill={fill ? "currentColor" : "none"} viewBox="0 0 24 24" stroke={fill ? undefined : "currentColor"}>{icon}</svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Tabs ───────────────────────────────────────────────────────── */}
      <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex border-b border-white/5 bg-white/5 p-2 gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
          {["recent", "liked", "playlists", "artists"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 rounded-xl transition-all capitalize ${
                activeTab === tab ? "bg-[#1DB954] text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "recent" ? "Recently Played" : tab === "liked" ? "Liked Songs" : tab === "playlists" ? "My Playlists" : "Artists"}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── RECENTLY PLAYED ─────────────────────────────────────────── */}
          {activeTab === "recent" && (
            <div className="flex flex-col gap-3">
              {recentlyPlayed.length === 0 ? (
                <EmptyState icon="🎵" message="No songs played yet — start listening to fill this up!" />
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {recentlyPlayed.map((item, idx) => {
                    const song = item.song;
                    if (!song) return null;
                    return (
                      <div
                        key={song._id + idx}
                        className="group flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-200"
                      >
                        <div onClick={() => handlePlay(song._id)} className="flex items-center gap-4 cursor-pointer flex-grow min-w-0">
                          <span className="text-sm font-bold text-gray-500 w-5 flex-shrink-0 group-hover:text-[#1DB954] transition-colors">{idx + 1}</span>
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/5">
                            <img src={song.imageUrl || song.image} alt={song.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-white group-hover:text-[#1DB954] transition-colors line-clamp-1">{song.title || song.name}</h4>
                            <p className="text-xs text-gray-400 line-clamp-1">{song.artist?.name || "Unknown Artist"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                          <button
                            onClick={() => handleLike(song._id)}
                            title="Like"
                            className="text-gray-500 hover:text-[#1DB954] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          <span className="text-[10px] text-gray-500">{new Date(item.playedAt).toLocaleDateString()}</span>
                          <span className="text-xs font-semibold text-gray-400 w-10 text-right">{song.duration || "—"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── LIKED SONGS ─────────────────────────────────────────────── */}
          {activeTab === "liked" && (
            <div className="flex flex-col gap-3">
              {likedSongs.length === 0 ? (
                <EmptyState icon="❤️" message="No liked songs yet — hit the heart on any song!" />
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {likedSongs.map((song, idx) => (
                    <div
                      key={song._id}
                      className="group flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-200"
                    >
                      <div onClick={() => handlePlay(song._id)} className="flex items-center gap-4 cursor-pointer flex-grow min-w-0">
                        <span className="text-sm font-bold text-gray-500 w-5 flex-shrink-0 group-hover:text-[#1DB954] transition-colors">{idx + 1}</span>
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/5">
                          <img src={song.imageUrl || song.image} alt={song.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-white group-hover:text-[#1DB954] transition-colors line-clamp-1">{song.title || song.name}</h4>
                          <p className="text-xs text-gray-400 line-clamp-1">{song.artist?.name || "Unknown Artist"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                        <button onClick={() => handleUnlike(song._id)} title="Unlike" className="text-[#1DB954] hover:text-red-500 transition-colors">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>
                        <span className="text-xs font-semibold text-gray-400 w-10 text-right">{song.duration || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MY PLAYLISTS ─────────────────────────────────────────────── */}
          {activeTab === "playlists" && (
            <div>
              {/* Create playlist button + form */}
              <div className="mb-6">
                {!showCreatePlaylist ? (
                  <button
                    onClick={() => setShowCreatePlaylist(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1DB954] text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all text-sm shadow-lg shadow-[#1DB954]/20"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Playlist
                  </button>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-[#1DB954]">Create New Playlist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="Playlist name *"
                        className="bg-[#282828] border border-white/5 focus:border-[#1DB954] outline-none text-sm p-3 rounded-xl transition-all"
                      />
                      <input
                        value={newPlaylistDesc} onChange={(e) => setNewPlaylistDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="bg-[#282828] border border-white/5 focus:border-[#1DB954] outline-none text-sm p-3 rounded-xl transition-all"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCreatePlaylist} disabled={creatingPlaylist}
                        className="px-5 py-2 bg-[#1DB954] text-white font-bold rounded-full text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {creatingPlaylist && <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-white"></div>}
                        {creatingPlaylist ? "Creating..." : "Create Playlist"}
                      </button>
                      <button onClick={() => { setShowCreatePlaylist(false); setNewPlaylistName(""); setNewPlaylistDesc(""); }} className="px-4 py-2 bg-white/5 border border-white/10 font-bold rounded-full text-sm hover:bg-white/10 transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {playlists.length === 0 ? (
                <EmptyState icon="🎼" message="No playlists yet — create your first one above!" />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {playlists.map((playlist) => (
                    <div key={playlist._id} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/8 hover:border-white/10 transition-all duration-300 shadow-lg">
                      {editingPlaylistId === playlist._id ? (
                        /* ── Inline Edit Form ── */
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              value={editPlaylistName} onChange={(e) => setEditPlaylistName(e.target.value)}
                              placeholder="Playlist name"
                              className="bg-[#282828] border border-[#1DB954]/50 outline-none text-sm p-2.5 rounded-xl"
                            />
                            <input
                              value={editPlaylistDesc} onChange={(e) => setEditPlaylistDesc(e.target.value)}
                              placeholder="Description"
                              className="bg-[#282828] border border-white/5 outline-none text-sm p-2.5 rounded-xl"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSavePlaylistEdit(playlist._id)} className="px-4 py-1.5 bg-[#1DB954] text-white font-bold rounded-full text-xs hover:scale-105 transition-all">Save</button>
                            <button onClick={() => setEditingPlaylistId(null)} className="px-4 py-1.5 bg-white/5 border border-white/10 font-bold rounded-full text-xs hover:bg-white/10 transition-all">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        /* ── Playlist View ── */
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#282828] border border-white/5 flex items-center justify-center">
                                {playlist.coverImage ? (
                                  <img src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover" />
                                ) : (
                                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                  </svg>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-white line-clamp-1">{playlist.name}</h4>
                                <p className="text-xs text-gray-400">{playlist.songs?.length || 0} songs{playlist.description ? ` · ${playlist.description}` : ""}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              <button
                                onClick={() => { setSongPickerPlaylistId(playlist._id); setSongPickerSearch(""); }}
                                title="Add songs"
                                className="text-[#1DB954] hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                              <button
                                onClick={() => { setEditingPlaylistId(playlist._id); setEditPlaylistName(playlist.name); setEditPlaylistDesc(playlist.description || ""); }}
                                title="Edit"
                                className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeletePlaylist(playlist._id)}
                                title="Delete"
                                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Songs inside playlist */}
                          {playlist.songs?.length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-2 pl-2 border-l-2 border-white/5">
                              {playlist.songs.map((song) => (
                                <div key={song._id} className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-all">
                                  <div onClick={() => handlePlay(song._id)} className="flex items-center gap-3 cursor-pointer flex-grow min-w-0">
                                    <img src={song.imageUrl || song.image} alt={song.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#1DB954] transition-colors">{song.title || song.name}</p>
                                      <p className="text-[10px] text-gray-500 line-clamp-1">{song.artist?.name || "—"}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveSongFromPlaylist(playlist._id, song._id)}
                                    title="Remove from playlist"
                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all ml-2 flex-shrink-0"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FOLLOWED ARTISTS ─────────────────────────────────────────── */}
          {activeTab === "artists" && (
            <div>
              {followingArtists.length === 0 ? (
                <EmptyState icon="🎤" message="No artists followed yet — explore to find artists you love!" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {followingArtists.map((artist) => (
                    <div key={artist._id} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group shadow-lg text-center flex flex-col items-center">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3 bg-[#282828] border border-white/5 shadow-md flex-shrink-0">
                        {artist.profileImage || artist.image ? (
                          <img src={artist.profileImage || artist.image} alt={artist.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 text-2xl">
                            {artist.name?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white line-clamp-1 mb-1 group-hover:text-[#1DB954] transition-colors">{artist.name}</h4>
                      <p className="text-[10px] text-gray-400 mb-3">{(artist.followers?.length || 0).toLocaleString()} followers</p>
                      <button
                        onClick={() => handleUnfollow(artist._id)}
                        className="py-1 px-4 border border-white/20 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 font-bold rounded-full transition-all text-xs"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── 5. Song Picker Modal (Add to Playlist) ───────────────────────── */}
      {songPickerPlaylistId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSongPickerPlaylistId(null)}>
          <div className="bg-[#181818] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">Add Songs to Playlist</h3>
              <button onClick={() => setSongPickerPlaylistId(null)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              value={songPickerSearch} onChange={(e) => setSongPickerSearch(e.target.value)}
              placeholder="Search songs..."
              className="w-full bg-[#282828] border border-white/5 focus:border-[#1DB954] outline-none text-sm p-3 rounded-xl mb-4 transition-all"
            />
            <div className="max-h-72 overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-thin">
              {filteredSongs.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">No songs found in the database.</p>
              ) : (
                filteredSongs.map((song) => {
                  const alreadyAdded = existingIds.has(song._id?.toString());
                  return (
                    <div key={song._id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={song.image || song.imageUrl} alt={song.name || song.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white line-clamp-1">{song.name || song.title}</p>
                          <p className="text-[10px] text-gray-500 line-clamp-1">{song.artist?.name || "—"}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => !alreadyAdded && handleAddSongToPlaylist(song._id)}
                        disabled={alreadyAdded}
                        className={`flex-shrink-0 ml-3 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          alreadyAdded
                            ? "bg-white/5 text-gray-500 cursor-default"
                            : "bg-[#1DB954] text-white hover:scale-105 active:scale-95"
                        }`}
                      >
                        {alreadyAdded ? "Added" : "Add"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
