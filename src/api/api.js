import axios from 'axios'

const HOST = '192.168.8.234:8080'

async function getGatewayList () {
  try {
    var ret = await axios.get(`http://${HOST}/cgi/get_ws_gateway_list`)
    if (ret.status !== 200) {
      return Promise.reject(new Error('请检查网络后刷新页面'))
    }

    if (ret.data.code !== 0) {
      return Promise.reject(new Error(ret.data.error))
    }

    return Promise.resolve(ret.data.data)
  } catch (err) {
    return Promise.reject(err)
  }
}

async function getVCode (phoneNum) {
  try {
    var ret = await axios.post(`http://${HOST}/cgi/get_validate_code`, {'phoneNum': phoneNum})
    if (ret.status !== 200) {
      return Promise.reject(new Error('请检查网络后刷新页面'))
    }

    if (ret.data.code !== 0) {
      return Promise.reject(new Error(ret.data.error))
    }

    return Promise.resolve(ret.data.data)
  } catch (err) {
    return Promise.reject(err)
  }
}

async function userLogin ({phoneNum, vcode, macAddr, deviceCode}) {
  try {
    var ret = await axios.post(`http://${HOST}/cgi/user_login`, {
      'phoneNum': phoneNum,
      'vcode': vcode,
      'macAddr': macAddr,
      'deviceCode': deviceCode
    })
    if (ret.status !== 200) {
      return Promise.reject(new Error('网络异常'))
    }

    if (ret.data.code !== 0) {
      return Promise.reject(new Error(ret.data.error))
    }

    return Promise.resolve({
      userID: ret.data.data.userID,
      token: ret.data.data.token,
      macAddr: macAddr,
      deviceCode: deviceCode
    })
  } catch (err) {
    return Promise.reject(err)
  }
}

export default {
  getGatewayList: getGatewayList,
  getVCode: getVCode,
  userLogin: userLogin
}
