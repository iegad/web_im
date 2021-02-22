<template>
  <div id="live">
    <video id="videoElement" class="vjs-tech" controls autoplay muted width="1280" height="768"></video>
  </div>
</template>

<script>
import flvjs from 'flv.js'

export default {
  name: 'Live',

  data () {
    return {
      player: null
    }
  },

  beforeDestroy () {
    if (this.player !== null) {
      this.player.pause()
      this.player.unload()
      this.player.detachMediaElement()
      this.player.destroy()
    }
  },

  mounted () {
    var this_ = this
    if (flvjs.isSupported()) {
      var videoElement = document.getElementById('videoElement')
      this_.player = flvjs.createPlayer({
        type: 'flv',
        isLive: true,
        hasAudio: true,
        enableStashBuffer: false,
        enableWorker: true,
        stashInitialSize: 128,
        isAutoPlay: true,
        isContinue: true,
        lazyLoad: true,
        url: 'http://192.168.10.21:7001/live/movie.flv'
      })

      this_.player.attachMediaElement(videoElement)
      this_.player.load()
      this_.player.play()
    }
  }
}

</script>

<style scoped>
.vjs-tech {
  /* pointer-events: none; */
}
</style>
