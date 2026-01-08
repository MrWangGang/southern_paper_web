import request from '@/utils/request'

// 分页查询用户
export function listUser(query) {
  return request({
    url: '/wxUser/page',
    method: 'get',
    params: query
  })
}

// 新增用户
export function addUser(data) {
  return request({
    url: '/wxUser/add',
    method: 'post',
    data: data
  })
}

// 修改用户
export function updateUser(id, data) {
  return request({
    url: '/wxUser/update/' + id,
    method: 'put',
    data: data
  })
}

// 修改用户状态
export function changeUserStatus(id, isLogin) {
  return request({
    url: '/wxUser/changeStatus',
    method: 'put',
    data: { _id: id, isLogin: isLogin }
  })
}

// ================== 新增接口 ==================

/**
 * 导出用户接口 (不带分页参数)
 * @param {Object} query 搜索条件
 */
export function exportUser(query) {
  return request({
    url: '/wxUser/export',
    method: 'get',
    params: query
  })
}

/**
 * 导入用户接口
 * @param {Object} data { list: [...] }
 */
export function importUser(data) {
  return request({
    url: '/wxUser/import',
    method: 'post',
    data: data
  })
}

/**
 * 获取下一个可用的客户号
 */
export function getNextUserCode() {
  return request({
    url: '/wxUser/nextUserCode',
    method: 'get'
  })
}
