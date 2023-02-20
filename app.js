
App({

    userInfo: {
        createtime: null,
        openId: null,
        appkey: null,
    },
    userQuota: {
        updatetime: null,
        cnt: null,
        openId: null,
    },
    maxFreeCnt: 5,
    /**
     * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
     */
    onLaunch () {
        wx.cloud.init({
            env:'cloud1-4gv4k6tha1359b2c',
            traceUser:true
        })
        wx.cloud.init({
            env:'cloud1-4gv4k6tha1359b2c',
            traceUser:true
        })
        this.saveUserInfoIfNotExist()
    },
  
    /**
     * 当小程序启动，或从后台进入前台显示，会触发 onShow
     */
    onShow (options) {
      
    },
  
    /**
     * 当小程序从前台进入后台，会触发 onHide
     */
    onHide () {
      
    },
  
    /**
     * 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
     */
    onError (msg) {
      
    },

    async saveUserInfoIfNotExist () {
        const db = wx.cloud.database({
            env:'cloud1-4gv4k6tha1359b2c',
        })
        var userInfo = this.userInfo
        wx.cloud.callFunction({
            name: 'getUserOpenId',
            complete: res => {
                // console.info(res.result)
                userInfo.openId = res.result.userInfo.openId;
                userInfo.appId = res.result.userInfo.appId;

                wx.cloud.callContainer({
                    "config": {
                      "env": "prod-6gyeup90093341a8"
                    },
                    "path": "/TCGMGR/aicode/getUser",
                    "header": {
                      "X-WX-SERVICE": "springboot-xg02"
                    },
                    "method": "GET",
                    "data": {
                      "openId": userInfo.openId
                    },
                    success: function(res){
                        console.info(res)
                        let statusCode = res.statusCode
                        if(200===statusCode){
                            let response = res.data
                            let code = response.code
                            if(10200===code){
                                // 账号已存在
                                console.info('账号存在')
                            }
                            if(10300===code){
                                console.info('账号不存在')
                                wx.cloud.callContainer({
                                    "config": {
                                      "env": "prod-6gyeup90093341a8"
                                    },
                                    "path": "/TCGMGR/aicode/register",
                                    "header": {
                                      "X-WX-SERVICE": "springboot-xg02"
                                    },
                                    "method": "POST",
                                    "data": {
                                        "openid": userInfo.openId,
                                        "appid": userInfo.appId,
                                      },
                                    success: function(res){
                                        console.info(res)
                                    }
                                })
                            }
                        }
                    },
                    fail: function(res){
                        console.info(res)
                    }
                })
            }
        })
    }
  })
  