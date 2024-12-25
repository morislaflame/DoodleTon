import './App.css'
import Game from './components/Game/Game'
import { useLayoutEffect} from "react";


function App() {
    const tg = window.Telegram.WebApp;

    tg.headerColor = '#000000';
    useLayoutEffect(() => {
        // window.Telegram.WebApp.requestFullscreen()
    }, [])
    return (
        <>
            <div className="game-container">
                <div className="game-canvas">
                    <Game/>
                </div>
            </div>
        </>
    )
}

export default App
