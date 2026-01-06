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

// 🌟 新增：单个商品发货接口
export function shipItem(data) {
  return request({
    url: '/order/shipItem',
    method: 'post',
    data: data
  })
}
