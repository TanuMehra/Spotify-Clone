import { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import DisplayHome from "./DisplayHome";
import DisplayAlbum from "./DisplayAlbum";
import { albumsData } from "../assets/assets";

const Display = () => {

 const displayedRef = useRef();
 const location = useLocation();
 const isAlbum = location.pathname.includes("album");
 const albumId = isAlbum ? location.pathname.split("/").pop() : "";
 const bgColor = albumsData[Number(albumId)]?.bgColor;

 useEffect(()=>{
    if(isAlbum && bgColor){
        displayedRef.current.style.background=`linear-gradient(${bgColor}, #121212)`;
    }
    else{
        displayedRef.current.style.background=`#121212`;
    }
 }, [isAlbum, bgColor])


    return (
       <div ref={displayedRef} className="w-[100%] m-2 px-6 pt-4 rounded bg-[#121212] text-white overflow-auto lg:w-[75%]"> 
        <Routes>
            <Route path="/" element={<DisplayHome />} />
            <Route path ="/album/:id" element={<DisplayAlbum />} />

            
        </Routes>
        </div>
    )
}

export default Display;
