// pages/index/index.js
var app = getApp()
Page({

    ...getApp(),

    /**
     * 页面的初始数据
     */
    data: {
        question: null,
        items: [],
        flag: false,
        scrollTop: 0,
        appId: null,
        openId: null,
        invitecode: null,
        showInputInviteCodeText: false,
        showHelpText: false,
        showSourceText: false,
        showProMenuText: false,
        showBuyInfoText: false,
        topicid: null,
        // 调用的接口
        currentApiMode: 'api',
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
    switchApiMode(e) {
        console.info(e)
        this.data.currentApiMode = e.currentTarget.dataset.mode
        console.info(this.data)
        this.setData({currentApiMode: e.currentTarget.dataset.mode})
    },
    handleInput(e) {
        // console.info(e.detail.value)
        this.data.question = e.detail.value
        this.setData({question: e.detail.value})
    },
    clearTopic(e) {
        if(this.data.topicid) {
            wx.cloud.callContainer({
                "config": {
                "env": app.envId
                },
                "path": "/TCGMGR/v1/chat/deleteTopic?id="+this.data.topicid,
                "header": {
                "X-WX-SERVICE": app.serviceId,
                "content-type": "application/json"
                },
                "method": "POST",
                "data": {
                }
            }).then(res=>{
                let statusCode = res.statusCode
                if(200 === statusCode){

                    wx.showToast({
                        title: '记忆已清理,可以重新开始提问呢了',
                        icon:'none'
                    })
                    this.setData({topicid: null})
                }else{
                    item.content = '服务负载过高,请稍后再试'
                    item.success = 'false'
                    this.setData({ items, flag: false })
                    return
                }
            })
        }
        
    },
    sendContent() {
        console.info('sendContent');
        const { items, question, scrollTop } = this.data
        console.info(question)
        if(question === null) {
            wx.showToast({
                title: '请输入问题',
                icon:'none'
            })
            return 
        }
        if(question.length < 5) {
            wx.showToast({
                title: '输入的问题字数太少',
                icon:'none'
            })
            return
        }
        wx.cloud.callFunction({
            name:"msgSecCheck",
            data:{
              msg: question,
            }
        }).then(res=>{
            console.log(res)
            if(res.result.code === 500) {
                console.log("检查未通过");
                this.setData({ question: null })
                wx.showToast({
                    title: '问题中包含敏感信息,请修改后,在提问',
                    icon:'none'
                })
                return 
            } else {
                if (this.data.flag) return
                this.data.flag = true
                items.push({
                    success: 'true',
                    position: 'right',
                    content: question
                })
                items.push({
                    success: 'true',
                    position: 'left',
                    content: ''
                })
                this.setData({ items, scrollTop: scrollTop + 2000 })
                const his = items.filter(res=> res.position === 'right').map(res => res.content)
                his.pop()
                this.ask()
            }
        })
    },
    async getCurrentTopic(){
        return new Promise((resolve,reject)=>{
            wx.cloud.callContainer({
                "config": {
                "env": app.envId
                },
                "path": "/TCGMGR/v1/chat/getCurrentTopicOrSet",
                "header": {
                "X-WX-SERVICE": app.serviceId,
                "content-type": "application/json"
                },
                "method": "GET",
                "data": {
                    "openid": app.userInfo.openId,
                }
            }).then(res=>{
                console.info(res)
                let statusCode = res.statusCode
                if(200 !== statusCode){
                    item.content = '服务负载过高,请稍后再试'
                    item.success = 'false'
                    this.setData({ items, flag: false, scrollTop: scrollTop + 2000 })
                    return ''
                } else{
                    let topicid = res.data.data;
                    this.setData({ topicid: topicid })
                    return topicid
                } 
            })
        }) 
    },
    async ask() {
        const { currentApiMode } = this.data
        if(currentApiMode === 'rev'){
            this.askChat()
        } 
        if(currentApiMode === 'api'){
            this.askApi()
        }
    },
    async askChat() {
        const { items,question,scrollTop } = this.data
        wx.cloud.callContainer({
            "config": {
            "env": app.envId
            },
            "path": "/TCGMGR/v1/chat/getCurrentTopicOrSet",
            "header": {
            "X-WX-SERVICE": app.serviceId,
            "content-type": "application/json"
            },
            "method": "GET",
            "data": {
                "openid": app.userInfo.openId,
            }
        }).then(res=>{
            console.info(res)
            let statusCode = res.statusCode
            let item = items.slice(-1)[0]
            if(200 !== statusCode){
                item.content = '服务负载过高,请稍后再试'
                item.success = 'false'
                this.setData({ items, flag: false, scrollTop: scrollTop + 2000 })
                return
            }
            let topicid = res.data.data;
            this.setData({ topicid: topicid })
            wx.cloud.callContainer({
                "config": {
                "env": app.envId
                },
                "path": "/TCGMGR/v1/chat/ask",
                "header": {
                "X-WX-SERVICE": app.serviceId,
                "content-type": "application/json"
                },
                "method": "POST",
                "data": {
                    "openid": app.userInfo.openId,
                    "topicid": topicid,
                    "question": question,
                }
            }).then(res=>{
                let item = items.slice(-1)[0]
                console.info(res)
                let statusCode = res.statusCode
                if(200 === statusCode){
                    let response = res.data
                    let code = response.code
                    if(code === 10200) {
                        this.handleAskResult(res.data.data)
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
                this.setData({ items, flag: false, scrollTop: scrollTop + 2000 })
            })
        })
    },
    async askApi() {
        console.info('askApi')
        const { items,question,scrollTop } = this.data
        wx.cloud.callContainer({
            "config": {
            "env": app.envId
            },
            "path": "/TCGMGR/aicode/doAsk",
            "header": {
            "X-WX-SERVICE": app.serviceId,
            "content-type": "application/json"
            },
            "method": "POST",
            "data": {
                "openId": app.userInfo.openId,
                "question": question,
                // "apikey":"sk-e6oQO8illIES5yQIeN8cT3BlbkFJfQYnHh9pLNCdjbLRM37",
            }
        }).then(res=>{
            let item = items.slice(-1)[0]
            console.info(res)
            let statusCode = res.statusCode
            if(200 === statusCode){
                let response = res.data
                let code = response.code
                if(code === 10200) {
                    this.handleAskResult(res.data.data)
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
            this.setData({ items, flag: false, scrollTop: scrollTop + 2000 })
        })
    },
    async sleep2second() {
        let s = new Date().getTime();
        console.log('start...',s);
        await this.sleep_inner(1000);
        let e = new Date().getTime() 
        console.log('end!',e," diff(ms)",e-s);
    },
    sleep_inner(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    // rev接口的返回
    async findAnswer(askid) {
        console.info("执行定时器（带参数）"+askid);
        let breakWhile = false;
        let tryCnt = 0;
        while(!breakWhile){
            await this.sleep_inner(1000);
            wx.cloud.callContainer({
                "config": {
                "env": app.envId
                },
                "path": "/TCGMGR/v1/chat/hasAnswer?askId="+askid,
                "header": {
                "X-WX-SERVICE": app.serviceId,
                "content-type": "application/json"
                },
                "method": "GET",
                "data": {
                }
            }).then(res=>{
                let statusCode = res.statusCode
                if(200 === statusCode){
                    let response = res.data
                    let code = response.code
                    if(code === 10200) {
                        let id = response.data;
                        console.info("有结果"+id);
                        breakWhile = true;
                        const { currentApiMode } = this.data
                        if(currentApiMode === 'rev'){
                            this.showRevAnswer(id)
                        } 
                        if(currentApiMode === 'api'){
                            this.showApiAnswer(id)
                            
                        }
        
                        
                    }
                }
            })
            await this.sleep_inner(1000)
            if(tryCnt > 60){
                console.info("超时无结果")
                breakWhile = true;
                this.showError('服务器太火爆了,请稍后再试','false')
            }
            tryCnt = tryCnt + 1;
            console.info(tryCnt)
        }
    },
    handleAskResult(askid) {
        console.info(askid)
        this.findAnswer(askid);        
    },
    showError(errorContent,hint){
        const { items, question, scrollTop } = this.data
        const his = items.filter(res=> res.position === 'right').map(res => res.content)
        his.pop()
        let item = items.slice(-1)[0]
        item.content = errorContent
        item.success = hint
        this.setData({ items })
        setTimeout(()=>{
            this.setData({flag: false, scrollTop: scrollTop + 2000 })
        })
    },
    showApiAnswer(answerid) {
        const { items, question, scrollTop } = this.data
        const his = items.filter(res=> res.position === 'right').map(res => res.content)
        his.pop()

        wx.cloud.callContainer({
            "config": {
            "env": app.envId
            },
            "path": "/TCGMGR/aicode/getAnswer?id="+answerid,
            "header": {
            "X-WX-SERVICE": app.serviceId,
            "content-type": "application/json"
            },
            "method": "GET",
            "data": {
            }
        }).then(res=>{
            let statusCode = res.statusCode
            if(200 === statusCode){
                
                let response = res.data
                let code = response.code
                if(code === 10200) {
                    console.info(res.data)
                    let result = response.data.result;
                    let item = items.slice(-1)[0]
                    item.content = result
                    item.success = 'true'
                    this.setData({ items })
                    setTimeout(()=>{
                        this.setData({flag: false, scrollTop: scrollTop + 2000 })
                    })
                    this.incrUsedHist('api')
                }else{
                    this.showError('服务器太火爆了,请稍后再试','false')
                }
            }
        })
    },
    showRevAnswer(answerid){
        const { items, question, scrollTop } = this.data
        const his = items.filter(res=> res.position === 'right').map(res => res.content)
        his.pop()

        wx.cloud.callContainer({
            "config": {
            "env": app.envId
            },
            "path": "/TCGMGR/v1/chat/getAnswer?id="+answerid,
            "header": {
            "X-WX-SERVICE": app.serviceId,
            "content-type": "application/json"
            },
            "method": "GET",
            "data": {
            }
        }).then(res=>{
            let statusCode = res.statusCode
            if(200 === statusCode){
                
                let response = res.data
                let code = response.code
                if(code === 10200) {
                    console.info(res.data)
                    let result = response.data.result;
                    let item = items.slice(-1)[0]
                    item.content = result
                    item.success = 'true'
                    this.setData({ items })
                    setTimeout(()=>{
                        this.setData({flag: false, scrollTop: scrollTop + 2000 })
                    })
                    this.incrUsedHist('rev')
                }else{
                    this.showError('服务器太火爆了,请稍后再试','false')
                }
            }
        })
    },
    copyContent(e) {
        wx.setClipboardData({
            data: e.currentTarget.dataset.content,
        })
    },
    resetShowFlg() {
        this.setData({
            showSourceText:true,
            showInputInviteCodeText: false,
            showHelpText: false,
            showSourceText: false,
            showProMenuText: false,
            showBuyInfoText: false,
        })
        const { items } = this.data
        items.splice(0,items.length )
        this.setData({ items })
    },
    showSource(e) {
        console.info(e)
        const { items, scrollTop } = this.data
        this.resetShowFlg()
        // this.showInputInviteCodeText = true
        this.setData({
            showSourceText:true
        })
        this.setData({ items, scrollTop: scrollTop + 2000})
    },
    showHelp(e) {
        console.info(e)
        const { items, scrollTop } = this.data
        this.resetShowFlg()
        // this.showInputInviteCodeText = true
        this.setData({
            showHelpText:true
        })
        this.setData({ items, scrollTop: scrollTop + 2000})
    },
    showInputCode(e) {
        console.info(e)
        const { items, scrollTop } = this.data
        // this.showInputInviteCodeText = true
        this.resetShowFlg()
        this.setData({
            showInputInviteCodeText:true
        })
        this.setData({ items, scrollTop: scrollTop + 2000})
    },
    showBuyInfo(e) {
        console.info(e)
        const { items, scrollTop } = this.data
        this.resetShowFlg()
        // this.showInputInviteCodeText = true
        this.setData({
            showBuyInfoText:true
        })
        this.setData({ items, scrollTop: scrollTop + 2000})
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
    incrUsedHist(path) {
        console.info('incrQuota')
        var that = this
        wx.cloud.callContainer({
            "config": {
              "env": app.envId
            },
            "path": "/TCGMGR/aicode/incrUsedHist",
            "header": {
              "X-WX-SERVICE": app.serviceId
            },
            "method": "POST",
            "data": {
              "openid": app.userInfo.openId,
              "requestpath": path
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
                    const { items, scrollTop } = that.data
                    let list = res.data.data
                    for (var i in list) {
                        let cnt = list[i].cnt
                        let maxcnt = list[i].maxcnt
                        
                        console.info(list[i].requestpath)
                        if("api" === list[i].requestpath){
                            items.push({
                                success: 'quotadesc',
                                position: 'left',
                                content: '简单会话:当日可用:'+maxcnt+'次,'+'已使用:'+cnt+'次'
                            })
                        }
                        if("rev" === list[i].requestpath){
                            items.push({
                                success: 'quotadesc',
                                position: 'left',
                                content: '上下文会话:当日已使用:'+cnt+'次,'+'您当日可用:'+maxcnt+'次'
                            })
                        }
                        
                    }  
                    that.setData({ items, scrollTop: scrollTop + 2000 })
                }
            },
            fail: function(res){
                console.info(res)
            }
        })
    },
    showProMenu(e) {
        
        console.info(e)
        const { items, scrollTop } = this.data
        this.resetShowFlg()
        // this.showInputInviteCodeText = true
        this.setData({
            showProMenuText:true
        })
        var that = this
        that.setData({ items, scrollTop: scrollTop + 2000})
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
                    const { items, scrollTop } = that.data
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
                        content: '好友输入邀请码后,您和好友的每日使用次数都将增加3次,最多邀请3人'
                    })
                    that.setData({ items, scrollTop: scrollTop + 2000 })
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