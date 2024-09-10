
import dotenv from "dotenv"
import Together from "together-ai"
import { Server, Socket } from "socket.io"

dotenv.config()

const together = new Together({apiKey: process.env.KEY})
const messages: Together.Chat.Completions.CompletionCreateParams.Message[] = []
const players: Socket[] = []

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
}

declare module "socket.io" {
    type SocketData = PlayerInfo;
}

io.on("connection", (socket) => {
    console.log("conneceted to", socket.id)

    socket.on("player-info", (msg: PlayerInfo) => {
        socket.data.username = msg.username
        socket.data.char = msg.char
        socket.data.host = players.length === 0
        socket.data.actionTaken = false

        players.push(socket)

        socket.broadcast.emit("player-joined", msg)
        socket.emit("joined-lobby", players.map(p => p.data))
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
            io.emit("game-started")
        }
    })
})


async function takeAction(action: string) {

    messages.push({
        role: "user",
        content: action
    })

    const res = await together.chat.completions.create({
        messages: messages,
        // model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        // model: "mistralai/Mixtral-8x22B-Instruct-v0.1",
        // model: "Qwen/Qwen2-72B-Instruct",
        model: "databricks/dbrx-instruct",
        max_tokens: 2000,
        temperature: 2,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ["<|eot_id|>","<|eom_id|>"],
        stream: false
    })

    messages.push({
        role: "system",
        content: res.choices[0].message?.content ?? "No response"
    })

    return res
}




// console.log(res.choices[0].message?.content)