
<template>
  <div class="flex flex-col gap-5">
    
    <h1>ARTIFICIAL QUEST</h1>
  
    <div>
      <span>Evren</span>
      
      <div class="flex gap-3">
        <span>What will evren do? </span>
        <textarea v-model="evrenInput"> </textarea>
      </div>
    </div>
    <div>
      <span>Acho</span>
      
      <div class="flex gap-3">
        <span>What will acho do? </span>
        <textarea v-model="achoInput"> </textarea>
      </div>
    </div>

    <button>Send</button>

    <div>
      <h3>Response</h3>
      
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref } from 'vue';

const evrenInput = ref('');
const achoInput = ref('');

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
