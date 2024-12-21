import './App.css'
import Game from './components/Game/Game'
function App() {
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
