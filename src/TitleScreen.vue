<template>

<div class="flex flex-col gap-5 absolute-center">
    <h1>ARTIFICIAL QUEST</h1>

    <div v-if="gameLogic.connected" class="flex flex-col justify-center items-center">

        <span>Select character</span>

        <div class="flex pb-10 overflow-x-scroll overflow-y-hidden h-auto w-2/4">
            <div v-for="char in ['acho', 'evren', 'hamza', 'leo', 'marcel', 'nick']" @click="selectedChar = char" class="size-52 flex flex-col justify-between bg-opacity-25 flex-shrink-0 cursor-pointer" :class="{'bg-white': selectedChar === char}">
                <PlayerModel :char="char" />
                <p>{{ char }}</p>
            </div>
        </div>

        <div class="flex gap-1">
            <input v-model="usernameInput" placeholder="Username" class="h-12 p-2"/>
            <button @click="joinLobby()" :class="{'opacity-50': !canConnect}" :disabled="!canConnect">Join Lobby</button>
        </div>
    </div>

    <div v-else>
        <center>
            Connecting to server...
        </center>
    </div>

</div>




</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGameLogic } from './GameLogic';
import PlayerModel from './PlayerModel.vue';
import { computed } from 'vue';


const gameLogic = useGameLogic()
const usernameInput = ref('')
const selectedChar = ref('')
const canConnect = computed(() => usernameInput.value.length > 0 && selectedChar.value.length > 0)

function joinLobby() {
    gameLogic.joinLobby(usernameInput.value, selectedChar.value)
}

</script>

<style scoped lang="scss">
</style>