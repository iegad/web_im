<template>
  <div id="app">
    <!-- 连接 -->
    <el-row class="row">
      <el-col :span="3" class="col">
        <el-select v-model="wsUrl" placeholder="请选择网关">
          <el-option
            v-for="item in gatewayList"
            :key="item.id"
            :label="item.id"
            :value="item.endpoint">
            <span style="float: left">{{ item.id }}</span>
          </el-option>
        </el-select>
      </el-col>
      <el-col :span="1">
        <el-button type="primary" :loading="loading" @click="doConnect">{{isConnected ? '断开连接' : '连接'}}</el-button>
      </el-col>
    </el-row>
    <!-- 输入 -->
    <el-row class="row" v-if="isConnected">
      <hr />
      <el-col :span="4" class="col">
      </el-col>
    </el-row>
    <!-- 发送按钮 -->
    <el-row class="row" v-if="isConnected">
    </el-row>
    <!-- 消息内容 -->
    <el-row class="row content" v-if="isConnected">
    </el-row>
  </div>
</template>

<script>
import pb from '@/pb/00_package_pb.js'
import axios from 'axios'

export default {
  name: 'App',
  data () {
    return {
      gatewayList: [],
      isConnected: false,
      wsUrl: '',
      loading: false
    }
  },
  created () {
    var this_ = this
    axios.get('http://127.0.0.1/cgi/get_ws_gateway_list').then(resp => {
      if (resp.status === 200 && resp.data.code === 0) {
        console.log(resp.data.data)
        this_.gatewayList = resp.data.data
      }
    }).catch(err => {
      console.log(err)
    })
  },
  methods: {
    rowColor ({ row, rowIndex }) {
      if (this.messages[rowIndex].direction % 2 === 0) {
        return 'recv-row'
      } else {
        return 'send-row'
      }
    },
    doClear () {
      this.messages = []
    },
    doConnect () {
      if (this.isConnected) {
        this.disconnect()
      } else {
        this.connect()
      }
    },
    disconnect () {
      this.ws.close()
    },
    connect () {
      var this_ = this
      var ws = new WebSocket(`ws://${this.wsUrl.trim()}`)
      ws.binaryType = 'arraybuffer'

      ws.onerror = function (e, err) {
        this_.$message({
          message: `连接 ${this_.wsUrl} 失败`,
          type: 'error'
        })
      }

      ws.onopen = function () {
        this_.isConnected = true
        this_.$message({
          message: `连接 ${this_.wsUrl} 成功`,
          type: 'success'
        })
      }

      ws.onclose = function (ev) {
        if (!this_.isConnected) {
          return
        }
        this_.isConnected = false
        this_.messages = []
        this_.loading = false
        this_.$message({
          message: `断开连接 ${this_.wsUrl} 成功`,
          type: 'success'
        })
      }

      ws.onmessage = function (ev) {
        var msg = pb.Message.deserializeBinary(ev.data)
        var body = msg.getBody()
        var router = msg.getRouter()
        var txt = ''
        if (body.getData().length > 0) {
          txt = new TextDecoder('utf-8').decode(body.getData())
        }
        if (body.getMid() < pb.MessageID.OK) {
          this_.$message({
            message: `错误: ${body.getMid()}`,
            type: 'error'
          })
          this_.loading = false
          return
        }
        this_.messages.unshift({
          direction: 2,
          time: this_.$moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss.SSS'),
          mid: body.getMid(),
          data: txt,
          idempotent: body.getIdempotent(),
          checkCode: body.getCheckcode(),
          mount: router.getMount(),
          from: router.getFrom(),
          to: router.getToList()[0]
        })
        if (this_.batch) {
          if (--this_.batchNum === 0) {
            this_.loading = false
          }
        } else {
          this_.loading = false
        }
      }
      this.ws = ws
    },
    doSend () {
      var this_ = this

      // message body
      var data = new TextEncoder().encode(this_.msg.data)
      var body = new pb.MessageBody()
      body.setMid(this_.msg.mid)
      body.setData(data)
      body.setCheckcode(data[0] ^ data[data.length - 1])
      body.setIdempotent(new Date().getTime())

      // router
      var router = new pb.Router()
      router.setToList([this_.msg.to])

      // message
      var msg = new pb.Message()
      msg.setBody(body)
      msg.setRouter(router)
      var rbuf = msg.serializeBinary()

      if (this_.batch) {
        for (let i = 0; i < this_.batchNum; i++) {
          this_.loading = true
          this_.ws.send(rbuf)
          this_.messages.unshift({
            direction: 1,
            time: this_.$moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss.SSS'),
            mid: body.getMid(),
            data: this_.msg.data,
            idempotent: body.getIdempotent(),
            checkCode: body.getCheckcode(),
            mount: '',
            from: '',
            to: router.getToList()[0]
          })
        }
      } else {
        this_.loading = true
        this_.ws.send(rbuf)
        this_.messages.unshift({
          direction: 1,
          time: this_.$moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss.SSS'),
          mid: body.getMid(),
          data: this_.msg.data,
          idempotent: body.getIdempotent(),
          checkCode: body.getCheckcode(),
          mount: '',
          from: '',
          to: router.getToList()[0]
        })
      }
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
.row {
  margin: 10px;
}
.col {
  margin-left: 10px;
}
.content {
  background-color: #aaa;
}
.el-table .recv-row {
  background: #bffdc3;
}
.el-table .send-row {
  background: #bfffff;
}
</style>
