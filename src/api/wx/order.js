import request from '@/utils/request'

// 🌟 查询订单列表
export function getOrderList(query) {
  return request({
    url: '/order/page',
    method: 'get',
    params: query
  })
}

// 🌟 修改订单状态
export function updateOrderStatus(id, status) {
  return request({
    url: '/order/updateStatus/' + id,
    method: 'put',
    data: { status }
  })
}

// 🌟 更新单项物流信息
export function updateDelivery(data) {
  return request({
    url: '/order/updateDelivery',
    method: 'post',
    data: data
  })
}

// 🌟 删除订单
export function delOrder(id) {
  return request({
    url: '/order/delete/' + id,
    method: 'delete'
  })
}
