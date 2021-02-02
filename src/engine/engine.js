import pb from '@/pb/00_package_pb.js'
import chat from '@/pb/01_chat_pb.js'

export default class Engine {
  constructor ({host, router, openHandler, errorHandler, closeHandler}) {
    this.host = host
    this.router = router
    this.ws = null
    this.connected = false
    this.closeHandler = closeHandler
    this.errorHandler = errorHandler
    this.openHandler = openHandler
    this.activeTime = 0
    this.interval = null
  }

  disconnect () {
    if (this.ws !== null && this.connected) {
      this.ws.close()
    }
  }

  connect (user) {
    var err = ''
    var this_ = this
    do {
      this_.ws = new WebSocket(`ws://${this_.host}${this_.router}`)

      if (this_.ws === undefined || this_.ws === null) {
        err = `connect ws://${this_.host}${this_.router} failed`
        break
      }

      this_.ws.onopen = (ev) => {
        this_.openHandler()
        this_.connected = true
        this_.ws.ping = this_.ping
        this_.userSignIn(user)
      }

      this_.ws.onclose = (ev) => {
        if (this_.interval !== null) {
          clearInterval(this_.interval)
          this_.interval = null
        }
        this_.closeHandler(ev)
        this_.connected = false
      }

      this_.ws.onerror = (ev, err) => {
        this_.errorHandler(ev, err)
      }

      this_.ws.onmessage = this_.onMessage
      this_.ws.binaryType = 'arraybuffer'
    } while (0)

    if (err.length > 0) {
      return Promise.reject(new Error(err))
    }

    return Promise.resolve(this_)
  }

  userSignIn ({userID, token, macAddr, deviceCode}) {
    var req = new pb.UserSignInReq()
    req.setUserid(userID)
    req.setToken(token)
    req.setMacaddr(macAddr)
    req.setDevicecode(deviceCode)

    var data = req.serializeBinary()
    var pack = new pb.Package()
    pack.setPid(pb.PackageID.PID_USERSIGNINREQ)
    pack.setData(data)
    pack.setCheckcode(data[0] ^ data[data.length - 1])
    pack.setIdempotent(new Date().getTime())
    var pbuff = pack.serializeBinary()
    this.ws.send(pbuff)
  }

  onError (ev, err) {
    this.errorHandler(ev, err)
  }

  chatReq ({from, ctt, content, to}) {
    var req = new chat.ChatReq()
    req.setCtt(ctt)
    req.setCmt(1)
    req.setTo(to)
    req.setFrom(from)
    req.setContent(content)
    var data = req.serializeBinary()

    var router = new pb.Router()
    router.setToservice('chat')

    var pack = new pb.Package()
    pack.setPid(pb.PackageID.PID_REQ)
    pack.setData(data)
    pack.setMid(chat.ChatMessage.MID_CHATREQ)
    pack.setCheckcode(data[0] ^ data[data.length - 1])
    pack.setIdempotent(new Date().getTime())
    pack.setRouter(router)

    var pbuff = pack.serializeBinary()
    this.ws.send(pbuff)
  }

  onMessage (ev) {
    var this_ = this
    var pack = pb.Package.deserializeBinary(ev.data)
    console.log(pack.toObject())
    switch (pack.getPid()) {
      case pb.PackageID.PID_USERSIGNINRSP:
        var rsp = pb.UserSignInRsp.deserializeBinary(pack.getData())
        if (rsp.getCode() === 0) {
          this_.activeTime = pack.getIdempotent()
          this_.interval = setInterval(() => {
            var tnow = new Date().getTime()
            if (tnow - this_.activeTime >= 50000) {
              var pack = new pb.Package()
              pack.setPid(pb.PackageID.PID_PING)
              pack.setIdempotent(tnow)
              var pbuff = pack.serializeBinary()
              this_.send(pbuff)
            }
          }, 50000)
        }
        break

      case pb.PackageID.PID_PONG:
        this_.activeTime = pack.getIdempotent()
        break

      case pb.PackageID.PID_ACK:
        console.log(pack.getIdempotent())
        break

      case pb.PackageID.PID_NOTIFY:
        switch (pack.getMid()) {
          case chat.ChatMessage.MID_CHATREQ:
            var req = chat.ChatReq.deserializeBinary(pack.getData())
            console.log(req.toObject())
        }
    }
  }
}
