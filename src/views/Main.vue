<template>
  <el-container class="container">
    <el-aside width="80px" class="tools">
      <el-button class="avator"></el-button>
      <a href="javascript:void(0);" style="margin-left:10px;margin-top:10px;text-decoration:none;font-size:35px;color:#EEE" class="tag el-icon-circle-plus-outline"></a>
    </el-aside>
    <el-aside width="260px" class="list">list</el-aside>
    <el-container>
      <el-header class="header">
        <span><a href="javascript:void(0)" style="text-decoration:none;font-size:25px;color:#323">{{ toID === 0 ? '' : toID }}</a></span>
      </el-header>
      <el-main class="main">
        <!-- TODO: 添加聊天气泡 -->
      </el-main>
      <el-footer class="footer">
          <a href="javascript:void(0);" class="el-icon-paperclip tag"></a>
          <a href="javascript:void(0);" class="el-icon-star-off tag"></a>
          <el-input v-model="content"></el-input>
          <el-button type="success" style="margin-left:5px;">发送</el-button>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script>
// import api from '@/api/api.js'
// import Engine from '@/engine/engine.js'

export default {
  name: 'Main',
  data () {
    return {
      engine: null,
      isConnected: false,
      toID: 100000,
      from: 0,
      content: ''
    }
  },
  // created () {
  //   var this_ = this
  //   var userID = localStorage.getItem('userID')
  //   var token = localStorage.getItem('token')
  //   var macAddr = localStorage.getItem('macAddr')
  //   var deviceCode = localStorage.getItem('deviceCode')

  //   if (isNaN(Number(userID)) || String(token).length !== 36 || String(macAddr).length === 0 || String(deviceCode).length === 0) {
  //     this.$router.push('/login')
  //     return
  //   }

  //   api.getGatewayList().then(list => {
  //     if (list.length === 0) {
  //       return Promise.reject(new Error('无可用的网关'))
  //     }

  //     var host = list[new Date().getTime() % list.length].endpoint
  //     this_.engine = new Engine({
  //       host: host,
  //       router: '/',
  //       openHandler: function (ev) {
  //         this_.$message({
  //           message: '连接成功',
  //           type: 'success'
  //         })
  //         this_.isConnected = true
  //         this_.from = userID
  //       },
  //       errorHandler: function (ev, err) {
  //         this_.$message({
  //           message: err.message,
  //           type: 'error'
  //         })
  //       },
  //       closeHandler: function (ev) {
  //         this_.$message({
  //           message: '连接已断开',
  //           type: 'warning'
  //         })
  //         this_.isConnected = false
  //         localStorage.removeItem('userID')
  //         localStorage.removeItem('token')
  //         localStorage.removeItem('macAddr')
  //         localStorage.removeItem('deviceCode')
  //       }
  //     })

  //     this_.engine.connect({
  //       userID: userID,
  //       token: token,
  //       macAddr: macAddr,
  //       deviceCode: deviceCode
  //     }).catch(err => {
  //       this_.$message({
  //         message: err.message,
  //         type: 'error'
  //       })
  //     })
  //   }).catch(err => {
  //     this_.$message({
  //       message: err.message,
  //       type: 'error'
  //     })
  //   })
  // },
  methods: {
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
  line-height: 200px;
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
  line-height: 160px;
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
