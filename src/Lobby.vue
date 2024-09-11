<template>

<div class="absolute-center p-3" id="lobby">

    <h3>Lobby</h3>

    <div class="flex gap-1 mb-10">
        <div v-for="player in gameLogic.players"  class="size-52 flex flex-col justify-between bg-opacity-25" >
            <PlayerModel :char="player.char" />
            <p>{{ player.username }} {{ player.isYou ? "(You)" : "" }}</p>
            <p v-if="player.host" class="bg-orange-400">Host</p>
        </div>
    </div>

    
    <button v-show="gameLogic.isHost" @click="gameLogic.startGame()">Start game</button>
</div>

</template>

<script setup lang="ts">
import { useGameLogic } from './GameLogic';
import PlayerModel from './PlayerModel.vue';

const gameLogic = useGameLogic()

</script>

<style scoped lang="scss">

#lobby {
    width: 700px;
    height: 700px;
}

</style>