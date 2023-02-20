export const formatTime = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return (
        [year, month, day].map(formatNumber).join('/') +
        ' ' +
        [hour, minute, second].map(formatNumber).join(':')
    )
}

const formatNumber = (n) => {
    const s = n.toString()
    return s[1] ? s : '0' + s
}

export const toast = (title) => {
    wx.showToast({
        title: title,
        icon: 'none',
        duration: 1000,
    })
}

export const showLoading = (title) => {
    wx.showLoading({
        title: (title || '加载中...'),
        mask: true
    })
}

export const hideLoading = () => {
    wx.hideLoading();
}
