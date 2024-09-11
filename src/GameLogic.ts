import { defineStore } from 'pinia';
import { io, Socket } from "socket.io-client";
import { ref } from 'vue'

enum GameStatus {
    Lobby,
    ChooseItems,
    ChooseDesire,
    WaitingForAi,
    SettingStage,
    ChooseAction,
    SeeFate,
}

interface Player {
    username: string,
    char: string,
    id: string,
    host: boolean,
    isYou: boolean
}

const useGameLogic = defineStore('gameLogic', () => {
    const gameStatus = ref(GameStatus.SettingStage);
    const socket: Socket = io("http://localhost:3000");
    const currentResponse = ref("");

    const lobbyJoined = ref(false)
    const gameStarted = ref(false)

    const isHost = ref(false)

    const currentMessage = ref('')

    const players = ref<Player[]>([])

    socket.on("connect", () => {
        console.log("connected", socket.id)
    })
    
    socket.on("action-response", (res) => {
        // stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        currentResponse.value = res;
    })

    socket.on("game-status", (status: GameStatus) => {
        console.log("the status has changes to " + status)
        
        gameStatus.value = status
    })

    socket.on("player-joined", (player: Player) => {
        players.value.push(player)
    })

    socket.on("player-left", (id: string) => {
        console.log("player left", id)
        console.log("player", players.value)
        players.value = players.value.filter(p => p.id !== id)
        players.value[0].host = true
    })

    socket.on("joined-lobby", (playerList: Player[]) => {
        players.value = playerList
        players.value[players.value.length - 1].isYou = true
    })

    socket.on("host-info", (host) => {
        console.log("is host", host)
        isHost.value = host
    })

    socket.on("game-started", () => {
        gameStarted.value = true
        gameStatus.value = GameStatus.ChooseItems
    })

    socket.on("beginning", (msg: string) => {
        gameStatus.value = GameStatus.SettingStage
        currentMessage.value = msg
    })

    function startGame() {
        socket.emit("start-game")
    }

    function takeAction(input: string) {
        console.log("sending choice")
        socket.emit("take-action", input)
    }

    function joinLobby(username: string, char: string) {
        socket.emit("player-info", {username: username, char: char})
        lobbyJoined.value = true
    }

    function chooseItems(item1: string, item2: string) {
        socket.emit("choose-items", item1, item2)
    }

    function chooseDesire(desire: string) {
        socket.emit("choose-desire", desire)
    }

    return {
        gameStatus,
        socket,
        lobbyJoined,
        gameStarted,

        players,
        isHost,

        takeAction,
        joinLobby,
        startGame,
        chooseItems,
        chooseDesire,

        currentResponse,
    }
});

export {useGameLogic, GameStatus}
