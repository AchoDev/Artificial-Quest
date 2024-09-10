import { defineStore } from 'pinia';

enum GameStatus {
    ChooseAction,
    SeeFate,
}

export const useGameLogic = defineStore('gameLogic', () => {
    const gameStatus = GameStatus.ChooseAction;

    return {
        gameStatus,
    }
});
