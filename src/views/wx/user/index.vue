<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="24" :xs="24">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
          <el-form-item label="用户昵称" prop="nickName">
            <el-input
              v-model="queryParams.nickName"
              placeholder="请输入用户昵称"
              clearable
              style="width: 240px"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="手机号码" prop="phone">
            <el-input
              v-model="queryParams.phone"
              placeholder="请输入手机号码"
              clearable
              style="width: 240px"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="userList">

          <el-table-column label="用户/昵称" align="left" width="200">
            <template slot-scope="scope">
              <div style="display: flex; align-items: center;">
                <el-avatar
                  :size="30"
                  :src="scope.row.avatarUrl"
                  style="margin-right: 10px; flex-shrink: 0;"
                >
                  {{ scope.row.nickName ? scope.row.nickName[0] : 'U' }}
                </el-avatar>
                <span v-if="scope.row.nickName" :title="scope.row.nickName">{{ scope.row.nickName }}</span>
                <span v-else style="color: #909399;">未设置</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="会员号" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.userNum">{{ scope.row.userNum }}</span>
              <span v-else style="color: #909399; font-style: italic;">未设置</span>
            </template>
          </el-table-column>

          <el-table-column label="手机号码" align="center" width="120">
            <template slot-scope="scope">
              <span v-if="scope.row.phone">{{ scope.row.phone }}</span>
              <span v-else style="color: #909399; font-style: italic;">未设置</span>
            </template>
          </el-table-column>

          <el-table-column label="领养宠物" align="center">
            <template slot-scope="scope">
              <div style="display: flex; align-items: center; justify-content: center;">
                <el-tooltip :content="scope.row.board" placement="top" :disabled="!scope.row.board">
                  <el-image
                    v-if="scope.row.boardUrl"
                    :src="scope.row.boardUrl"
                    style="width: 24px; height: 24px; border-radius: 50%; margin-right: 5px;"
                    fit="cover"
                  />
                </el-tooltip>
                <span v-if="scope.row.board">{{ scope.row.board }}</span>
                <span v-else style="color: #909399; font-style: italic;">未设置</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="会员信息" align="center">
            <template slot-scope="scope">
              <el-tag
                v-if="scope.row.vipType"
                size="small"
                :type="scope.row.vipLevel > 1 ? 'warning' : 'info'"
              >
                Lv.{{ scope.row.vipLevel || 0 }} / {{ scope.row.vipType }}
              </el-tag>
              <span v-else style="color: #909399; font-style: italic;">未设置</span>
            </template>
          </el-table-column>

          <el-table-column label="积分/经验" align="center">
            <template slot-scope="scope">
              <div v-if="scope.row.vipScore !== null && scope.row.vipScore !== undefined || scope.row.vipExp !== null && scope.row.vipExp !== undefined">
                <span style="display: block;">积分: {{ scope.row.vipScore || 0 }}</span>
                <span style="display: block;">经验: {{ scope.row.vipExp || 0 }}</span>
              </div>
              <span v-else style="color: #909399; font-style: italic;">未设置</span>
            </template>
          </el-table-column>

          <el-table-column label="注册时间" align="center" prop="createdAt" width="160">
            <template slot-scope="scope">
              <span v-if="scope.row.createdAt">{{ parseTime(scope.row.createdAt) }}</span>
              <span v-else style="color: #909399; font-style: italic;">未设置</span>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="total>0"
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination';
import { listUser } from '@/api/wx/user';

export default {
  name: "WxUserList",
  components: { Pagination },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      userList: null,

      queryParams: {
        pageNum: 1,
        pageSize: 10,
        nickName: undefined, // 对应后端 CloudBase 的 nickName
        phone: undefined,    // 对应后端 CloudBase 的 phone
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 嵌入式 parseTime 函数 (解决依赖问题) */
    parseTime(time, pattern = '{y}-{m}-{d} {h}:{i}:{s}') {
      if (arguments.length === 0 || !time) {
        return null;
      }
      const date = new Date(time);
      const formatObj = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
      };
      const time_str = pattern.replace(/\{([ymdhisa])\}/g, (match, key) => {
        const value = formatObj[key];
        if (['m', 'd', 'h', 'i', 's'].includes(key)) {
          return String(value).padStart(2, '0');
        }
        return String(value);
      });
      return time_str;
    },

    /** 查询用户列表 */
    getList() {
      this.loading = true;
      listUser(this.queryParams).then(response => {
          this.userList = response.data.records;
          this.total = response.data.total;
          this.loading = false;
        }
      ).catch(() => {
        this.loading = false;
      });
    },

    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },

    /** 重置按钮操作 */
    resetQuery() {
      if (this.$refs.queryForm) {
        this.$refs.queryForm.resetFields();
      }
      this.handleQuery();
    },
  }
};
</script>
