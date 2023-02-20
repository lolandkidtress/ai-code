// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
    let response = {
        code: 200,
        msg: "评论成功"
    }
    try {
        const result = await cloud.openapi.security.msgSecCheck({
            content: event.msg
        })
        return result
    } catch (err) {
        console.log("检测不合法")
        response.code = 500
        response.msg = "内容不合法"
        return response
    }
}