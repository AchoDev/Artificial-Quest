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
    token: string,
    host: boolean,
    isYou: boolean
}

const useGameLogic = defineStore('gameLogic', () => {
    const gameStatus = ref(GameStatus.ChooseAction);
    let socket: Socket;
    let baseURL = "http://artificial-quest.onrender.com/"

    function generateUUID() {
        let dt = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid
    }


    if(import.meta.env.DEV) {
        console.log("local app")
        baseURL = "http://localhost:80"
    } 
        
    let uuid
    if(localStorage.getItem("uuid") === null) {
        uuid = generateUUID()
        localStorage.setItem("uuid", uuid)
    } else {
        uuid = localStorage.getItem("uuid")
    }

    socket = io(baseURL, {
        reconnection: true,               // Enable automatic reconnection
        reconnectionAttempts: Infinity,   // Unlimited reconnection attempts
        reconnectionDelay: 1000,          // Wait 1 second before trying to reconnect
        reconnectionDelayMax: 5000,       // Maximum delay between reconnections
        timeout: 20000,
        auth: {
            token: uuid
        }
    })
    
    
    const currentResponse = ref("");

    const lobbyJoined = ref(false)
    const gameStarted = ref(false)

    const connected = ref(false)

    const isHost = ref(false)

    const ready = ref(false)

    const selectedScenario = ref(0)

    function notReady() {
        ready.value = false
        socket.emit("ready", false)
    }
    
    const players = ref<Player[]>([])
    
    socket.on("connect", () => {
        console.log("connected", socket.id)
        connected.value = true
        
        fetch(baseURL)
        setInterval(() => {
            fetch(baseURL)
        }, 1000 * 60 * 5)
    })
    
    socket.on("action-response", (res) => {
        console.log("action response!!!", res)
        notReady()
        // turn all \n into <br> for html
        currentResponse.value = new RegExp("\n", "g").test(res) ? res.replace(/\n/g, "<br>") : res;
        gameStatus.value = GameStatus.SeeFate
    })

    socket.on("game-status", (status: GameStatus) => {
        console.log("the status has changes to " + status)
        notReady()

        if(status !== GameStatus.Lobby) {
            gameStarted.value = true
        }
        gameStatus.value = status
    })

    socket.on("player-joined", (player: Player) => {
        players.value.push(player)
    })

    socket.on("disconnect", () => {
        console.log("disconnected")
        connected.value = false
    })

    socket.on("player-left", (token: string) => {
        console.log("player left", token)
        console.log("player list before", players.value)
        players.value = players.value.filter(p => p.token !== token)
        console.log("player list now", players.value)
        if(players.value.length !== 0) {
            players.value[0].host = true

            if(players.value[0].token === players.value.find(p => p.isYou)?.token) {
                isHost.value = true
            }
        }

    })

    socket.on("change-scenario", (scenario: number) => {
        console.log("scenario changes to", scenario)
        selectedScenario.value = scenario
    })

    socket.on("joined-lobby", (playerList: Player[]) => {
        players.value = playerList
        const you = players.value[players.value.length - 1]
        you.isYou = true
        if(you.host) {
            isHost.value = true
        }
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

    function setScenario(scenario: number) {
        selectedScenario.value = scenario
        socket.emit("set-scenario", selectedScenario.value)
    }

    function startGame(story: string) {
        console.log("story", story)
        socket.emit("start-game", story)
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

    function leaveLobby() {
        socket.emit("leave-lobby")
        lobbyJoined.value = false
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
        selectedScenario,

        takeAction,
        joinLobby,
        leaveLobby,
        startGame,
        chooseItems,
        chooseDesire,
        setReady,
        setScenario,
        

        currentResponse,
        connected,
    }
});

export {useGameLogic, GameStatus}
