import React, { useEffect, useState } from 'react'
import IdleGame from './IdleGame';
import PomodoroSelector from './PomodoroSelector';
import { useNavigate } from 'react-router-dom';

function PomodoroSystem() {
    const [selectedDuration, setSelectedDuration] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                console.log("User exited fullscreen");
                // You can show a message or encourage them to go back in.
            }
        };
      
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        const tryFullscreen = async () => {
          try {
            await document.documentElement.requestFullscreen();
          } catch (err) {
            console.error("Fullscreen request denied:", err);
          }
        };
      
        
        if(selectedDuration > 0){
            tryFullscreen();

            navigate(`/tower/${selectedDuration}`);
        }
    }, [selectedDuration]);



      

    return (
        <div>
            {!selectedDuration && (
                <PomodoroSelector onSelectDuration={setSelectedDuration} />
            )}
            
        </div>
    )
}

export default PomodoroSystem