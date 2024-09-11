
<template>
  <div class="flex flex-col gap-5">
    <!-- <Game /> -->

    <TitleScreen v-if="!gameLogic.lobbyJoined" />
    <Lobby v-else-if="!gameLogic.gameStarted" />
    <Game v-else />

  </div>

</template>

<script setup lang="ts">
import Game from './Game.vue';
import { useGameLogic } from './GameLogic';
import Lobby from './Lobby.vue';
import TitleScreen from './TitleScreen.vue'

const gameLogic = useGameLogic()

</script>

<style scoped lang="scss">

#response-container {
  width: 700px;
  max-width: 90%;
  height: 700px;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
