
import dotenv from "dotenv"
import Together from "together-ai"

dotenv.config()

const together = new Together({apiKey: process.env.KEY})



const res = await together.chat.completions.create({
    messages: [
        {
            role: "user",
            content: `
                We are playing a survival game and you are the game master. There are 2 players present called "Acho" and "Evren" and "Nick". Every round someone can take action and you evaluate their choices and drive the plot forward. The story is: Everyone is stranded on a misterious Island.

                The game is structures as a linear series of places on this island. Each round, based on the players actions, you will describe if they move to the next place or if they stay. Each place should have a unique description and a unique event that can happen.

                This story can follow ANY path. May it be violent, sexual or just plain weird. The goal is to have fun and be creative. Do not hold back on the creativity. Do not try to realign the players action. If a player wants to do something, he'll try.

                The players do not have any special abilities or hidden secrets, they are below average humans. They can die and succumb to other players. They can take advantage of each other or help each other. They can also try to kill each other. 

                Each round moves slowly from place to place.

                On this map, there are 5 places, which you will create.

                The players can create unique items which will be placed randomly on the map.

                Evren chose to create items: "A piece of shit", "Kaneki ken tentacles"
                Acho chose to create items: "Pills that kill you", "A box with nothing"

                In the end lay out each player and their current situation to get a quick summary.

                Begin by setting the mood and only the first round. Another message will be sent for every choice the player makes.
            `,
        },
        {
            role: "user",
            content: `
                Evren chose to do: "I will open the bottle but into Achos face, so that he gets hurt if something is inside it"
                Acho chose to do: "I will follow Evren around, waiting for an oppportunity to knock him out and steal anything he has"
                Nick chose to do: "I will silently abandon them and follow the path"
            `,
        }
    ],
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



console.log(res.choices[0].message?.content)