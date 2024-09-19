<template>

<div class="absolute-center p-3 flex flex-col" id="lobby">

    <h3>Lobby</h3>

    <div class="flex gap-4 overflow-y-scroll pb-6">
        <div 
            v-for="(scenario, index) in scenarios" 
            @click="gameLogic.setScenario(index)" 
            :class="{'bg-white': index === gameLogic.selectedScenario}"
            class="bg-opacity-25 flex-shrink-0 cursor-pointer flex flex-col justify-center"
        >
            <span>{{ scenario.title }}</span>
            <img :src="`/scenarios/${scenario.image}`" alt="scenario image" class="size-36"/>
        </div>
    </div>

    <div v-if="gameLogic.selectedScenario !== -1">
        <div v-if="gameLogic.selectedScenario !== scenarios.length - 1">
            <span>Your scenario:</span>
            <h3 class="text-lg">{{ scenarios[gameLogic.selectedScenario].title }}</h3>
            <span>{{ scenarios[gameLogic.selectedScenario].description }}</span>
        </div>

        <div v-else class="flex flex-col items-center">
            <span>Choose your own story</span>
            <textarea v-if="gameLogic.isHost" v-model="ownStoryInput"  class="w-full h-40 max-w-96 p-3"> </textarea>
            <span v-else>The host is choosing a scenario...</span>
        </div>
    </div>

    <div class="flex gap-1 flex-wrap justify-center items-center mb-16">
        <div v-for="player in gameLogic.players"  class="size-52 flex flex-col justify-between bg-opacity-25" >
            <PlayerModel :char="player.char" />
            <p>{{ player.username }} {{ player.isYou ? "(You)" : "" }}</p>
            <p v-if="player.host" class="bg-orange-400">Host</p>
        </div>
    </div>

    
    <button @click="gameLogic.leaveLobby()" class="mb-2">Leave lobby</button>
    <button v-show="gameLogic.isHost && story !== ''" @click="gameLogic.startGame(story)">Start game</button>
</div>

</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameLogic } from './GameLogic';
import PlayerModel from './PlayerModel.vue';
import { ref } from 'vue';

const gameLogic = useGameLogic()
const ownStoryInput = ref('')

const story = computed(() => {
    if(gameLogic.selectedScenario === -1) return ""
    if(gameLogic.selectedScenario === scenarios.length - 1) return ownStoryInput.value 

    return scenarios[gameLogic.selectedScenario].innerDesc
})

const scenarios = [
    {
        title: "Misterious Island",
        image: "island.png",
        description: "You wake up on a misterious island and need to escape",
        innerDesc: "Everyone is stranded on a misterious Island. In the middle of the island, is a giant vulcano, surrounded by a huge dense rainforest. "
    },
    {
        title: "MrBeast Challenge",
        image: "mrbeast.png",
        description: "You are forced to participate in a MrBeast challenge",
        innerDesc: "MrBeast has kidnapped everyone with narcotics and forces you to participate in a challenge you have to make up. The winner gets 1 million dollars."
    },
    {
        title: "Al-Imran Prison",
        image: "prison.png",
        description: "You were caught for your crimes and are now in Al-Imran Prison. You need to escape",
        innerDesc: "Everyone is in the Al-Imran Prison, a high security prison in the middle of the desert. The players have commited heinous crimes, you make up what crime everyone commited. Thee players need to escape somehow"
    },
    {
        title: "Romantic Escapades",
        image: "woman.png",
        description: "You have fallen in love with this woman. You need to win her heart",
        innerDesc: "Everyone is in love with one singular woman. The players have to make up how they fell in love with her and how they are going to win her heart."
    },
    {
        title: "Choose yourself",
        image: "none.png",
        description: "Choose your own story",
        innerDesc: ""
    }
]

</script>

<style scoped lang="scss">

#lobby {
    width: 700px;
    height: 700px;
    max-width: 90%;
}

</style>