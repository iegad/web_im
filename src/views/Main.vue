<template>
  <el-container class="container">
    <el-aside width="80px" class="tools">
      <span>{{from}}</span>
      <el-button class="avator"></el-button>
      <a href="javascript:void(0);"
        style="margin-left:10px;margin-top:10px;text-decoration:none;font-size:35px;color:#EEE"
        class="tag el-icon-circle-plus-outline"
        @click="btnAddChat">
      </a>
    </el-aside>
    <el-aside width="260px" class="list">
      <el-button class="chat" v-for="(chatID, i) in chatList" v-bind:key="i" shadow="hover" @click="btnChat(i)">
        {{ chatID }}
      </el-button>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span><a href="javascript:void(0)" style="text-decoration:none;font-size:25px;color:#323">{{ to === 0 ? '' : to }}</a></span>
      </el-header>
      <el-main class="main">
        <!-- <el-row>
          <div class="send">你好<div class="arrow"></div></div>
        </el-row>
        <el-row>
          <div class="recv">We can see a short distance ahead<div class="arrow"></div></div>
        </el-row> -->
        <el-row v-for="(msg, i) in chatHistory" v-bind:key="i">
          <div :class="msg.from === from ? 'send' : 'recv'">{{msg.content}}<div class="arrow"></div></div>
        </el-row>
      </el-main>
      <el-footer class="footer" v-if="to > 0">
          <a href="javascript:void(0);" class="el-icon-paperclip tag"></a>
          <a href="javascript:void(0);" class="el-icon-star-off tag"></a>
          <el-input v-model="content" @keypress.native.enter="btnSend"></el-input>
          <el-button type="success" style="margin-left:5px;" @click="btnSend">发送</el-button>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script>
import api from '@/api/api.js'
import Engine from '@/engine/engine.js'
import pb from '@/pb/00_package_pb.js'
import chat from '@/pb/01_chat_pb.js'

export default {
  name: 'Main',
  data () {
    return {
      pingInterval: null,
      engine: null,
      isConnected: false,
      to: 0,
      from: 0,
      content: '',
      chatList: [],
      chatHistoryMap: new Map(), // key => chatID, value => []message
      chatHistory: []
    }
  },
  created () {
    var this_ = this
    var userID = localStorage.getItem('userID')
    var token = localStorage.getItem('token')
    var macAddr = localStorage.getItem('macAddr')
    var deviceCode = localStorage.getItem('deviceCode')

    if (isNaN(Number(userID)) || String(token).length !== 36 || String(macAddr).length === 0 || String(deviceCode).length === 0) {
      this.$router.push('/login')
      return
    }

    api.getGatewayList().then(list => {
      if (list.length === 0) {
        return Promise.reject(new Error('无可用的网关'))
      }

      var host = list[new Date().getTime() % list.length].endpoint
      this_.engine = new Engine({
        host: host,
        router: '/',
        openHandler: function (ev) {
          this_.$message({
            message: '连接成功',
            type: 'success'
          })
          this_.isConnected = true
          this_.from = userID
        },
        errorHandler: function (ev, err) {
          this_.$message({
            message: err.message,
            type: 'error'
          })
        },
        closeHandler: function (ev) {
          this_.$message({
            message: '连接已断开',
            type: 'warning'
          })
          this_.isConnected = false
          localStorage.removeItem('userID')
          localStorage.removeItem('token')
          localStorage.removeItem('macAddr')
          localStorage.removeItem('deviceCode')
          if (this_.pingInterval !== null) {
            clearInterval(this_.pingInterval)
          }
          this_.$router.push('/login')
        },
        messageHandler: function (ev) {
          var pack = pb.Package.deserializeBinary(ev.data)
          this_.activeTime = pack.getIdempotent()
          switch (pack.getPid()) {
            case pb.PackageID.PID_USERSIGNINRSP:
              var rsp = pb.UserSignInRsp.deserializeBinary(pack.getData())
              if (rsp.getCode() === 0) {
                this_.pingInterval = setInterval(() => {
                  var tnow = new Date().getTime()
                  if (tnow - this_.activeTime >= 30000) {
                    this_.engine.ping(tnow)
                  }
                }, 5000)
              } else {
                this_.engine.disconnect()
              }
              break

            case pb.PackageID.PID_PONG:
              console.log('PONG => ', pack.toObject())
              break

            case pb.PackageID.PID_ACK:
              console.log('ACK => ', pack.toObject())
              break

            case pb.PackageID.PID_KICKUSERREQ:
              var txt = new TextDecoder('utf-8').decode(pack.getData())
              this_.$message({
                message: txt,
                type: 'error'
              })
              this_.engine.disconnect()
              break

            case pb.PackageID.PID_NOTIFY:
              switch (pack.getMid()) {
                case chat.ChatMessageID.MID_CHATMESSAGE:
                  var req = chat.ChatMessage.deserializeBinary(pack.getData())
                  this_.chatHistory.push(JSON.parse(JSON.stringify(req.toObject())))
                  break
              }
              break
          }
        }
      })

      this_.engine.connect({
        userID: userID,
        token: token,
        macAddr: macAddr,
        deviceCode: deviceCode
      }).catch(err => {
        this_.$message({
          message: err.message,
          type: 'error'
        })
      })
    }).catch(err => {
      this_.$message({
        message: err.message,
        type: 'error'
      })
    })
  },
  methods: {
    btnAddChat () {
      var this_ = this
      this_.$prompt('请输入对话ID', '添加对话', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPattern: /^[1-9][0-9]{5,14}$/,
        inputErrorMessage: '请输入正确的对话ID, 6-15位数字'
      }).then(({ value }) => {
        this_.chatList.push(value)
        this_.chatHistoryMap.set(value, [])
        this_.to = value
        this_.chatHistory = []
      }).catch(() => {
        console.log('取消')
      })
    },
    btnChat (idx) {
      this.to = this.chatList[idx]
    },
    btnSend () {
      var this_ = this
      var msg = this_.engine.chatMessage({
        from: this_.from,
        ctt: 1,
        content: this_.content,
        to: this_.to
      })
      var tmp = JSON.parse(JSON.stringify(msg))
      this_.chatHistory.push(tmp)
      this_.content = ''
    },
    txtChange () {

    }
  }
}
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.tag {
  width: 40px;
  height: 40px;
  font-size: 30px;
  text-decoration: none;
  margin-top: 8px;
  margin-right:10px;
}

.chat-send {
  float: right;
  width: 800px;
}

.chat-recv {
  float: left;
}

.chat {
  width: 90%;
  height: 50px;
  margin: 5px;
  background-color: #DDD;
  text-align: center;
}

.avator {
  margin-top: 10px;
  height: 60px;
  width: 60px;
}

.tools {
  background-color: #242424;
  color: #EEE;
  text-align: center;
}

.list {
  background-color: #CCC;
  color: #EEE;
  text-align: center;
}

.header {
  background-color: #EEE;
  border-bottom-width:1px;
  border-bottom-style:solid;
  border-bottom-color:#BBB;
  text-align: left;
  align-items: center;
  display: flex;
}

.footer {
  background-color: #EEE;
  border-top-width:1px;
  border-top-style:solid;
  border-top-color:#BBB;
  align-items: center;
  display: flex;
}

.main {
  background-color: #EEE;
  color: #333;
  text-align: center;
}

.send {
  position:relative;
  padding: 5px;
  background:#F8C301;
  border-radius:5px; /* 圆角 */
  margin-top: 30px;
  margin-left: 200px;
  max-width: 600px;
  text-align: left;
  width: fit-content;
  width: -webkit-fit-content;
  width: -moz-fit-content;
  word-wrap: break-word;
}

.send .arrow {
  position:absolute;
  top:8px;
  right:-16px; /* 圆角的位置需要细心调试哦 */
  width:0;
  height:0;
  font-size:0;
  border:solid 8px;
  border-color:#EEE #EEE #EEE #F8C301;
}

.recv {
  position:relative;
  padding: 5px;
  background:#FFF;
  border-radius:5px; /* 圆角 */
  margin-top: 30px;
  margin-right: 200px;
  max-width: 600px;
  text-align: left;
  width: fit-content;
  width: -webkit-fit-content;
  width: -moz-fit-content;
  word-wrap: break-word;
}

.recv .arrow {
  position:absolute;
  top:8px;
  left:-16px; /* 圆角的位置需要细心调试哦 */
  width:0;
  height:0;
  font-size:0;
  border:solid 8px;
  border-color:#EEE #FFF #EEE #EEE;
}

.container {
  margin: auto;
  width: 1200px;
  height: 768px;
  border-radius: 2px;
  box-sizing: border-box;
  background: #ecf0f3;
  box-shadow: 14px 14px 20px #cbced1, -14px -14px 20px white;
}
</style>
