import { useEffect, useRef, useContext } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import DisplayHome from "./DisplayHome";
import DisplayAlbum from "./DisplayAlbum";
import AdminPanel from "./AdminPanel";
import Profile from "./Profile";
import Footer from "./Footer";
import { PlayerContext } from "../context/playerContext";

const Display = () => {
  const displayedRef = useRef();
  const location = useLocation();
  
  const { albumsData } = useContext(PlayerContext);
  
  const isAlbum = location.pathname.includes("album");
  const isAdmin = location.pathname.includes("admin");
  const albumId = isAlbum ? location.pathname.split("/").pop() : "";

  // Dynamic backcompat lookup supporting both integer index and MongoDB string _id
  const albumData = isAlbum
    ? albumsData.find(item => String(item.id) === String(albumId) || String(item._id) === String(albumId))
    : null;

  const bgColor = albumData?.bgColor || "#121212";

  useEffect(() => {
    if (isAlbum && albumData) {
      displayedRef.current.style.background = `linear-gradient(${bgColor}, #121212)`;
    } else if (isAdmin) {
      displayedRef.current.style.background = `#121212`;
    } else {
      displayedRef.current.style.background = `#121212`;
    }
  }, [isAlbum, isAdmin, bgColor, albumData]);

  return (
    <div ref={displayedRef} className="w-[100%] m-2 px-6 pt-4 rounded bg-[#121212] text-white overflow-auto lg:w-[75%] flex flex-col justify-between">
      <div className="flex-grow mb-8">
        <Routes>
          <Route path="/" element={<DisplayHome />} />
          <Route path="/album/:id" element={<DisplayAlbum />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default Display;
