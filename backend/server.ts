
import dotenv from "dotenv"
import Together from "together-ai"
import { Server, Socket } from "socket.io"
import getPlot from "./plot.js"
import express from "express"
import http from "http"

const app = express()
const server = http.createServer(app)
dotenv.config()

app.get("/", (req, res) => {
    console.log("GET / request came")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send("Hello World")
})

server.listen(process.env.PORT, () => {
    console.log("server is running on port", process.env.PORT)
})

enum GameStatus {
    Lobby,
    ChooseItems,
    ChooseDesire,
    WaitingForAi,
    SettingStage,
    ChooseAction,
    SeeFate,
}

const together = new Together({apiKey: process.env.KEY})
let messages: Together.Chat.Completions.CompletionCreateParams.Message[] = []
const players: Socket[] = []
let story: string = ""
let selectedScenario: number = 0
let gameStatus = GameStatus.Lobby

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 120000,
        skipMiddlewares: true,
    },
    pingInterval: 1000,
    pingTimeout: 120000,
})

interface PlayerInfo {
    username: string
    char: string
    actionTaken: boolean,
    actionChosen: string,
    itemsChoosen: string[],
    desireChoosen: string,
    ready: boolean,
    host: boolean,
    id: string,
}



declare module "socket.io" {
    type SocketData = PlayerInfo;
}

let kickPlayerTimeouts: {token: string, timeout: NodeJS.Timeout}[] = []


io.on("connection", (socket) => {
    function setSocket(data: PlayerInfo) {
        socket.data.username = data.username
        socket.data.char = data.char
        socket.data.host = players.length === 1
        socket.data.actionTaken = false
        socket.data.id = socket.id
        socket.data.ready = false

        socket.data.itemsChoosen = []
        socket.data.desireChoosen = ""

        socket.data.token = token
    }


    console.log("conneceted to", socket.id)

    const { token } = socket.handshake.auth

    socket.emit("game-status", gameStatus)
    
    function clearTimeouts() {
        kickPlayerTimeouts.forEach(t => {
            if(t.token === token) {
                clearTimeout(t.timeout)
                kickPlayerTimeouts.splice(kickPlayerTimeouts.findIndex(t => t.token === token), 1)
                console.log("cleared timeout for player", token)
            }
        })  
    }

    if(players.find(p => p.data.token === token)) {
        const player = players.find(p => p.data.token === token)
    
        setSocket(player?.data)
        players.push(socket)
        players.splice(players.findIndex(p => p.id === player?.id), 1)
        socket.emit("joined-lobby", players.map(p => p.data))
        socket.emit("change-scenario", selectedScenario)
    }
    
    
    clearTimeouts()

    socket.on("disconnect", () => {
        console.log("disconnected", socket.id)
        if(players.length > 0 && players.find(p => p.data.host)?.id === socket.id) {
            players[0].data.host = true
            players[0].emit("host-info", true)
        }
        // players.splice(players.findIndex(p => p.id === socket.id), 1)
        io.emit("player-disconnected", token)

        kickPlayerTimeouts.push({
            token: token,
            timeout: setTimeout(() => {
                console.log("PLAYER TIMEOUT AFTER LEAVING", token)
                players.splice(players.findIndex(p => p.data.token === socket.data.token), 1)
                io.emit("player-left", token)

                if(players.length === 0) {
                    resetGame()
                }

            }, 1000 * 120)
        })
    })

    socket.on("player-info", (msg: PlayerInfo) => {

        if(socket.recovered) {
            console.log("player reconnected")
            socket.emit("game-status", gameStatus)
            return
        }

        players.push(socket)

        setSocket(msg)

        socket.broadcast.emit("player-joined", socket.data)
        socket.emit("joined-lobby", players.map(p => p.data))

        socket.emit("host-info", socket.data.host)
        socket.emit("game-status", gameStatus)
    })

    socket.on("leave-lobby", () => {
        players.splice(players.findIndex(p => p.id === socket.id), 1)
        io.emit("player-left", token)
        console.log("player left", token)
        if(players.length !== 0) {
            players[0].data.host = true
            players[0].emit("host-info", true)
        }

        if(players.length === 0) {
            resetGame()
        }
    })

    socket.on("set-scenario", (scenario: number) => {
        selectedScenario = scenario
        io.emit("change-scenario", scenario)
    })

    socket.on("take-action", async (action: string) => {
        console.log("player is taking action", action)

        if(socket.data.actionTaken) return

        socket.data.actionTaken = true
        socket.data.actionChosen = action

        if(players.every(p => p.data.actionTaken)) {

            io.emit("game-status", GameStatus.WaitingForAi)
            gameStatus = GameStatus.WaitingForAi

            const res = await takeAction(
                players.map(p => `${p.data.username} chose to do: ${p.data.actionChosen} \n`).join("")
            )

            players.forEach(p => p.data.actionTaken = false)
            gameStatus = GameStatus.SeeFate
            io.emit("action-response", res.choices[0].message?.content)
            // console.log(res.choices[0].message)
        }
    })

    socket.on("start-game", (setStory: string) => {
        if(socket.data.host) {
            gameStatus = GameStatus.ChooseItems
            io.emit("game-started")
            story = setStory
        }
    })

    socket.on("ready", value => {
        clearTimeouts()
        socket.data.ready = value
        console.log("player is ready", socket.data.ready, socket.data.username)
        console.log(gameStatus)

        if(!players.every(p => p.data.ready)) {
            console.log("not all players are ready playwer count", players.length)
            return
        } else {
            console.log("all players are ready player count", players.length)
        }

        switch(gameStatus) {
            case GameStatus.SettingStage:
                gameStatus = GameStatus.ChooseAction
                io.emit("game-status", gameStatus)
                break
            // case GameStatus.ChooseAction:
            //     console.log("Settings to WAITING FOR AI")
            //     gameStatus = GameStatus.WaitingForAi
            //     io.emit("game-status", gameStatus)
            //     break
            case GameStatus.SeeFate:
                console.log("fate has been seen")
                gameStatus = GameStatus.ChooseAction
                io.emit("game-status", gameStatus)
                break
        }
    })

    socket.on("choose-items", (item1, item2) => {
        if(gameStatus === GameStatus.ChooseItems) {
            socket.data.itemsChoosen = [item1, item2]

            console.log("player has chosen items", socket.data.itemsChoosen)

            if(players.every(p => p.data.itemsChoosen.length > 0)) {
                console.log("all players have chosen items")
                
                gameStatus = GameStatus.ChooseDesire
                io.emit("game-status", gameStatus)
            }
        }
    })

    

    socket.on("choose-desire", async (desire) => {
        if(gameStatus !== GameStatus.ChooseDesire) return

        socket.data.desireChoosen = desire

        if(desire === '') {
            socket.data.desireChoosen = "The player has not chosen a desire"
        }

        console.log("player has chosen desire", players.map(p => p.data))

        if(players.every(p => p.data.desireChoosen.length !== 0)) {
            console.log("all players have chosen desire")
            
            gameStatus = GameStatus.WaitingForAi
            io.emit("game-status", gameStatus)

            messages = [
                {
                    role: "user",
                    content: getPlot(
                        players.map(p => p.data.username),
                        players.map(p => p.data.itemsChoosen).flat(),
                        players.map(p => p.data.desireChoosen),
                        story
                    )
                }
            ]

            const beginning = await updateAI()

            gameStatus = GameStatus.SettingStage
            console.log("beggining", beginning.choices[0].message?.content)

            io.emit("beginning", beginning.choices[0].message?.content)
        }
    })
})

function resetGame() {
    console.log("restarting game!")
    gameStatus = GameStatus.Lobby
    messages = []
    players.forEach(p => {
        p.data.actionTaken = false
        p.data.actionChosen = ""
    })
}


async function takeAction(action: string) {

    messages.push({
        role: "user",
        content: action
    })

    return await updateAI()
}

async function updateAI() {
    const res = await together.chat.completions.create({
        messages: messages,
        // model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        // model: "mistralai/Mixtral-8x22B-Instruct-v0.1",
        // model: "Qwen/Qwen2-72B-Instruct",
        // model: "Qwen/Qwen2-72B-Instruct",
        // model: "google/gemma-2-27b-it",
        model: "NousResearch/Nous-Hermes-2-Yi-34B",
        max_tokens: 1000,
        temperature: 1.3,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ["<|eot_id|>","<|eom_id|>"],
        stream: false
    })

    messages.push({
        role: "assistant",
        content: res.choices[0].message?.content ?? "No response"
    })

    if(messages.length > 5) {

        const summaryQuery = messages.slice(0, messages.length - 5)
        summaryQuery.push({
            role: "user",
            content: "This was the flow of the game up until now. Summarize the last message you wrote. The summary should be between 50 and 70 tokens and include only the most important details needed to understand this part of the story. Focus on key actions, character motivations, and major plot points. Do not add new things or create new details that were not there before"
        })

        const resSummary = await together.chat.completions.create({
            messages: summaryQuery,
            // model: "google/gemma-2-27b-it",
            model: "NousResearch/Nous-Hermes-2-Yi-34B",
            max_tokens: 70,
            temperature: 1.3,
            top_p: 0.7,
            top_k: 50,
            repetition_penalty: 1,
            stop: ["<|eot_id|>","<|eom_id|>"],
            stream: false
        })
    
        messages.splice(messages.length - 5, 1, {
            role: "assistant",
            content: resSummary.choices[0].message!.content!
        })
    }

    console.log("messages: ", messages)

    return res
}




// console.log(res.choices[0].message?.content)