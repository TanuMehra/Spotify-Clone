const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Song = require('./src/models/Song');
const Album = require('./src/models/Album');
const Artist = require('./src/models/Artist');

// Exact display names requested by the user
const parseFilename = (filename) => {
  const nameLower = filename.toLowerCase();

  let artistName = 'Various Artists';
  let title = 'Unknown Track';
  let genre = 'Chill';
  let coverImage = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300';

  if (nameLower.includes('turbo-pulse') || nameLower.includes('white_records')) {
    title = 'Turbo Pulse';
    artistName = 'White Records';
    genre = 'Phonk House';
    coverImage = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300';
  } else if (nameLower.includes('festive') || nameLower.includes('dragon')) {
    title = 'Festive Beats';
    artistName = 'Dragon Studio';
    genre = 'Festive';
    coverImage = 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300';
  } else if (nameLower.includes('trending') || nameLower.includes('bombin')) {
    title = 'Trending Reels';
    artistName = 'Bombin Sound';
    genre = 'Instagram Reels';
    coverImage = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300';
  } else if (nameLower.includes('classical') || nameLower.includes('soulful')) {
    title = 'Classical Dreams';
    artistName = 'Soulful Jam Tracks';
    genre = 'Classical';
    coverImage = 'https://images.unsplash.com/photo-1446057032654-9d8885db76c6?w=300';
  } else if (nameLower.includes('neon-symphony') && nameLower.includes('(3)')) {
    title = 'Neon Symphony (Alt)';
    artistName = 'Pink Sound';
    genre = 'Phonk House';
    coverImage = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300';
  } else if (nameLower.includes('neon-symphony')) {
    title = 'Neon Symphony';
    artistName = 'Pink Sound';
    genre = 'Phonk House';
    coverImage = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300';
  } else if (nameLower.includes('tum_hi_ho')) {
    title = 'Tum Hi Ho';
    artistName = 'Arijit Singh';
    genre = 'Bollywood';
    coverImage = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300';
  } else if (nameLower.includes('vlog') || nameLower.includes('openmind')) {
    title = 'Vlog Soft Background';
    artistName = 'Open Mind Audio';
    genre = 'Vlog';
    coverImage = 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300';
  }

  const durations = ['3:45', '4:12', '2:50', '3:10', '4:32', '3:05'];
  const duration = durations[Math.floor(Math.random() * durations.length)];

  return {
    title,
    artistName,
    genre,
    audioUrl: `/${filename}`,
    coverImage,
    duration
  };
};

const seedData = async () => {
  try {
    await mongoose.connect("mongodb+srv://tanumehra:tanu1234@cluster0.twl3h9x.mongodb.net/?appName=Cluster0");
    console.log("Connected to MongoDB for custom seeding...");

    // 1. Clear existing tracks, albums, and artists
    await Song.deleteMany({});
    await Album.deleteMany({});
    await Artist.deleteMany({});
    console.log("Cleared old database catalog.");

    // 2. Scan the frontend public folder for MP3 files
    const publicDir = path.join(__dirname, '../frontend/public');
    if (!fs.existsSync(publicDir)) {
      throw new Error(`Public folder does not exist at path: ${publicDir}`);
    }

    const files = fs.readdirSync(publicDir);
    const mp3Files = files.filter(f => f.endsWith('.mp3'));
    console.log(`Found ${mp3Files.length} MP3 files in public folder.`);

    if (mp3Files.length === 0) {
      console.warn("No MP3 files found in public folder to seed.");
      return;
    }

    // 3. Create the core "Popular Songs" Album (representing the primary playlist)
    const primaryArtistDoc = await Artist.create({
      name: "Spotify",
      bio: "The official Spotify editor playlist curator.",
      profileImage: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300",
      profileImagePublicId: "local_spotify_editor_id",
      monthlyListeners: 84930211,
    });

    const popularSongsPlaylist = await Album.create({
      title: "Popular Songs",
      coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
      coverImagePublicId: "local_popular_songs_cover_id",
      artist: primaryArtistDoc._id,
      songs: [],
      releaseDate: new Date(),
      bgColor: '#2a4365' // Spotify deep blue background glow
    });
    console.log(`[Playlist] Created Album: "${popularSongsPlaylist.title}"`);

    // 4. Create other standard display albums for homepage charts
    const albumsRaw = [
      { title: "Top 50 Global", coverImage: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300", bgColor: '#22543d' },
      { title: "Top 50 India", coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300", bgColor: '#742a2a' },
      { title: "Trending India", coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300", bgColor: '#44337a' },
      { title: "Trending Global", coverImage: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300", bgColor: '#234e52' },
      { title: "Mega Hits", coverImage: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300", bgColor: '#744210' }
    ];

    const extraAlbums = [];
    for (const alb of albumsRaw) {
      const extraAlbDoc = await Album.create({
        title: alb.title,
        coverImage: alb.coverImage,
        coverImagePublicId: "local_extra_album_cover_id",
        artist: primaryArtistDoc._id,
        songs: [],
        releaseDate: new Date(),
        bgColor: alb.bgColor
      });
      extraAlbums.push(extraAlbDoc);
      console.log(`[Album] Created additional chart: "${extraAlbDoc.title}"`);
    }

    // 5. Seed Songs dynamically and associate them to "Popular Songs" AND additional charts
    for (let index = 0; index < mp3Files.length; index++) {
      const filename = mp3Files[index];
      const metadata = parseFilename(filename);

      // Create/Fetch specific Artist profile
      let artistDoc = await Artist.findOne({ name: metadata.artistName });
      if (!artistDoc) {
        artistDoc = await Artist.create({
          name: metadata.artistName,
          bio: `A featured profile for ${metadata.artistName}.`,
          profileImage: metadata.coverImage,
          profileImagePublicId: "local_artist_img_id",
          monthlyListeners: Math.floor(Math.random() * 2000000) + 10000,
        });
        console.log(`[Artist] Created: "${artistDoc.name}"`);
      }

      // Create Song referencing Artist & Album (assigned to "Popular Songs" primary)
      const songDoc = await Song.create({
        title: metadata.title,
        artist: artistDoc._id,
        album: popularSongsPlaylist._id, // Map directly to Popular Songs playlist
        genre: metadata.genre,
        duration: metadata.duration,
        imageUrl: metadata.coverImage,
        audioUrl: metadata.audioUrl,
        audioPublicId: "local_audio_track_id",
        imagePublicId: "local_cover_thumbnail_id",
      });

      // Link song inside "Popular Songs" playlist array
      await Album.findByIdAndUpdate(popularSongsPlaylist._id, { $push: { songs: songDoc._id } });
      console.log(`[Song] Linked to "Popular Songs": "${songDoc.title}"`);

      // Additionally link to one of the homepage chart categories for layout density
      const assignedChartAlbum = extraAlbums[index % extraAlbums.length];
      await Album.findByIdAndUpdate(assignedChartAlbum._id, { $push: { songs: songDoc._id } });
      console.log(`[Song] Linked to Homepage Chart "${assignedChartAlbum.title}": "${songDoc.title}"`);
    }

    console.log("Database catalog and 'Popular Songs' playlist seeded successfully!");
  } catch (err) {
    console.error("Dynamic seeding failed:", err);
  } finally {
    mongoose.disconnect();
  }
};

seedData();
