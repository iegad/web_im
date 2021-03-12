<template>
  <div id="live">
    <video id="videoElement" class="vjs-tech" controls autoplay muted width="1280" height="768"></video>
  </div>
</template>

<script>
import flvjs from 'flv.js'
import {encrypt, decrypt, PrivateKey} from 'eciesjs'

export default {
  name: 'Live',

  created () {
    const data = Buffer.from('hello world!!!')

    const k1 = PrivateKey.fromHex('99095d3fe23093e2a013a6ae65d6969e3993cf48444120fef1ac798ce3016045')
    console.log(k1.toHex())
    console.log(k1.publicKey.toHex())

    var str = encrypt(k1.publicKey.toHex(), data)
    console.log(str.toString('hex'))
    var dst = decrypt(k1.toHex(), str)
    console.log(dst.toString())
  },

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
</style>
