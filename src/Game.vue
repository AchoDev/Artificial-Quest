<template>

  <div>

    <div class="absolute">

    </div>

    <div class="flex gap-1">
      <span>What do you choose to do?</span> <input type="text">
    </div>
    <div>
      <button @click="" >Submit</button>
    </div>
  
    <div id="response-container"  class="absolute-center bg-white text-black text-start p-5">
      <span>{{ response }}</span>
    </div>
  </div>
  

</template>

<script setup lang="ts">
import { ref } from 'vue';

const response = ref('');

const fullResponse = ref('');

function addSingularLetter(index: number) {
  response.value = response.value + fullResponse.value[index];
  setTimeout(() => {
    if (index < fullResponse.value.length - 1) {
      addSingularLetter(index + 1);
    }
  }, 50)
}

addSingularLetter(0)
</script>