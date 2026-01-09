<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="68px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入名称" clearable style="width: 200px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="分类" prop="category">
        <el-select v-model="queryParams.category" placeholder="全部分类" clearable style="width: 150px">
          <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
        <el-button type="success" icon="el-icon-plus" size="mini" @click="handleAdd">新增产品</el-button>
        <el-button type="warning" icon="el-icon-download" size="mini" @click="handleExport">导出 Excel</el-button>

        <el-upload style="display: inline-block; margin-left: 10px;" action="" :before-upload="handleExcelImport" :show-file-list="false" accept=".xlsx, .xls">
          <el-button type="info" icon="el-icon-upload2" size="mini">导入 Excel</el-button>
        </el-upload>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="productList" style="width: 100%">
      <el-table-column label="产品图" align="center">
        <template slot-scope="scope">
          <el-image
            v-if="scope.row.productImg"
            style="width: 50px; height: 50px; border-radius: 4px; background: #f5f7fa"
            :src="scope.row.productImg"
            :preview-src-list="[scope.row.productImg]"
            fit="cover"
          />
          <div v-else class="name-avatar" :style="{'background-color': getBgColor(scope.row.name)}">
            {{ scope.row.name ? scope.row.name[0] : 'P' }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="分类" align="center" prop="category" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-tag size="small" effect="plain">{{ scope.row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="名称" align="left" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="克重(g)" align="center" prop="base_weight" show-overflow-tooltip/>
      <el-table-column label="系数" align="center" prop="unit_weight" show-overflow-tooltip/>
      <el-table-column label="创建时间" align="center" prop="createTime" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" style="color: #F56C6C" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="产品图片">
          <el-upload
            class="avatar-uploader"
            action=""
            :show-file-list="false"
            :http-request="handleUpload"
            :before-upload="beforeUpload"
          >
            <img v-if="imageUrl || form.productImg" :src="imageUrl || form.productImg" class="avatar">
            <div v-else class="avatar-text-wrapper name-avatar" :style="{'background-color': getBgColor(form.name), 'width': '100px', 'height': '100px', 'margin': '0'}">
              <div class="avatar-text">{{ form.name ? form.name[0] : 'P' }}</div>
              <i class="el-icon-plus edit-icon"></i>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" filterable allow-create placeholder="选择或输入" style="width: 100%">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="克重" prop="base_weight">
              <el-input-number v-model="form.base_weight" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="系数" prop="unit_weight">
              <el-input-number v-model="form.unit_weight" :step="0.01" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row> </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as XLSX from 'xlsx';
import { listProduct, addProduct, updateProduct, delProduct, getProductCategories, importProductJson, exportProduct } from "@/api/wx/product";
import { uploadToCloud } from '@/api/wx/common';
import Pagination from '@/components/Pagination';

export default {
  name: "Product",
  components: { Pagination },
  data() {
    return {
      loading: true,
      total: 0,
      productList: [],
      categoryOptions: [],
      open: false,
      title: "",
      imageUrl: "",
      queryParams: { pageNum: 1, pageSize: 10, name: undefined, category: undefined },
      form: {},
      rules: {
        name: [{ required: true, message: "必填", trigger: "blur" }],
        category: [{ required: true, message: "必填", trigger: "change" }],
        base_weight: [{ required: true, message: "必填", trigger: "blur" }],
        unit_weight: [{ required: true, message: "必填", trigger: "blur" }]
      }
    };
  },
  created() {
    this.getList();
    this.getCategoryList();
  },
  methods: {
    getList() {
      this.loading = true;
      listProduct(this.queryParams).then(res => {
        this.productList = res.data.records;
        this.total = res.data.total;
        this.loading = false;
      });
    },
    getCategoryList() {
      getProductCategories().then(res => { this.categoryOptions = res.data; });
    },
    getBgColor(name) {
      if (!name) return '#909399';
      const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#7232dd'];
      return colors[name.charCodeAt(0) % colors.length];
    },
    handleExport() {
      this.$confirm('是否根据当前查询条件导出数据？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.loading = true;
        return exportProduct(this.queryParams);
      }).then(res => {
        const list = res.data;
        if (!list || list.length === 0) {
          this.$modal.msgWarning("查无数据，无法导出");
          return;
        }
        const exportData = list.map(item => ({
          '分类': item.category,
          '产品名称': item.name,
          '克重(g)': item.base_weight,
          '系数': item.unit_weight,
          '创建时间': this.parseTime(item.createTime)
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "产品清单");
        XLSX.writeFile(wb, `产品导出_${new Date().getTime()}.xlsx`);
        this.$modal.msgSuccess("导出成功");
      }).finally(() => {
        this.loading = false;
      }).catch(() => {});
    },
    handleExcelImport(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const results = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        const importList = [];
        for (let i = 1; i < results.length; i++) {
          const row = results[i];
          if (row.length < 2) continue;
          importList.push({ category: row[0], name: row[1], base_weight: row[2], unit_weight: row[3] });
        }
        this.loading = true;
        importProductJson(importList).then(() => {
          this.$modal.msgSuccess("导入成功");
          this.getList();
          this.getCategoryList();
        }).finally(() => { this.loading = false; });
      };
      reader.readAsArrayBuffer(file);
      return false;
    },
    handleUpload(param) {
      const formData = new FormData();
      formData.append('file', param.file);
      uploadToCloud(formData).then(res => {
        this.form.productImg = res.data.fileID;
        this.imageUrl = URL.createObjectURL(param.file);
      });
    },
    beforeUpload(file) { return file.type.includes('image'); },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          const action = this.form._id ? updateProduct(this.form._id, this.form) : addProduct(this.form);
          action.then(() => {
            this.$modal.msgSuccess("操作成功");
            this.open = false;
            this.getList();
            this.getCategoryList();
          });
        }
      });
    },
    handleUpdate(row) {
      this.reset();
      this.form = { ...row };
      this.imageUrl = row.productImg;
      this.open = true;
      this.title = "修改";
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate();
      });
    },
    handleDelete(row) {
      this.$confirm('确认删除吗？').then(() => {
        return delProduct(row._id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      });
    },
    handleQuery() { this.queryParams.pageNum = 1; this.getList(); },
    resetQuery() { this.$refs.queryForm.resetFields(); this.handleQuery(); },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "新增";
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate();
      });
    },
    reset() {
      this.imageUrl = "";
      this.form = { _id: undefined, name: "", category: "", base_weight: 0, unit_weight: 0, productImg: "" };
    },
    cancel() { this.open = false; },
    parseTime(time) {
      if (!time) return "";
      const date = new Date(time);
      return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
    }
  }
};
</script>

<style scoped>
.name-avatar { width: 50px; height: 50px; border-radius: 4px; display: flex; justify-content: center; align-items: center; color: #fff; font-size: 22px; font-weight: bold; margin: 0 auto; }
.avatar-uploader { border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer; width: 100px; height: 100px; position: relative; }
.avatar { width: 100px; height: 100px; display: block; object-fit: cover; }
.avatar-text-wrapper { width: 100px; height: 100px; display: flex; justify-content: center; align-items: center; border: 1px solid #eee; position: relative;}
.edit-icon { position: absolute; bottom: 5px; right: 5px; color: #000; }
</style>
