import styled from "styled-components";

interface GameOverProps {
    score: number;
    lives: number;
    onRestart: () => void;
}

export const GameOver = ({score, lives,onRestart}: GameOverProps) => {


    if(!lives && !score) {
        return null;
    }

    return (
        <Container>
            <h1>Game Over</h1>
            <p>Final Score: {score}</p>
            <p>{lives <= 0 ? 'All lives are spent!' : 'Fell down!'}</p>
            <Button onClick={onRestart}>Restart</Button>
        </Container>
    );
}


const Container = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    background-color: red;
    color: #fff;
    z-index: 10000000000;
`


const Button = styled.div`
    background-color: #4a90e2;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 20px;
`
