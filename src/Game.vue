<template>

  <div id="daddy">

    <div class="absolute top-1 left-1 size-14 flex-center flex-row">
      <button @click="gameLogic.leaveLobby()" class="text-center">
        leave
      </button>
      <button @click="canContinue = true" v-if="devMode">
        skip
      </button>
    </div>



    <div class="absolute size-full bg-black bg-opacity-60 flex-center transition-opacity pointer-events-none opacity-0" :class="{'opacity-100': gameLogic.connected === false}">
      Reconnecting...
    </div>

    <div class="absolute">

    </div>

    <div class="flex flex-col gap-1" v-if="gameLogic.gameStatus === GameStatus.ChooseItems">
      <div v-if="!itemChosen">
        <span>You may choose <span class="bg-red-600 p-1">2</span> Items that will be present in the game...</span>
  
        <div class="flex gap-1 w-full">
          <span>Item 1</span>
          <input type="text" v-model="item1" class="w-full">
        </div>
  
        <div class="flex gap-1 w-full">
          <span>Item 2</span>
          <input type="text" v-model="item2" class="w-full">
        </div>
        
        <button @click="chooseItems()">Choose</button>
      </div>
      <div v-else class="flex flex-col gap-1">
        <span>You have chosen...</span>
        <span>{{ item1 }}</span>
        <span>{{ item2 }}</span>
        <span>Wait for the other players to choose something...</span>
      </div>
    </div>
    
    <div class="flex flex-col gap-1" v-else-if="gameLogic.gameStatus === GameStatus.ChooseDesire">
      <span>You may desire something about the upcoming adventure</span>

      <textarea type="text" v-model="desire"> </textarea> 
      
      <button v-if="!gameLogic.ready" @click="chooseDesire()">Shape reality</button>
      <span v-else>You have desired your desire... waiting for the others to choose</span>
    </div>

    <div class="flex flex-col gap-1" v-else-if="gameLogic.gameStatus === GameStatus.WaitingForAi">
      <h2>THE PLAYERS HAVE CHOSEN</h2>
      <span>The Gamemaster is crafting a story....</span>
    </div>

    <div class="flex flex-col gap-1 justify-center w-full" v-else-if="gameLogic.gameStatus === GameStatus.SettingStage || gameLogic.gameStatus === GameStatus.SeeFate || gameLogic.gameStatus === GameStatus.ChooseAction">

      <h2 v-if="gameLogic.gameStatus === GameStatus.SettingStage">The beginning</h2>
      <h2 v-else>What may your fate be?</h2>

      <FateDisplay :text="gameLogic.currentResponse" @finished="canContinue = true"/>

      <div v-if="gameLogic.gameStatus !== GameStatus.ChooseAction">
        <button v-if="canContinue && !gameLogic.ready" @click="gameLogic.setReady()">Continue</button>
        <button v-if="gameLogic.ready">You are ready... waiting for the others</button>
      </div>
      
      <div class="flex flex-col gap-1 items-center" v-if="gameLogic.gameStatus === GameStatus.ChooseAction">
        <span>What do you choose to do?</span>
        <textarea type="text" v-model="action" class="w-96 h-52 p-3 max-w-full"></textarea>
        <div>
          <button v-if="!gameLogic.ready" @click="takeAction()">Submit</button>
          <span v-else>You have chosen....</span>
        </div>
      </div>
    </div>

  
    <!-- <div id="response-container"  class="absolute-center bg-white text-black text-start p-5">
      <span>{{ response }}</span>
    </div> -->
  </div>
  

</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGameLogic, GameStatus } from './GameLogic';
import FateDisplay from './FateDisplay.vue';
import { computed } from 'vue';

const item1 = ref('');
const item2 = ref('');
const itemChosen = ref(false);

const desire = ref('')
const desireChosen = ref(false)

const action = ref('')

const canContinue = ref(false)

const gameLogic = useGameLogic()

const devMode = computed(() => import.meta.env.DEV)

function chooseItems() {
  itemChosen.value = true
  gameLogic.chooseItems(item1.value, item2.value);
}

function chooseDesire() {
  desireChosen.value = true
  gameLogic.chooseDesire(desire.value);
}

function takeAction() {
  gameLogic.takeAction(action.value);

  action.value = ''
}

</script>

<style scoped lang="scss">

#daddy {
  max-width: 99dvw;

  width: 100%;
  padding: 10px;
  display: flex;
  justify-content: center;
}

</style>