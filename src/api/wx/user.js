import request from '@/utils/request'

export function listUser(query) {
  return request({
    url: '/wxUser/page',
    method: 'get',
    params: query
  })
}

export function addUser(data) {
  return request({
    url: '/wxUser/add',
    method: 'post',
    data: data
  })
}

export function updateUser(id, data) {
  return request({
    url: '/wxUser/update/' + id,
    method: 'put',
    data: data
  })
}

export function changeUserStatus(id, isLogin) {
  return request({
    url: '/wxUser/changeStatus',
    method: 'put',
    data: { _id: id, isLogin: isLogin }
  })
}
