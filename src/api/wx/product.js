import request from '@/utils/request'

// 分页查询产品列表
export function listProduct(query) {
  return request({
    url: '/product/page',
    method: 'get',
    params: query
  })
}

// 获取分类列表
export function getProductCategories() {
  return request({
    url: '/product/categories',
    method: 'get'
  })
}

// 接收 JSON 数组的导入接口
export function importProductJson(data) {
  return request({
    url: '/product/importJson',
    method: 'post',
    data: data
  })
}

// 🌟 新增：按条件导出接口
export function exportProduct(query) {
  return request({
    url: '/product/export',
    method: 'get',
    params: query // 携带当前的搜索条件
  })
}

// 新增产品
export function addProduct(data) {
  return request({
    url: '/product/add',
    method: 'post',
    data: data
  })
}

// 修改产品
export function updateProduct(id, data) {
  return request({
    url: '/product/update/' + id,
    method: 'put',
    data: data
  })
}

// 删除产品
export function delProduct(id) {
  return request({
    url: '/product/delete/' + id,
    method: 'delete'
  })
}
