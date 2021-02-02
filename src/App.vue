<template>
  <div id="app">
    <!-- 登录 -->
    <el-row class="row" v-if="!isConnected">
      <el-col :span="2" class="col">
        <el-input v-model="user.userID" :disabled="user.signed" placeholder="请输入UserID"></el-input>
      </el-col>
      <el-col :span="2" class="col">
        <el-input v-model="user.vcode" disabled placeholder="请输入验证码"></el-input>
      </el-col>
      <el-col :span="1" v-if="user.vcode.length===0">
        <el-button type="primary" @click="doGetVCode">获取验证码</el-button>
      </el-col>
      <el-col :span="1" v-else>
        <div v-if="!user.signed"><el-button type="primary" @click="doUserLogin">登录</el-button></div>
      </el-col>
    </el-row>
    <!-- 连接 -->
    <el-row class="row" v-if="user.token.length===36">
      <el-col :span="3" class="col">
        <el-select v-model="host" :disabled="isConnected" placeholder="请选择网关">
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
    <!-- 消息测试 -->
    <el-row class="row" v-if="isConnected">
      <el-col :span="2">
        <el-input disabled v-model="user.userID"></el-input>
      </el-col>
      <el-col :span="2" class="col">
        <el-select v-model="ctt" placeholder="请选择发送目标类型">
          <el-option
            v-for="item in chatToTypeList"
            :key="item.id"
            :label="item.value"
            :value="item.id">
            <span style="float: left">{{ item.value }}</span>
          </el-option>
        </el-select>
      </el-col>
      <el-col :span="8" class="col">
        <el-input placeholder="消息内容" v-model="content"></el-input>
      </el-col>
      <el-col :span="2" class="col">
        <el-input placeholder="接收ID" v-model="toId"></el-input>
      </el-col>
      <el-col :span="2" class="col">
        <el-button type="success" @click="doSendMessage">发送</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Engine from '@/engine/engine.js'
import axios from 'axios'

var userInfo = {
  userID: '10001',
  token: '',
  macAddr: 'AABBCCEEFF00',
  deviceCode: 'windows10',
  signed: false,
  vcode: ''
}

export default {
  name: 'App',
  data () {
    return {
      gatewayList: [],
      engine: null,
      user: userInfo,
      loading: false,
      isConnected: false,
      host: '',
      chatToTypeList: [
        {id: 1, value: '个人'},
        {id: 2, value: '群组'},
        {id: 3, value: '频道'},
        {id: 4, value: '所有人'}
      ],
      ctt: 1,
      content: '',
      toId: 0
    }
  },
  methods: {
    doConnect () {
      if (this.isConnected) {
        this.disconnect()
      } else {
        this.connect()
      }
    },
    disconnect () {
      this.engine.disconnect()
    },
    connect () {
      var this_ = this
      this_.engine = new Engine({
        host: this_.host,
        router: '/',
        openHandler: function (ev) {
          this_.$message({
            message: '连接成功',
            type: 'success'
          })
          this_.isConnected = true
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
        }
      })
      this_.engine.connect(this_.user).then(engine => {
        this_.$message({
          message: '连接网关成功',
          type: 'success'
        })
      }).catch(err => {
        this_.$message({
          message: err.message,
          type: 'error'
        })
      })
    },
    doGetVCode () {
      var this_ = this
      axios.post('http://192.168.8.234:8080/cgi/get_validate_code', {
        'phoneNum': this_.user.userID
      }).then(rsp => {
        if (rsp.status !== 200) {
          return Promise.reject(new Error('请求服务异常'))
        }

        if (rsp.data.code !== 0) {
          return Promise.reject(new Error(rsp.data.error))
        }

        this_.user.vcode = rsp.data.data
        this_.$message({
          message: '获取验证码成功',
          type: 'success'
        })
      }).catch(err => {
        this_.$message({
          message: err.message,
          type: 'error'
        })
      })
    },
    doUserLogin () {
      var this_ = this
      axios.post('http://192.168.8.234:8080/cgi/user_login', {
        'phoneNum': this_.user.userID,
        'vcode': this_.user.vcode,
        'macAddr': this_.user.macAddr,
        'deviceCode': this_.user.deviceCode
      }).then(ret => {
        if (ret.status !== 200) {
          return Promise.reject(new Error('网络异常, 请稍后再试'))
        }

        if (ret.data === undefined || ret.data === null) {
          return Promise.reject(new Error('请求服务异常, 请稍后再试'))
        }

        return Promise.resolve(ret.data)
      }).then(rsp => {
        if (rsp.code !== 0) {
          return Promise.reject(new Error(rsp.error))
        }

        this_.user.token = rsp.data.token
        this_.$message({
          message: '登录成功',
          type: 'success'
        })

        return Promise.resolve('http://192.168.8.234:8080/cgi/get_ws_gateway_list')
      }).then(url => {
        var this_ = this
        axios.get(url).then(resp => {
          if (resp.status === 200 && resp.data.code === 0) {
            this_.gatewayList = resp.data.data
          }
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
    doSendMessage () {
      if (this.content.length === 0 || this.toId.length === 0) {
        this.$message({
          message: '信息不全',
          type: 'warning'
        })
        return
      }

      this.engine.chatMessage({
        from: this.user.userID,
        ctt: this.ctt,
        content: this.content,
        to: this.toId
      })
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
