<template>
  <div id="login">
    <div class="container">
      <div class="brand-logo"></div>
      <div class="brand-title">TENET</div>
      <div style="margin-top:33px">
        <el-form :model="loginForm" :rules="rules" ref="loginForm">
          <el-form-item prop="phoneNum" style="width:270px">
            <el-input placeholder="手机号" v-model="loginForm.phoneNum"></el-input>
          </el-form-item>
          <el-form-item prop="vcode" style="width:270px">
            <el-input placeholder="验证码" style="margin-top:3px" maxlength="5" v-model="loginForm.vcode">
              <el-button slot="append" style="display:block" @click="btnGetVCode">{{ vcodeTimeout === 300 ? '获取验证码' : vcodeTimeout + "(s)"}}</el-button>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="btnLogin('loginForm')">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api/api.js'

export default {
  name: 'Login',
  data () {
    return {
      vcodeTimeout: 300,
      loginForm: {
        phoneNum: '',
        vcode: '',
        gwEndpoint: ''
      },
      rules: {
        phoneNum: [
          { required: true, message: '请输入正确的手机号', trigger: 'blur' },
          { min: 6, max: 15, message: '长度在 6 到 15 个字符', trigger: 'blur' }
        ],
        vcode: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          { min: 5, max: 5, message: '请输入5位有效的验证码', trigger: 'blur' }
        ]
      }
    }
  },
  created () {
    var this_ = this

    var userID = localStorage.getItem('userID')
    var token = localStorage.getItem('token')
    var macAddr = localStorage.getItem('macAddr')
    var deviceCode = localStorage.getItem('deviceCode')

    if (!isNaN(Number(userID)) && String(token).length === 36 && String(macAddr).length > 0 && String(deviceCode).length > 0) {
      this_.$router.push('/')
    }
  },
  methods: {
    btnGetVCode () {
      var this_ = this

      if (this_.vcodeTimeout !== 300) {
        return
      }

      this_.vcodeTimeout--
      if (this_.loginForm.phoneNum.length < 6 || this_.loginForm.phoneNum.length > 15) {
        this_.$message({
          message: '手机号错误',
          type: 'error'
        })
      } else {
        api.getVCode(this_.loginForm.phoneNum).then(vcode => {
          this_.loginForm.vcode = vcode
          var interval = setInterval(() => {
            this_.vcodeTimeout--
            if (this_.vcodeTimeout <= 0) {
              clearInterval(interval)
              console.log('interval is clear')
              this_.vcodeTimeout = 300
            }
          }, 1000)
        }).catch(err => {
          this_.$message({
            message: err.message,
            type: 'error'
          })
        })
      }
    },
    btnLogin (loginForm) {
      var this_ = this
      this_.$refs[loginForm].validate(valid => {
        if (valid) {
          api.userLogin({
            phoneNum: this_.loginForm.phoneNum,
            vcode: this_.loginForm.vcode,
            macAddr: '00110022',
            deviceCode: 'windows10'
          }).then(data => {
            localStorage.setItem('userID', data.userID)
            localStorage.setItem('token', data.token)
            localStorage.setItem('macAddr', data.macAddr)
            localStorage.setItem('deviceCode', data.deviceCode)
            this_.$router.push('/')
          }).catch(err => {
            this_.$message({
              message: err.message,
              type: 'error'
            })
          })
        }
      })
    }
  }
}
</script>

<style scoped>
#login {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

body {
  width: 100vw;
  height: 100vh;
  background: #ecf0f3;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  place-items: center;
  overflow: hidden;
  font-family: poppins;
}

.container {
  position: relative;
  margin: auto;
  display: block;
  width: 350px;
  height: 500px;
  border-radius: 20px;
  padding: 40px;
  box-sizing: border-box;
  background: #ecf0f3;
  box-shadow: 14px 14px 20px #cbced1, -14px -14px 20px white;
}

.brand-logo {
  height: 100px;
  width: 100px;
  background: url("https://img.icons8.com/color/100/000000/twitter--v2.png");
  margin: auto;
  border-radius: 50%;
  box-sizing: border-box;
}

.brand-title {
  margin-top: 10px;
  font-weight: 900;
  font-size: 1.8rem;
  color: #1DA1F2;
  letter-spacing: 1px;
}

label, input, button {
  display: block;
  width: 100%;
  border: none;
  outline: none;
  box-sizing: border-box;
}

label:nth-of-type(2) {
  margin-top: 12px;
}

input::placeholder {
  color: gray;
}

input {
  background: #ecf0f3;
  padding: 10px;
  padding-left: 20px;
  height: 50px;
  font-size: 14px;
  border-radius: 50px;
  box-shadow: inset 6px 6px 6px #cbced1, inset -6px -6px 6px white;
}

button {
  background: #1DA1F2;
  height: 40px;
  border-radius: 20px;
  cursor: pointer;
  transition: 0.5s;
}

button:hover {
  box-shadow: none;
}

a {
  position: absolute;
  font-size: 8px;
  bottom: 4px;
  right: 4px;
  text-decoration: none;
  color: black;
  background: yellow;
  border-radius: 10px;
  padding: 2px;
}

h1 {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
