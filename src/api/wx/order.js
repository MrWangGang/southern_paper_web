import request from '@/utils/request'

// 查询订单列表
export function getOrderList(query) {
  return request({ url: '/order/page', method: 'get', params: query })
}

// 修改订单主状态
export function updateOrderStatus(id, status) {
  return request({ url: '/order/updateStatus/' + id, method: 'put', data: { status } })
}

// 删除订单
export function delOrder(id) {
  return request({ url: '/order/delete/' + id, method: 'delete' })
}
// 撤销/取消发货
export function cancelShipItem(data) {
  return request({
    url: '/order/cancelShip', // 请根据后端实际路由调整
    method: 'post',
    data: data
  })
}
// 🌟 新增：单个商品发货接口
export function shipItem(data) {
  return request({
    url: '/order/shipItem',
    method: 'post',
    data: data
  })
}

// 🌟 新增：生成发货流水号/二维码编号接口
export function createShipOrder(data) {
  return request({
    url: '/order/createShipOrder',
    method: 'post',
    data: data
  })
}

export function getShipGroups(orderId) {
  return request({
    // 确保这里的路径与 Controller 对应，且 orderId 是作为路径参数拼接的
    url: '/order/getShipGroups/' + orderId,
    method: 'get'
  })
}
