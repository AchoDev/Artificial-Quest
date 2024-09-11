
import dotenv from "dotenv"
import Together from "together-ai"
import { Server, Socket } from "socket.io"
import getPlot from "./plot.js"

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

const io = new Server(3000, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
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

io.on("connection", (socket) => {
    console.log("conneceted to", socket.id)

    socket.on("disconnect", () => {
        console.log("disconnected", socket.id)
        if(players.length > 0 && players.find(p => p.data.host)?.id === socket.id) {
            players[0].data.host = true
            players[0].emit("host-info", true)
        }
        players.splice(players.findIndex(p => p.id === socket.id), 1)
        io.emit("player-left", socket.id)

        if(players.length === 0) {
            resetGame()
        }
    })

    socket.on("player-info", (msg: PlayerInfo) => {
        socket.data.username = msg.username
        socket.data.char = msg.char
        socket.data.host = players.length === 0
        socket.data.actionTaken = false
        socket.data.id = socket.id
        socket.data.ready = false

        players.push(socket)

        socket.broadcast.emit("player-joined", msg)
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
            const res = await takeAction(
                players.map(p => `${p.data.username} chose to do: ${p.data.actionChosen} \n`).join("")
            )
            socket.emit("action-response", res.choices[0].message?.content)
            console.log(res.choices[0].message)
        }
    })

    socket.on("start-game", () => {
        if(socket.data.host) {
            gameStatus = GameStatus.ChooseItems
            io.emit("game-started")
        }
    })

    socket.on("ready", () => {
        socket.data.ready = true

        switch(gameStatus) {
            case GameStatus.SettingStage:
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
        console.log("player has chosen desire", socket.data.desireChoosen)

        if(players.every(p => p.data.desireChoosen.length !== '')) {
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
        model: "databricks/dbrx-instruct",
        max_tokens: 512,
        temperature: 2,
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