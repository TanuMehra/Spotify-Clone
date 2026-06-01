import { useContext } from "react";
import Navbar from "./Navbar";
import { useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import { PlayerContext } from "../context/playerContext";

const DisplayAlbum = () => {
  const { id } = useParams();
  const { songsData, albumsData, playWithId } = useContext(PlayerContext);

  // Backcompat search for album by string, integer, or mongodb ID
  const albumData = albumsData.find(
    (item) => String(item.id) === String(id) || String(item._id) === String(id)
  ) || albumsData[0];

  // Load actual album's children tracks if populated, otherwise fallback to songsData
  const albumSongs = albumData?.songs && albumData.songs.length > 0 ? albumData.songs : songsData;

  if (!albumData) {
    return (
      <div className="p-6 text-[#a7a7a7] text-sm animate-pulse">
        Album details are loading or not found...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mt-10 flex gap-8 flex-col md:flex-row md:items-end">
        <img className="w-48 rounded shadow-2xl" src={albumData.image} alt={albumData.name} />
        <div className="flex flex-col">
          <p className="text-xs uppercase font-extrabold tracking-wider text-[#a7a7a7]">Album / Playlist</p>
          <h2 className="text-5xl font-black mb-4 md:text-7xl tracking-tight mt-2">{albumData.name}</h2>
          <h4 className="text-sm font-semibold text-[#a7a7a7]">{albumData.desc}</h4>
          <p className="mt-2 text-sm flex items-center gap-1.5 flex-wrap">
            <img className="inline-block w-5" src={assets.spotify_logo} alt="Spotify Logo" />
            <b className="text-white">Spotify</b>
            <span className="text-[#a7a7a7]">&bull;</span>
            <span className="text-[#a7a7a7]">1,323,154 likes</span>
            <span className="text-[#a7a7a7]">&bull;</span>
            <b className="text-white">{albumSongs.length} songs,</b>
            <span className="text-[#a7a7a7]">about 2 hr 30 min</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 mt-10 mb-4 pl-2 text-[#a7a7a7] text-xs font-bold uppercase tracking-wider">
        <p><span className="mr-4">#</span>Title</p>
        <p>Album</p>
        <p className="hidden sm:block">Date Added</p>
        <img className="m-auto w-4" src={assets.clock_icon} alt="time" />
      </div>
      <hr className="border-[#292929]" />
      <div className="pb-8">
        {albumSongs.map((item, index) => (
          <div
            onClick={() => playWithId(item.id || item._id)}
            key={item.id || item._id || index}
            className="grid grid-cols-3 sm:grid-cols-4 gap-2 items-center text-[#a7a7a7] hover:bg-white/10 mt-2 p-2 rounded cursor-pointer group transition-colors"
          >
            <p className="text-white text-sm font-semibold flex items-center gap-4">
              <span className="text-[#a7a7a7] font-bold w-4 text-xs group-hover:text-transparent group-hover:after:content-['▶'] group-hover:after:-ml-1 group-hover:after:text-white transition-all">{index + 1}</span>
              <img src={item.image} alt={item.name} className="w-10 h-10 rounded shadow" />
              <span className="truncate">{item.name}</span>
            </p>
            <p className="text-sm font-semibold truncate">{albumData.name}</p>
            <p className="text-sm font-semibold hidden sm:block">5 days ago</p>
            <p className="text-sm font-semibold text-center">{item.duration}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default DisplayAlbum;
