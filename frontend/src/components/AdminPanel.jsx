import { useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { PlayerContext } from '../context/playerContext';

const AdminPanel = () => {
  const { showToast } = useContext(PlayerContext);
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  // 1. Artist form
  const [artistName, setArtistName] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [artistImage, setArtistImage] = useState(null);

  // 2. Album form
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumArtistId, setAlbumArtistId] = useState('');
  const [albumCoverImage, setAlbumCoverImage] = useState(null);

  // 3. Song form
  const [songTitle, setSongTitle] = useState('');
  const [songArtistId, setSongArtistId] = useState('');
  const [songAlbumId, setSongAlbumId] = useState('');
  const [songGenre, setSongGenre] = useState('');
  const [songDuration, setSongDuration] = useState('');
  const [songAudioFile, setSongAudioFile] = useState(null);
  const [songCoverImage, setSongCoverImage] = useState(null);

  // Load analytics, artists, and albums
  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, artistsData, albumsData] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getArtists(),
        api.getAlbums()
      ]);
      setAnalytics(analyticsData.data);
      setArtists(artistsData.data || []);
      setAlbums(albumsData.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast('Error loading panel data. Verify admin role status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit handlers
  const handleCreateArtist = async (e) => {
    e.preventDefault();
    if (!artistName || !artistImage) {
      showToast('Please provide artist name and profile image.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', artistName);
    formData.append('bio', artistBio);
    formData.append('image', artistImage);

    try {
      setLoading(true);
      await api.createArtist(formData);
      showToast(`Artist "${artistName}" created successfully!`, 'success');
      setArtistName('');
      setArtistBio('');
      setArtistImage(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create artist profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!albumTitle || !albumArtistId || !albumCoverImage) {
      showToast('Please provide album title, artist, and cover art.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', albumTitle);
    formData.append('artistId', albumArtistId);
    formData.append('image', albumCoverImage);

    try {
      setLoading(true);
      await api.createAlbum(formData);
      showToast(`Album "${albumTitle}" created successfully!`, 'success');
      setAlbumTitle('');
      setAlbumArtistId('');
      setAlbumCoverImage(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create album.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSong = async (e) => {
    e.preventDefault();
    if (!songTitle || !songArtistId || !songDuration || !songAudioFile || !songCoverImage) {
      showToast('Please fill in title, artist, duration, audio track, and cover thumbnail.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', songTitle);
    formData.append('artistId', songArtistId);
    if (songAlbumId) formData.append('albumId', songAlbumId);
    formData.append('genre', songGenre || 'Pop');
    formData.append('duration', songDuration);
    formData.append('audio', songAudioFile);
    formData.append('image', songCoverImage);

    try {
      setLoading(true);
      await api.uploadSong(formData);
      showToast(`Song "${songTitle}" uploaded and compiled successfully!`, 'success');
      setSongTitle('');
      setSongArtistId('');
      setSongAlbumId('');
      setSongGenre('');
      setSongDuration('');
      setSongAudioFile(null);
      setSongCoverImage(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload song to database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] text-white p-6 rounded-lg min-h-screen">
      <div className="flex justify-between items-center mb-8 border-b border-[#292929] pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">System Control Panel</h1>
          <p className="text-[#a7a7a7] text-sm mt-1">Upload and manage Songs, Albums, and Artists directly to Cloudinary and MongoDB</p>
        </div>
        <button
          onClick={loadData}
          className="bg-white/10 hover:bg-white/20 text-white border border-[#292929] px-4 py-2 rounded-full font-bold text-xs transition-colors"
        >
          🔄 Refresh Stats
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex gap-4 mb-8">
        {[
          { id: 'analytics', label: '📊 Dashboard Analytics' },
          { id: 'song', label: '🎵 Upload Song' },
          { id: 'album', label: '💿 Create Album' },
          { id: 'artist', label: '👤 Create Artist Profile' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === tab.id ? 'bg-[#1db954] text-black shadow-lg shadow-[#1db954]/20' : 'bg-[#242424] hover:bg-[#2e2e2e] text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-[#181818] p-6 rounded-xl border border-[#282828] shadow-lg">
        {loading && (
          <div className="flex items-center gap-3 text-[#1db954] mb-4 text-sm font-semibold">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-[#1db954]"></div>
            Uploading files and writing documents to cloud. Please stand by...
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fadeIn">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: '👥 Registered Listeners', count: analytics.counts.users },
                    { label: '🎵 Stored Tracks', count: analytics.counts.songs },
                    { label: '💿 Managed Albums', count: analytics.counts.albums },
                    { label: '🎙️ Active Artists', count: analytics.counts.artists },
                    { label: '📂 User Playlists', count: analytics.counts.playlists },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-black/40 p-5 rounded-lg border border-[#292929] flex flex-col justify-between">
                      <p className="text-[#a7a7a7] text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                      <h2 className="text-4xl font-black mt-3 text-[#1db954]">{stat.count}</h2>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-4">🏆 Most Played Tracks</h3>
                  <div className="space-y-3">
                    {analytics.mostPlayed?.map((song, index) => (
                      <div key={song._id} className="bg-black/30 p-3.5 rounded-lg flex justify-between items-center border border-[#292929]/50">
                        <div className="flex items-center gap-3">
                          <span className="text-[#a7a7a7] text-sm font-black w-5">{index + 1}</span>
                          <img className="w-10 h-10 rounded shadow-md" src={song.imageUrl} alt={song.title} />
                          <div>
                            <p className="font-bold text-sm text-white">{song.title}</p>
                            <p className="text-[#a7a7a7] text-xs mt-0.5">{song.artist?.name || 'Various Artists'} • {song.album?.title || 'Single'}</p>
                          </div>
                        </div>
                        <span className="bg-[#1db954]/10 text-[#1db954] text-xs font-extrabold px-3 py-1.5 rounded-full border border-[#1db954]/20">
                          🔥 {song.totalPlays} plays
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[#a7a7a7] text-sm text-center">Loading analytics counters...</p>
            )}
          </div>
        )}

        {activeTab === 'artist' && (
          <form onSubmit={handleCreateArtist} className="space-y-5 animate-fadeIn max-w-lg">
            <h3 className="text-xl font-bold border-b border-[#292929] pb-2 mb-4">Create New Artist Profile</h3>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Artist Name</label>
              <input
                type="text"
                placeholder="Name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="w-full bg-black/40 border border-[#404040] hover:border-white focus:border-[#1db954] text-white rounded p-3 outline-none text-sm transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Biography</label>
              <textarea
                placeholder="Write a bio"
                value={artistBio}
                onChange={(e) => setArtistBio(e.target.value)}
                rows={4}
                className="w-full bg-black/40 border border-[#404040] hover:border-white focus:border-[#1db954] text-white rounded p-3 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Profile Image File</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArtistImage(e.target.files[0])}
                className="w-full text-[#a7a7a7] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#1db954] file:text-black hover:file:bg-[#1ed760] file:cursor-pointer"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold px-8 py-3 rounded-full text-xs transition-transform active:scale-95 shadow-md shadow-[#1db954]/10 cursor-pointer"
            >
              Upload Artist Profile
            </button>
          </form>
        )}

        {activeTab === 'album' && (
          <form onSubmit={handleCreateAlbum} className="space-y-5 animate-fadeIn max-w-lg">
            <h3 className="text-xl font-bold border-b border-[#292929] pb-2 mb-4">Create New Album</h3>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Album Title</label>
              <input
                type="text"
                placeholder="Title"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                className="w-full bg-black/40 border border-[#404040] hover:border-white focus:border-[#1db954] text-white rounded p-3 outline-none text-sm transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Select Artist</label>
              <select
                value={albumArtistId}
                onChange={(e) => setAlbumArtistId(e.target.value)}
                className="w-full bg-black/40 border border-[#404040] hover:border-white focus:border-[#1db954] text-white rounded p-3 outline-none text-sm transition-all cursor-pointer"
                required
              >
                <option value="">-- Choose Artist Profile --</option>
                {artists.map((artist) => (
                  <option key={artist._id} value={artist._id}>{artist.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Cover Artwork File</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAlbumCoverImage(e.target.files[0])}
                className="w-full text-[#a7a7a7] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#1db954] file:text-black hover:file:bg-[#1ed760] file:cursor-pointer"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold px-8 py-3 rounded-full text-xs transition-transform active:scale-95 shadow-md shadow-[#1db954]/10 cursor-pointer"
            >
              Upload Album Artwork
            </button>
          </form>
        )}

        {activeTab === 'song' && (
          <form onSubmit={handleUploadSong} className="space-y-5 animate-fadeIn max-w-lg">
            <h3 className="text-xl font-bold border-b border-[#292929] pb-2 mb-4">Upload New Song Track</h3>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Song Title</label>
              <input
                type="text"
                placeholder="Title"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                className="w-full bg-black/40 border border-[#404040] hover:border-white focus:border-[#1db954] text-white rounded p-3 outline-none text-sm transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Artist</label>
                <select
                  value={songArtistId}
                  onChange={(e) => setSongArtistId(e.target.value)}
                  className="w-full bg-black/40 border border-[#404040] hover:border-white focus:border-[#1db954] text-white rounded p-3 outline-none text-sm transition-all cursor-pointer"
                  required
                >
                  <option value="">-- Choose Artist --</option>
                  {artists.map((artist) => (
                    <option key={artist._id} value={artist._id}>{artist.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Album (Optional)</label>
                <select
                  value={songAlbumId}
                  onChange={(e) => setSongAlbumId(e.target.value)}
                  className="w-full bg-black/40 border border-[#404040] hover:border-white focus:border-[#1db954] text-white rounded p-3 outline-none text-sm transition-all cursor-pointer"
                >
                  <option value="">-- Single / None --</option>
                  {albums.map((album) => (
                    <option key={album._id} value={album._id}>{album.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Genre</label>
                <input
                  type="text"
                  placeholder="Pop, Rock, Chill, etc."
                  value={songGenre}
                  onChange={(e) => setSongGenre(e.target.value)}
                  className="w-full bg-black/40 border border-[#404040] hover:border-white focus:border-[#1db954] text-white rounded p-3 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Duration (M:SS)</label>
                <input
                  type="text"
                  placeholder="3:45"
                  value={songDuration}
                  onChange={(e) => setSongDuration(e.target.value)}
                  className="w-full bg-black/40 border border-[#404040] hover:border-white focus:border-[#1db954] text-white rounded p-3 outline-none text-sm transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Audio Track File (.mp3, .wav)</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setSongAudioFile(e.target.files[0])}
                className="w-full text-[#a7a7a7] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#1db954] file:text-black hover:file:bg-[#1ed760] file:cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Cover Thumbnail File</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSongCoverImage(e.target.files[0])}
                className="w-full text-[#a7a7a7] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#1db954] file:text-black hover:file:bg-[#1ed760] file:cursor-pointer"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold px-8 py-3 rounded-full text-xs transition-transform active:scale-95 shadow-md shadow-[#1db954]/10 cursor-pointer"
            >
              Upload Song to Cloudinary
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
