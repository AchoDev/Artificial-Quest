<template>

<div id="player" class="h-52">

    <img :src="`/chars/${char}/idle.png`" alt="" class="h-full">

</div>

</template>

<script setup lang="ts">

defineProps<{
    char: string
}>()

</script>

<style scoped lang="scss">

#player {
    
    transform-origin: bottom center;
    animation: idle 2s infinite;

    @keyframes idle {
        0% {
            transform: scaleY(1);
        }
        50% {
            transform: scaleY(0.9);
        }
        100% {
            transform: scaleY(1);
        }
    }
}

</style>