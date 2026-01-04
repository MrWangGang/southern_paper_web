import request from '@/utils/request'

// 查询生成表数据
export function listUser(query) {
  return request({
    url: '/wxUser/page',
    method: 'get',
    params: query
  })
}
