import { defineStore } from 'pinia';
import { io, Socket } from "socket.io-client";
import { ref } from 'vue'

enum GameStatus {
    SettingStage,
    ChooseAction,
    SeeFate,
}

interface Player {
    username: string,
    char: string,
}

export const useGameLogic = defineStore('gameLogic', () => {
    const gameStatus = ref(GameStatus.SettingStage);
    const socket: Socket = io("http://localhost:3000");
    const currentResponse = ref("");

    const lobbyJoined = ref(false)
    const gameStarted = ref(false)

    const players = ref<Player[]>([])

    socket.on("connect", () => {
        console.log("connected", socket.id)
    })
    
    socket.on("action-response", (res) => {
        // stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        currentResponse.value = res;
    })

    socket.on("player-joined", (player: Player) => {
        players.value.push(player)
    })

    socket.on("joined-lobby", (playerList: Player[]) => {
        players.value = playerList
    })


    function takeAction(input: string) {
        console.log("sending choice")
        socket.emit("take-action", input)
    }

    function joinLobby(username: string, char: string) {
        socket.emit("player-info", {username: username, char: char})
        lobbyJoined.value = true
    }

    return {
        gameStatus,
        socket,
        lobbyJoined,
        gameStarted,

        players,

        takeAction,
        joinLobby,
    }
});
