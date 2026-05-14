import { useEffect, useRef, useState } from "react";
import { songsData } from "../assets/assets";
import { PlayerContext } from "./playerContext";


const PlayerProvider = (props) => {

    const audioRef = useRef();
    const seekBg = useRef();
    const seekBar = useRef();

    const [track, setTrack] = useState(songsData[0]);
    const [playStatus, setPlayStatus] = useState(false);
    const [time, setTime] = useState({
        currentTime: {
            second: 0,
            minute: 0,

        },
        totalTime: {
            second: 0,
            minute: 0,
        }
    });

const play = () =>{
    audioRef.current?.play();
    setPlayStatus(true);

}

const pause = () =>{
audioRef.current?.pause();
setPlayStatus(false);
}

const playWithId = (id) => {
    setTrack(songsData[id]);
    setPlayStatus(true);

}

const previous = () =>{
    if(track.id >0){
        setTrack(songsData[track.id - 1]);
        setPlayStatus(true);
    }
}

const next = () =>{
    if(track.id < songsData.length - 1){
        setTrack(songsData[track.id + 1]);
        setPlayStatus(true);
    }
}

const seekSong = async (e) =>{
audioRef.current.currentTime = ((e.nativeEvent.offsetX / seekBg.current.offsetWidth) * audioRef.current.duration);
}

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
                }
            })

        }

    }, 1000)

    return () => clearTimeout(timerId);

}, [audioRef])

useEffect(() => {
    if (playStatus) {
        audioRef.current?.play();
    }
}, [track, playStatus])

    const contextValue = {
        audioRef,
        seekBg,
        seekBar,
        track,setTrack,
        playStatus, setPlayStatus,
        time, setTime ,
play,
pause,
playWithId,
palyWithId: playWithId,
previous,
next,
seekSong
    }

    return (
        <PlayerContext.Provider value={contextValue}>
            {props.children}
        </PlayerContext.Provider>
    )
}

export default PlayerProvider;
