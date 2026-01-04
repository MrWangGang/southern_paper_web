<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="24" :xs="24">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
          <el-form-item label="用户姓名" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入姓名" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="手机号码" prop="phone">
            <el-input v-model="queryParams.phone" placeholder="请输入手机号" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
            <el-button type="success" icon="el-icon-plus" size="mini" @click="handleAdd">新增</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="userList">
          <el-table-column label="用户" align="left" width="200">
            <template slot-scope="scope">
              <div style="display: flex; align-items: center;">
                <el-avatar
                  :size="30"
                  :src="scope.row.faceImg"
                  style="margin-right: 10px; flex-shrink: 0; background-color: rgba(0,0,0,0.05); color: #666;"
                >
                  {{ scope.row.name ? scope.row.name[0] : 'U' }}
                </el-avatar>
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="手机" align="center" prop="phone" />
          <el-table-column label="公司" align="center" prop="company" />
          <el-table-column label="账号" align="center" prop="username" />
          <el-table-column label="角色" align="center" prop="role">
            <template slot-scope="scope">
              <el-tag size="small" type="info">{{ scope.row.role === 'customer' ? '客户' : scope.row.role }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="账号开启" align="center" width="100">
            <template slot-scope="scope">
              <el-switch v-model="scope.row.isLogin" @change="handleStatusChange(scope.row)"></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center" prop="createTime" width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)">修改</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total>0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

        <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
          <el-form ref="form" :model="form" :rules="rules" label-width="80px">
            <el-form-item label="用户头像">
              <el-upload
                class="avatar-uploader"
                action=""
                :show-file-list="false"
                :http-request="handleUpload"
                :before-upload="beforeAvatarUpload"
              >
                <img v-if="imageUrl" :src="imageUrl" class="avatar">
                <div v-else class="avatar-text-wrapper">
                  <div class="avatar-text">{{ form.name ? form.name[0] : '?' }}</div>
                  <i class="el-icon-plus edit-icon"></i>
                </div>
              </el-upload>
            </el-form-item>
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="手机" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="公司" prop="company">
              <el-input v-model="form.company" placeholder="请输入公司" />
            </el-form-item>
            <el-form-item label="角色">
              <el-input v-model="form.roleName" disabled />
            </el-form-item>
            <el-form-item label="账号" prop="username">
              <el-input v-model="form.username" placeholder="请输入账号" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
          </el-form>
          <div slot="footer" class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </el-dialog>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination';
import { listUser, addUser, updateUser, changeUserStatus } from '@/api/wx/user';
import { uploadToCloud } from '@/api/wx/common';

export default {
  name: "WxUserList",
  components: { Pagination },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      userList: [],
      title: "",
      open: false,
      imageUrl: "",
      queryParams: { pageNum: 1, pageSize: 10, name: undefined, phone: undefined },
      form: {},
      rules: {
        name: [{ required: true, message: "姓名不能为空", trigger: "blur" }],
        phone: [
          { required: true, message: "手机号不能为空", trigger: "blur" },
          { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号格式", trigger: "blur" }
        ],
        company: [{ required: true, message: "公司名称不能为空", trigger: "blur" }],
        username: [{ required: true, message: "账号不能为空", trigger: "blur" }],
        password: [{ required: true, message: "密码不能为空", trigger: "blur" }]
      }
    };
  },
  created() { this.getList(); },
  methods: {
    getList() {
      this.loading = true;
      listUser(this.queryParams).then(response => {
        this.userList = response.data.records;
        this.total = response.data.total;
        this.loading = false;
      }).catch(() => { this.loading = false; });
    },
    handleUpload(param) {
      const formData = new FormData();
      formData.append('file', param.file);
      uploadToCloud(formData).then(res => {
        if (res.code === 200) {
          this.form.faceImg = res.data.fileID;
          this.imageUrl = URL.createObjectURL(param.file);
          this.$modal.msgSuccess("上传成功");
        } else {
          this.$modal.msgError(res.msg || "上传失败");
        }
      }).catch(() => {
        this.$modal.msgError("文件服务器连接失败");
      });
    },
    beforeAvatarUpload(file) {
      const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJPGorPNG) this.$modal.msgError('上传头像图片只能是 JPG 或 PNG 格式!');
      if (!isLt2M) this.$modal.msgError('上传头像图片大小不能超过 2MB!');
      return isJPGorPNG && isLt2M;
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form._id != null) {
            updateUser(this.form._id, this.form).then(res => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addUser(this.form).then(res => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleUpdate(row) {
      this.reset();
      this.form = { ...row, roleName: '客户' }; // 赋值角色展示名
      this.imageUrl = row.faceImg;
      this.open = true;
      this.title = "修改用户";
    },
    handleStatusChange(row) {
      let text = row.isLogin ? "启用" : "禁用";
      this.$confirm('确认要' + text + '"' + row.name + '"用户吗？', "警告").then(() => {
        return changeUserStatus(row._id, row.isLogin);
      }).then(() => {
        this.$modal.msgSuccess(text + "成功");
        this.getList();
      }).catch(() => {
        row.isLogin = !row.isLogin;
      });
    },
    handleQuery() { this.queryParams.pageNum = 1; this.getList(); },
    resetQuery() { this.$refs.queryForm.resetFields(); this.handleQuery(); },
    handleAdd() {
      this.reset();
      this.form.roleName = '客户'; // 新增时也默认显示
      this.open = true;
      this.title = "添加用户";
    },
    cancel() { this.open = false; this.reset(); },
    reset() {
      this.imageUrl = "";
      this.form = {
        _id: undefined, name: undefined, phone: undefined, company: undefined,
        username: undefined, password: undefined, faceImg: undefined, roleName: '客户'
      };
      if (this.$refs.form) this.$refs.form.resetFields();
    },
    parseTime(time) {
      if (!time) return "";
      const date = new Date(time);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
}
.avatar-uploader:hover { border-color: #409EFF; }
.avatar-text-wrapper {
  width: 100px;
  height: 100px;
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 1px solid #eee;
}
.avatar-text {
  color: #606266;
  font-size: 40px;
  font-weight: bold;
}
.edit-icon {
  position: absolute;
  bottom: 5px;
  right: 5px;
  color: #909399;
  font-size: 16px;
}
.avatar { width: 100px; height: 100px; display: block; object-fit: cover; }
</style>
