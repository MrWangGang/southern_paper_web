import request from '@/utils/request'

/**
 * 上传文件到腾讯云存储 (CloudBase)
 * @param {FormData} data 包含文件对象的表单数据
 */
export function uploadToCloud(data) {
  return request({
    url: '/commonFile/uploadToCloud',
    method: 'post',
    data: data,
    // 上传文件建议设置较长的超时时间（如30秒）
    timeout: 30000,
    // 显式指定 content-type 为 multipart/form-data
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 如果以后有删除云端文件的需求，也可以写在这里
 */
export function deleteCloudFile(fileID) {
  return request({
    url: '/commonFile/removeCloud', // 对应你后端可能扩展的接口
    method: 'delete',
    params: { fileID }
  })
}
