<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// Декоративная зацикленная анимация из макета (в Figma это GIF, здесь MP4: в 20 раз легче).
// При системной настройке «Уменьшить движение» показываем статичный первый кадр.
defineProps({
  src: { type: String, required: true },
  poster: { type: String, required: true }
})
// playing — анимация действительно пошла (или показан статичный кадр при «Уменьшить движение»)
const emit = defineEmits(['playing'])

const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
const reduced = ref(query ? query.matches : false)
const update = (e) => (reduced.value = e.matches)

onMounted(() => {
  query?.addEventListener?.('change', update)
  if (reduced.value) emit('playing', { still: true })
})
onBeforeUnmount(() => query?.removeEventListener?.('change', update))
</script>

<template>
  <img v-if="reduced" class="loop-media" :src="poster" alt="" />
  <video
    v-else
    class="loop-media"
    :src="src"
    :poster="poster"
    autoplay
    muted
    loop
    playsinline
    preload="auto"
    aria-hidden="true"
    tabindex="-1"
    disablepictureinpicture
    @playing.once="emit('playing', { still: false })"
  />
</template>

<style lang="less">
.loop-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
</style>
