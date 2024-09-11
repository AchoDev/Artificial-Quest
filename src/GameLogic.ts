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

    const ready = ref(false)

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

    socket.on("disconnect", () => {
        console.log("disconnected")
        lobbyJoined.value = false
        gameStarted.value = false
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

        console.log("msg", msg)

        gameStatus.value = GameStatus.SettingStage
        currentResponse.value = msg
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

    function setReady() {
        ready.value = true
        socket.emit("ready")
    }

    function takeAction(action: string) {
        socket.emit("take-action", )
    }

    return {
        gameStatus,
        socket,
        lobbyJoined,
        gameStarted,

        players,
        isHost,
        ready,

        takeAction,
        joinLobby,
        startGame,
        chooseItems,
        chooseDesire,
        setReady,
        

        currentResponse,
    }
});

export {useGameLogic, GameStatus}
