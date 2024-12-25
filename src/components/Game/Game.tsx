import React, {useCallback, useLayoutEffect, useRef, useState} from 'react';
import {Player} from '../Player/Player';
import {Platform} from '../Platform/Platform';
// import { GameOver } from '../GameOver/GameOver';
import {GAME_CONFIG} from '../../utils/constants';
import {useKeyPress} from '../../hooks/useKeyPress';
import {
    checkBulletEnemyCollision,
    checkPlatformCollision,
    handlePlatformCollision,
    checkShootingBoostCollision
} from '../../utils/collision';
import {useGameLoop} from '../../hooks/useGameLoop';
import './Game.styles.css';
import {Enemy} from '../Enemy/Enemy';
import {checkEnemyCollision} from '../../utils/collision';
import {Bullet} from '../Bullet/Bullet';
import {useGyroscope} from '../../hooks/useGyroscope';
import {GameOver} from "../Views/GameOver.tsx";


interface GameOverData {
    score: number;
    lives: number;
}




const Game: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameOver, setGameOver] = useState(false);
    const [player] = useState<Player>(new Player());
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [score, setScore] = useState(0);
    const [cameraOffset, setCameraOffset] = useState(0);
    const [maxHeight, setMaxHeight] = useState(0);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [bullets, setBullets] = useState<Bullet[]>([]);
    const [isScreenPressed, setIsScreenPressed] = useState(false);
    const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);

    const {isMovingLeft: gyroLeft, isMovingRight: gyroRight} = useGyroscope();

    const leftPressed = useKeyPress('ArrowLeft') || gyroLeft;
    const rightPressed = useKeyPress('ArrowRight') || gyroRight;
    const upPressed = useKeyPress('ArrowUp');
    const lastShotTime = useRef(0);

    const handleShooting = useCallback(() => {
        const currentTime = Date.now();
        const shootingDelay = (player.rapidFireActive || player.autoFireActive) ? 200 : 500;

        if (currentTime - lastShotTime.current > shootingDelay) {
            const bullet = new Bullet({
                x: player.position.x + player.width / 2,
                y: player.position.y + player.height
            });
            setBullets(prev => [...prev, bullet]);
            lastShotTime.current = currentTime;
        }
    }, [player]);


    // Генерация начальных платформ
    const generateInitialPlatforms = useCallback(() => {
        const maxJumpHeight = (GAME_CONFIG.JUMP_FORCE * GAME_CONFIG.JUMP_FORCE) / (2 * GAME_CONFIG.GRAVITY);
        const minBoostGap = maxJumpHeight * 0.7;
        const newPlatforms: Platform[] = [];
        let previousHadBoost = false;

        newPlatforms.push(new Platform(0, {
            x: GAME_CONFIG.GAME_WIDTH / 2 - GAME_CONFIG.PLATFORM_WIDTH / 2,
            y: 50
        }));

        for (let i = 1; i < GAME_CONFIG.PLATFORM_COUNT; i++) {
            let y = 50 + (GAME_CONFIG.GAME_HEIGHT / (GAME_CONFIG.PLATFORM_COUNT + 2)) * i;

            if (previousHadBoost) {
                y += minBoostGap;
            }

            const platform = new Platform(
                i,
                {
                    x: Math.random() * (GAME_CONFIG.GAME_WIDTH - GAME_CONFIG.PLATFORM_WIDTH),
                    y: y
                },
                Math.random() < 0.8 ? 'normal' : 'moving'
            );

            previousHadBoost = platform.boost !== null;
            newPlatforms.push(platform);
        }
        setPlatforms(newPlatforms);
    }, []);

    const calculatePlatformGap = useCallback((height: number) => {
        // Начальный разброс
        const minGap = 30;
        const maxGap = 70;

        // Увеличиваем разброс с высотой
        const heightFactor = Math.min(height / 100000, 1); // Максимальный эффект на высоте 10000
        const currentMinGap = minGap + (heightFactor * 20); // Минимальный разрыв увеличивается до 50
        const currentMaxGap = maxGap + (heightFactor * 50); // Максимальный разрыв увеличивается до 150

        // Проверяем, чтобы разрыв не превышал максимальную высоту прыжка
        const maxJumpHeight = (GAME_CONFIG.JUMP_FORCE * GAME_CONFIG.JUMP_FORCE) / (2 * GAME_CONFIG.GRAVITY);
        const safeMaxGap = Math.min(currentMaxGap, maxJumpHeight * 0.5); // Уменьшаем до 70% от максимальной высоты прыжка

        return currentMinGap + Math.random() * (safeMaxGap - currentMinGap);
    }, []);

    // Обновляем функцию генерации новых платформ
    const generatePlatform = useCallback((yPosition: number) => {
        const platformType = Math.random();
        let type: 'normal' | 'moving' | 'breaking';

        // Увеличиваем шанс появления специальных платформ с высотой
        const heightFactor = Math.min(yPosition / 10000, 1);

        // Интерполируем шансы между начальными и максимальными значениями
        const normalChance = GAME_CONFIG.PLATFORM_CHANCES.INITIAL.NORMAL -
            (GAME_CONFIG.PLATFORM_CHANCES.INITIAL.NORMAL - GAME_CONFIG.PLATFORM_CHANCES.MAX_HEIGHT_FACTOR.NORMAL) * heightFactor;

        const movingChance = GAME_CONFIG.PLATFORM_CHANCES.INITIAL.MOVING +
            (GAME_CONFIG.PLATFORM_CHANCES.MAX_HEIGHT_FACTOR.MOVING - GAME_CONFIG.PLATFORM_CHANCES.INITIAL.MOVING) * heightFactor;

        if (platformType < normalChance) {
            type = 'normal';
        } else if (platformType < normalChance + movingChance) {
            type = 'moving';
        } else {
            type = 'breaking';
        }

        return new Platform(
            Date.now(),
            {
                x: Math.random() * (GAME_CONFIG.GAME_WIDTH - GAME_CONFIG.PLATFORM_WIDTH),
                y: yPosition
            },
            type
        );
    }, []);

    const generatePlatformsWithSafety = useCallback((startY: number, count: number) => {
        const platforms: Platform[] = [];
        let nextY = startY;
        let previousWasBreaking = false;
        let previousY = startY;

        const maxJumpHeight = (GAME_CONFIG.JUMP_FORCE * GAME_CONFIG.JUMP_FORCE) / (2 * GAME_CONFIG.GRAVITY);
        const minBoostGap = maxJumpHeight * 0.7;
        const minPlatformGap = 30;

        for (let i = 0; i < count; i++) {
            // Вычисляем базовый разрыв
            let gap = calculatePlatformGap(nextY);

            // Проверяем минимальный разрыв от предыдущей платформы
            if (nextY - previousY < minPlatformGap) {
                gap = Math.max(gap, minPlatformGap);
            }

            // Обновляем nextY с учетом разрыва
            nextY = previousY + gap;

            // Создаем платформу
            let platform: Platform;
            if (previousWasBreaking) {
                platform = new Platform(
                    Date.now() + i,
                    {
                        x: Math.random() * (GAME_CONFIG.GAME_WIDTH - GAME_CONFIG.PLATFORM_WIDTH),
                        y: nextY
                    },
                    'normal'
                );
                previousWasBreaking = false;
            } else {
                platform = generatePlatform(nextY);
                previousWasBreaking = platform.type === 'breaking';
            }

            // Если платформа имеет буст, увеличиваем разрыв для следующей
            if (platform.boost !== null) {
                nextY += Math.max(0, minBoostGap - gap);
            }

            platforms.push(platform);
            previousY = nextY;
        }

        return platforms;
    }, [calculatePlatformGap, generatePlatform]);

    // Добавляем функцию генерации врагов
    const generateEnemy = useCallback((yPosition: number) => {
        const type = Math.random() < 0.5 ? 'static' : 'moving';
        return new Enemy({
            x: Math.random() * (GAME_CONFIG.GAME_WIDTH - 30),
            y: yPosition
        }, type);
    }, []);

    // Отрисовка на canvas
    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, GAME_CONFIG.GAME_WIDTH, GAME_CONFIG.GAME_HEIGHT);

        if (gameOver) {
            setGameOverData({score, lives: player.lives});
            return;
        }

        // Сохраняем контекст перед трансформацией
        ctx.save();
        // Сдвигаем весь контекст на величину смещения камеры
        ctx.translate(0, cameraOffset);

        // Рисуем игровые объекты с учетом смещения
        player.draw(ctx);
        platforms.forEach(platform => platform.draw(ctx));
        enemies.forEach(enemy => enemy.draw(ctx));
        bullets.forEach(bullet => bullet.draw(ctx));
        ctx.restore();

        // Рисуем счет и жизни
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${score}`, 10, 30);

        // Отрисовка жизней
        for (let i = 0; i < player.lives; i++) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(30 + i * 30, 60, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Отображаем состояние буста стрельбы
        if (player.rapidFireActive && player.rapidFireEndTime) {
            const timeLeft = Math.ceil((player.rapidFireEndTime - Date.now()) / 1000);
            ctx.fillText(`Rapid Fire: ${timeLeft}s`, 10, 60);
        }
        if (player.autoFireActive && player.autoFireEndTime) {
            const timeLeft = Math.ceil((player.autoFireEndTime - Date.now()) / 1000);
            ctx.fillText(`Auto Fire: ${timeLeft}s`, 10, 90);
        }
    }, [player, platforms, score, gameOver, cameraOffset, enemies, bullets]);

    const resetGame = useCallback(() => {
        setGameOverData(null);
        setGameOver(false);
        setScore(0);
        setMaxHeight(0);
        setCameraOffset(0);
        player.reset();
        generateInitialPlatforms();
        setEnemies([]);
        setBullets([]);
    }, [generateInitialPlatforms, player]);

    useLayoutEffect(() => {
        resetGame();
    }, []);

    const updateGame = useCallback((deltaTime: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (gameOver) {
            draw(ctx);
            return;
        }

        player.update(deltaTime, leftPressed, rightPressed);

        // Обновляем смещение камеры только когда игрок поднимаетс выше
        const targetCameraOffset = player.position.y - GAME_CONFIG.GAME_HEIGHT / 2;
        if (targetCameraOffset > cameraOffset) {
            setCameraOffset(targetCameraOffset);
        }

        // Проверяем падение игрока относительно камеры
        const playerScreenPosition = player.position.y - cameraOffset;
        if (playerScreenPosition < 0) { // Игрок упал ниже экрана
            console.log('Game Over - player fell below screen');
            setGameOver(true);
            return;
        }

        // Обновляем игровую логику
        if (platforms.length === 0) {
            generateInitialPlatforms();
        }

        platforms.forEach(platform => {
            platform.update(deltaTime);
            const collision = checkPlatformCollision(player, platform);
            if (collision) {
                const {newVelocityY, shouldBreak} = handlePlatformCollision(player, platform);
                player.jump(newVelocityY);
                player.isJumping = false;

                if (shouldBreak) {
                    platform.startBreaking();
                }
            }
        });

        // Обновляем максимальную высоту и очки реже
        if (player.position.y > maxHeight) {
            const newHeight = Math.floor(player.position.y);
            if (newHeight - maxHeight >= 1) {
                setMaxHeight(newHeight);
                setScore(prev => prev + (newHeight - Math.floor(maxHeight)));

                // Генерируем врагов после высоты 3000
                if (newHeight > 3000) {
                    const lastCheckpoint = Math.floor(maxHeight / 500) * 500;
                    const newCheckpoint = Math.floor(newHeight / 500) * 500;

                    if (newCheckpoint > lastCheckpoint) {
                        if (Math.random() < 0.5) { // Возвращаем шанс к 2%
                            const newEnemy = generateEnemy(player.position.y + GAME_CONFIG.GAME_HEIGHT);
                            setEnemies(prev => [...prev, newEnemy]);
                        }
                    }
                }
            }
        }

        // Обновляем и проверяем столкновения с врагами
        enemies.forEach(enemy => {
            enemy.update();
            const {collision, fromTop} = checkEnemyCollision(player, enemy);

            if (collision) {
                if (fromTop || player.shieldActive) {
                    // Если игрок падает на врага сверху или имеет щит
                    player.jump(GAME_CONFIG.JUMP_FORCE);
                    // Удаляем врага
                    setEnemies(prev => prev.filter(e => e !== enemy));

                    if (player.shieldActive && !fromTop) {
                        // Если столкновение произошло со щитом, деактивируем его
                        player.shieldActive = false;
                    }
                } else {
                    // Если столкновение сбоку или снизу и нет щита
                    const isGameOver = player.loseLife();
                    if (isGameOver) {
                        setGameOver(true);
                        return;
                    } else {
                        // Удаляем врага и даём небольшую неуязвимость (отскок)
                        setEnemies(prev => prev.filter(e => e !== enemy));
                        player.jump(GAME_CONFIG.JUMP_FORCE * 0.7);
                    }
                }
            }
        });

        // Удаляем врагов, которые ушли далеко вниз
        setEnemies(prev => prev.filter(enemy =>
            enemy.position.y > player.position.y - GAME_CONFIG.GAME_HEIGHT
        ));

        // Удаляем платформы, которые полностью разрушились
        setPlatforms(prev => prev.filter(platform => !platform.shouldBeRemoved()));

        // Генерируем новые платформы, если игрок поднялся достаточно высоко
        const highestPlatform = Math.max(...platforms.map(p => p.position.y));
        if (player.position.y + GAME_CONFIG.GAME_HEIGHT > highestPlatform) {
            const newPlatforms = [
                ...platforms,
                ...generatePlatformsWithSafety(highestPlatform, 3)
            ];
            setPlatforms(newPlatforms);
        }

        // Удаляем платформы, которые ушли далеко вниз
        setPlatforms(prev => prev.filter(platform =>
            platform.position.y > player.position.y - GAME_CONFIG.GAME_HEIGHT
        ));

        setBullets(prev => {
            const updatedBullets = prev.filter(bullet => {
                bullet.update();
                // Удаляем пули, которые ушли за пределы экрана
                return bullet.position.y < player.position.y + GAME_CONFIG.GAME_HEIGHT;
            });
            return updatedBullets;
        });

        bullets.forEach(bullet => {
            enemies.forEach(enemy => {
                if (checkBulletEnemyCollision(bullet, enemy)) {
                    setBullets(prev => prev.filter(b => b !== bullet));
                    setEnemies(prev => prev.filter(e => e !== enemy));
                }
            });
        });

        if ((upPressed || player.autoFireActive || isScreenPressed) && !gameOver) {
            handleShooting();
        }

        player.updateBoosts(); // Обновляем состояние бустов

        // Проверяем коллизии с бустами стрельбы во время полета
        platforms.forEach(platform => {
            if (platform.boost && !platform.boost.isCollected) {
                if (platform.boost.type === 'rapidfire' ||
                    platform.boost.type === 'autofire' ||
                    platform.boost.type === 'shield') {  // Добавляем проверку щита
                    if (checkShootingBoostCollision(player, platform.boost)) {
                        platform.boost.collect();
                        if (platform.boost.type === 'rapidfire') {
                            player.activateRapidFire();
                        } else if (platform.boost.type === 'autofire') {
                            player.activateAutoFire();
                        } else if (platform.boost.type === 'shield') {
                            player.activateShield();
                        }
                    }
                }
            }
        });


        draw(ctx);
    }, [platforms, leftPressed, rightPressed, draw, generateInitialPlatforms, player, gameOver, cameraOffset, maxHeight, enemies, bullets, isScreenPressed]);

    const handleCanvasClick = useCallback(() => {
        if (gameOver) return
        handleShooting();
    }, [gameOver, resetGame, handleShooting]);

    useGameLoop(updateGame, {
        fps: 60,
    });

    // Обработчики касания экрана
    const handleTouchStart = useCallback(() => {
        setIsScreenPressed(true);
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsScreenPressed(false);
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                width={GAME_CONFIG.GAME_WIDTH}
                height={GAME_CONFIG.GAME_HEIGHT}
                onClick={handleCanvasClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="game-canvas"
            />
            <GameOver
                onRestart={resetGame}
                score={gameOverData?.score || 0}
                lives={gameOverData?.lives || 0}
            />
        </>
    );
};

export default Game;