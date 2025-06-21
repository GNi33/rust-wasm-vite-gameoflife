import { initGameOfLife } from "./src/modules/game_of_life";

const playPauseButton = document.getElementById('play-pause-button') as HTMLButtonElement;
playPauseButton.classList.add('js-state-paused');

initGameOfLife('game-of-life-canvas', 'random').then(
    (gameOfLife) => {
        if (gameOfLife) {

            playPauseButton.addEventListener('click', () => {
                if (gameOfLife.isPlaying()) {
                    gameOfLife.stop();
                    playPauseButton.classList.remove('js-state-playing');
                    playPauseButton.classList.add('js-state-paused');
                } else {
                    gameOfLife.start();
                    playPauseButton.classList.add('js-state-playing');
                    playPauseButton.classList.remove('js-state-paused');
                }
            });

            //gameOfLife.start();
        } else {
            console.error("Failed to initialize Game of Life.");
        }
    }
);
