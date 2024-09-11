<template>

<div>
{{ displayedText }}
</div>

</template>

<script setup lang="ts">
import { ref } from 'vue';


const props = defineProps<{
    text: string
}>()

const displayedText = ref('')

function addSingularLetter(index: number) {
  displayedText.value = displayedText.value + props.text[index];
  setTimeout(() => {
    if (index < props.text.length - 1) {
      addSingularLetter(index + 1);
    }
  }, 50)
}

console.log(props.text)

addSingularLetter(0)

</script>

<style scoped lang="scss">
</style>