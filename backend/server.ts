
import dotenv from "dotenv"
import Together from "together-ai"
import { Server, Socket } from "socket.io"
import getPlot from "./plot.js"
import express from "express"

const app = express()

app.get("/", (req, res) => {
    res.send("Hello World")
})

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})

dotenv.config()

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
let gameStatus = GameStatus.Lobby

const io = new Server(process.env.PORT as number | undefined || 80, {
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

    if(players.find(p => p.data.token === token)) {
        socket.emit("game-status", gameStatus)

        const timeout = kickPlayerTimeouts.find(t => t.token === token)?.timeout
        if(timeout != undefined) {
            clearTimeout(timeout)
        }
        
        const player = players.find(p => p.data.token === token)
        
        setSocket(player?.data)
        players.push(socket)
        players.splice(players.findIndex(p => p.id === player?.id), 1)
        socket.emit("joined-lobby", players.map(p => p.data))
    }

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
                players.splice(players.findIndex(p => p.id === socket.id), 1)
                io.emit("player-left", token)
                console.log("PLAYER TIMEOUT AFTER LEAVING")

                if(players.length === 0) {
                    resetGame()
                }

            }, 120000)
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

    socket.on("start-game", () => {
        if(socket.data.host) {
            gameStatus = GameStatus.ChooseItems
            io.emit("game-started")
        }
    })

    socket.on("ready", value => {
        socket.data.ready = value
        console.log("player is ready", socket.data.ready, socket.data.username)
        console.log(gameStatus)

        if(!players.every(p => p.data.ready)) {
            console.log("not all players are ready")
            return
        } else {
            console.log("all players are ready")
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
                        players.map(p => p.data.desireChoosen)
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
        model: "Qwen/Qwen2-72B-Instruct",
        max_tokens: 1000,
        temperature: 1.2,
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

    return res
}




// console.log(res.choices[0].message?.content)