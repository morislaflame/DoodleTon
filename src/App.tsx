import './App.css'
import Game from './components/Game/Game'


function App() {
  const tg = window.Telegram.WebApp;

  tg.headerColor = '#000000';

  return (
    <>
      <div className="game-container">
        <h1 style={{color: 'black'}}>Doodle Jump</h1>
        <div className="game-canvas"> 
          <Game />
        </div>
      </div>
    </>
  )
}

export default App
