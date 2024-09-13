<template>

<div class="flex flex-col gap-5 absolute-center">
    <h1>ARTIFICIAL QUEST</h1>

    <div v-if="gameLogic.connected">
        <input v-model="usernameInput" placeholder="Username" class="h-12 p-2"/>
        <button @click="joinLobby()">Join Lobby</button>
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


const gameLogic = useGameLogic()
const usernameInput = ref('')

function joinLobby() {
    gameLogic.joinLobby(usernameInput.value, 'nick')
}

</script>

<style scoped lang="scss">
</style>