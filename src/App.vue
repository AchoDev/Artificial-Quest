
<template>
  <div class="flex flex-col gap-5">
    
    <h1>ARTIFICIAL QUEST</h1>
    
    <div class="flex gap-1">
      <span>ADD NEW PLAYER</span>
      <input type="text" v-model="newPlayerInput">
      <button @click="addPlayer()">Add player</button>
    </div>
  
    <div v-for="player in players">
      <span>{{ player }}</span>
      
      <div class="flex gap-3">
        <span>What will {{ player }} do? </span>
        <input type="text">
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref } from 'vue';

const players = ref<string[]>([]);
const newPlayerInput = ref<string>('');

function addPlayer() {
  players.value.push(newPlayerInput.value);
}

</script>

<style scoped>
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
