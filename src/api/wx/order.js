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

// 导出订单（全量导出，不分页）
export function exportOrder(query) {
  return request({
    url: '/order/export',
    method: 'get',
    params: query
  })
}

// 获取订单打印次数
export function getPrintOrderCount(orderNo) {
  return request({
    url: '/order/getPrintOrderCount', // 去掉尾部的 + orderNo
    method: 'get',
    params: { orderNo } // 使用 params 传参，axios 会自动转为 ?orderNo=xxx
  })
}

// 获取发货明细打印次数
export function getPrintDeliveryCount(deliveryId) {
  return request({
    url: '/order/getPrintDeliveryCount', // 去掉尾部的 + deliveryId
    method: 'get',
    params: { deliveryId } // 使用 params 传参
  })
}

// 增加订单打印计数 (保持不变，因为后端是用 req.body)
export function countPrintOrder(orderNo) {
  return request({
    url: '/order/countPrintOrder',
    method: 'post',
    data: { orderNo }
  })
}

// 增加发货明细打印计数 (保持不变)
export function countPrintDelivery(deliveryId) {
  return request({
    url: '/order/countPrintDelivery',
    method: 'post',
    data: { deliveryId }
  })
}
