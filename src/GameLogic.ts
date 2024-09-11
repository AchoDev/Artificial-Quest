import { defineStore } from 'pinia';
import { io, Socket } from "socket.io-client";
import { ref, watch } from 'vue'

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
    const gameStatus = ref(GameStatus.ChooseAction);
    const socket: Socket = io("http://localhost:3000");
    const currentResponse = ref("");

    const lobbyJoined = ref(false)
    const gameStarted = ref(false)

    const isHost = ref(false)

    const ready = ref(false)

    function notReady() {
        ready.value = false
        socket.emit("ready", false)
    }
    
    const players = ref<Player[]>([])
    
    socket.on("connect", () => {
        console.log("connected", socket.id)
    })
    
    socket.on("action-response", (res) => {
        console.log("action response!!!", res)
        notReady()
        currentResponse.value = res;
        gameStatus.value = GameStatus.SeeFate
    })

    socket.on("game-status", (status: GameStatus) => {
        console.log("the status has changes to " + status)
        notReady()
        gameStatus.value = status
    })

    socket.on("player-joined", (player: Player) => {
        players.value.push(player)
    })

    socket.on("disconnect", () => {
        console.log("disconnected")
        lobbyJoined.value = false
        gameStarted.value = false
        notReady()
    })

    socket.on("player-left", (id: string) => {
        console.log("player left", id)
        players.value = players.value.filter(p => p.id !== id)
        console.log("player list now", players.value)
        players.value[0].host = true
        if(players.value[0].id === socket.id) {
            isHost.value = true
        }
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
        notReady()
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
        setReady()
    }

    function joinLobby(username: string, char: string) {
        socket.emit("player-info", {username: username, char: char})
        lobbyJoined.value = true
    }

    function chooseItems(item1: string, item2: string) {
        socket.emit("choose-items", item1, item2)
        setReady()
    }
    
    function chooseDesire(desire: string) {
        socket.emit("choose-desire", desire)
        setReady()
    }

    function setReady() {
        ready.value = true
        socket.emit("ready", true)
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
