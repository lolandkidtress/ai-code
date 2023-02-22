// pages/index/index.js
var app = getApp()
Page({

    ...getApp(),

    /**
     * 页面的初始数据
     */
    data: {
        value: null,
        items: [],
        flag: false,
        scrollTop: 0,
        appId: null,
        openId: null,
        invitecode: null,
        showInputInviteCodeText: false,
        showHelpText: false,
        showSourceText: false,
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
    },
  
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        
    },
  
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    handleInput(e) {
        // console.info(e.detail.value)
        this.data.value = e.detail.value
    },

    sendContent() {
        console.info('sendContent');
        const { items, value, scrollTop } = this.data
        if(value === null) {
            wx.showToast({
                title: '请输入内容',
                icon:'none'
            })
            return 
        }
        wx.cloud.callFunction({
            name:"msgSecCheck",
            data:{
              msg: value,
            }
        }).then(res=>{
            console.log(res)
            if(res.result.code === 500) {
                console.log("检查未通过");
                this.setData({ value: null })
                wx.showToast({
                    title: '内容包含敏感词,请重新数据',
                    icon:'none'
                })
                return 
            } else {
                if(value.length < 5) {
                    wx.showToast({
                        title: '输入的问题过于简单',
                        icon:'none'
                    })
                    return
                }
                if(value.length > 40) {
                    wx.showToast({
                        title: '请精简问题到40个字以内',
                        icon:'none'
                    })
                    return
                }
                if (this.data.flag) return
                this.data.flag = true
                items.push({
                    success: 'true',
                    position: 'right',
                    content: value
                })
                items.push({
                    success: 'true',
                    position: 'left',
                    content: ''
                })

                this.setData({ items, value: null, scrollTop: scrollTop + 2000 })
                const his = items.filter(res=> res.position === 'right').map(res => res.content)
                his.pop()
                wx.cloud.callContainer({
                    "config": {
                    "env": app.envId
                    },
                    "path": "/TCGMGR/aicode/doRequest",
                    "header": {
                    "X-WX-SERVICE": app.serviceId,
                    "content-type": "application/json"
                    },
                    "method": "POST",
                    "data": {
                    "openId": app.userInfo.openId,
                    "question": value,
                    "method": "post"
                    }
                }).then(res=>{
                    let item = items.slice(-1)[0]
                    console.info(res)
                    let statusCode = res.statusCode
                    if(200 === statusCode){
                        let response = res.data
                        let code = response.code
                        if(code === 10200) {
                            item.content = res.data.data
                            console.info(item.content)
                            item.success = 'true'
                            this.setData({ items })

                            this.incrQuota()

                        } else if(code === 10600) {
                            item.content = '使用次数已耗尽'
                            item.success = 'quotalimit'
                            this.setData({ items, flag: false })
                        } else {
                            item.content = '服务负载过高,请稍后再试'
                            item.success = 'false'
                            this.setData({ items, flag: false })
                        }
                    } else {
                        let item = items.slice(-1)[0]
                        item.content = '服务器负载过高,请稍后再试'
                        item.success = 'false'
                        this.setData({ items, flag: false })
                    }
                    setTimeout(()=>{
                        this.setData({flag: false, scrollTop: scrollTop + 2000 })
                    })
                }).catch(res=>{
                    console.info(res)
                    let item = items.slice(-1)[0]
                    item.content = '服务器太火爆了,请稍后再试'
                    item.success = 'false'
                    this.setData({ items, flag: false })
                })
            }
        })

        
        

        // this.api.ai.sendQuery({ his, query: value })
        // .then(res=> {
        //     let item = items.slice(-1)[0]
        //     item.content = res.data
        //     item.success = 'true'
        //     this.setData({ items })
        //     setTimeout(()=>{
        //         this.setData({flag: false, scrollTop: scrollTop + 2000 })
        //     })
        // })
        // .catch(res=>{
        //     let item = items.slice(-1)[0]
        //     item.content = '服务器太火爆了,请稍后再试'
        //     item.success = 'false'
        //     this.setData({ items, flag: false })
        // })
    },

    copyContent(e) {
        wx.setClipboardData({
            data: e.currentTarget.dataset.content,
        })
    },
    showSource(e) {
        console.info(e)
        // this.showInputInviteCodeText = true
        this.setData({
            showSourceText:true
        })
        // 清掉对话框
        var that = this
        let items = []
        that.setData({ items, flag: false })
    },
    showHelp(e) {
        console.info(e)
        // this.showInputInviteCodeText = true
        this.setData({
            showHelpText:true
        })
        // 清掉对话框
        var that = this
        let items = []
        that.setData({ items, flag: false })
    },
    showInputCode(e) {
        console.info(e)
        // this.showInputInviteCodeText = true
        this.setData({
            showInputInviteCodeText:true
        })
        // 清掉对话框
        var that = this
        let items = []
        that.setData({ items })
    },
    handleInviteCodeChange(e) {
        this.data.invitecode = e.detail.value
    },
    // 输入的邀请码
    inputCode(e) {
        console.info('inputCode')
        const {invitecode} = this.data
        console.info(invitecode)
        if(!invitecode) {
            return
        }
        var that = this
        wx.cloud.callContainer({
            "config": {
              "env": app.envId
            },
            "path": "/TCGMGR/aicode/inputCode",
            "header": {
              "X-WX-SERVICE": app.serviceId
            },
            "method": "POST",
            "data": {
              "openId": app.userInfo.openId,
              "code": invitecode
            },
            success: function(res){
                console.info(res)
                let statusCode = res.statusCode
                if(200===statusCode){
                    let response = res.data
                    let code = response.code
                    let items = that.data.items
                    items = []
                    if(code === 10200) {
                        console.info('关联成功')
                        items.push({
                            success: 'invitecodesuccess',
                            position: 'left',
                            content: '关联成功'
                        })
                        that.setData({ items ,flag: false })
                    } else if (code === 10600) {
                        items.push({
                            success: 'invitecodedesc',
                            position: 'left',
                            content: '邀请码已超过使用次数'
                        })
                        that.setData({ items, flag: false })
                    } else if (code === 10300) {
                        items.push({
                            success: 'invitecodedesc',
                            position: 'left',
                            content: '邀请码不存在'
                        })
                        that.setData({ items, flag: false })
                    } else {
                        items.push({
                            success: 'invitecodedesc',
                            position: 'left',
                            content: '邀请码错误或者不存在'
                        })
                        that.setData({ items, flag: false })
                    }
                } else {
                    items.push({
                        success: 'invitecodedesc',
                        position: 'left',
                        content: '邀请码错误或者不存在'
                    })
                    that.setData({ items, flag: false })
                }
            },
            fail: function(res){
                console.info(res)
            }
        })
    },
    incrQuota() {
        console.info('incrQuota')
        var that = this
        wx.cloud.callContainer({
            "config": {
              "env": app.envId
            },
            "path": "/TCGMGR/aicode/incrQuota",
            "header": {
              "X-WX-SERVICE": app.serviceId
            },
            "method": "POST",
            "data": {
              "openid": app.userInfo.openId
            },
            success: function(res){
                console.info(res)
            },
            fail: function(res){
                console.info(res)
            }
        })
    },
    getQuota(e) {
        console.info('inviteCode')
        var that = this
        wx.cloud.callContainer({
            "config": {
              "env": app.envId
            },
            "path": "/TCGMGR/aicode/getQuota",
            "header": {
              "X-WX-SERVICE": app.serviceId
            },
            "method": "GET",
            "data": {
              "openId": app.userInfo.openId
            },
            success: function(res){
                console.info(res)
                let statusCode = res.statusCode
                if(200===statusCode){
                    let cnt = res.data.data.cnt
                    let maxcnt = res.data.data.maxcnt
                    let items = []
                    items.push({
                        success: 'quotadesc',
                        position: 'left',
                        content: '您当日已使用:'+cnt+'次'
                    })
                    items.push({
                        success: 'quotadesc',
                        position: 'left',
                        content: '您当日可用:'+maxcnt+'次'
                    })
                    that.setData({ items })
                }
            },
            fail: function(res){
                console.info(res)
            }
        })
    },
    // 显示邀请码
    inviteCode(e) {
        console.info('inviteCode')
        var that = this
        wx.cloud.callContainer({
            "config": {
              "env": app.envId
            },
            "path": "/TCGMGR/aicode/getUser",
            "header": {
              "X-WX-SERVICE": app.serviceId
            },
            "method": "GET",
            "data": {
              "openId": app.userInfo.openId
            },
            success: function(res){
                console.info(res)
                let statusCode = res.statusCode
                if(200===statusCode){
                    let invitecode = res.data.data.invitecode
                    let items = []
                    items.push({
                        success: 'invitecodedesc',
                        position: 'left',
                        content: '您的邀请码如下:'
                    })
                    items.push({
                        success: 'invitecode',
                        position: 'left',
                        content: invitecode
                    })
                    items.push({
                        success: 'invitecodedesc',
                        position: 'left',
                        content: '好友输入邀请码后,您和好友的每日使用次数都将增加10次,最多邀请3人'
                    })
                    that.setData({ items })
                }
            },
            fail: function(res){
                console.info(res)
            }
        })
    },
    getLoad() {
        console.info('getLoad')
        var that = this
        wx.cloud.callContainer({
            "config": {
              "env": app.envId
            },
            "path": "/TCGMGR/aicode/getServerUsability",
            "header": {
              "X-WX-SERVICE": app.serviceId
            },
            "method": "GET",
            "data": {
            },
            success: function(res){
                console.info(res)
                let statusCode = res.statusCode
                if(200===statusCode){
                    let loaddata = res.data.data
                    let items = []
                    items.push({
                        success: '',
                        position: 'left',
                        content: '当前服务器负载为:' + loaddata
                    })
                    that.setData({ items })
                }
            },
            fail: function(res){
                console.info(res)
            }
        })
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },
  
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },
  
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },
  
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },
  
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage(e) {
        const {items} = this.data
        const index = Number(e.target.dataset.index)
        if (index) {
            const title = items[index-1].content
            return {
                title,
            }
        }
    }
  })