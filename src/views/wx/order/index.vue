<template>
  <div class="app-container" style="background-color: #f4f7f9; padding: 24px; min-height: 100vh;">

    <el-card class="search-card" shadow="never" style="margin-bottom: 20px;">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
        <el-form-item label="订单编号">
          <el-input v-model="queryParams.orderNo" placeholder="输入订单号" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>

        <el-form-item label="客户名称">
          <el-input v-model="queryParams.name" placeholder="客户姓名" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>

        <el-form-item label="下单账号">
          <el-input v-model="queryParams.username" placeholder="下单账号" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>

        <el-form-item label="客户公司">
          <el-input v-model="queryParams.company" placeholder="公司名称" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>

        <el-form-item label="发货仓库">
          <el-select v-model="queryParams.warehouse" placeholder="选择仓库" clearable style="width: 140px;">
            <el-option label="湛江仓" value="湛江仓" />
            <el-option label="直调仓" value="直调仓" />
          </el-select>
        </el-form-item>

        <el-form-item label="订单状态">
          <el-select v-model="queryParams.orderStatus" placeholder="支持多选" multiple collapse-tags clearable style="width: 200px;">
            <el-option label="待发货" value="待发货" />
            <el-option label="部分发货" value="部分发货" />
            <el-option label="全部发货" value="全部发货" />
            <el-option label="部分收货" value="部分收货" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已关闭" value="已关闭" />
            <el-option label="草稿" value="草稿" />
          </el-select>
        </el-form-item>

        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            @change="handleDateChange"
            style="width: 240px;"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="loading"
        :data="orderList"
        row-key="_id"
        :header-cell-style="{ background: '#f8f9fb', color: '#333', fontWeight: 'bold' }"
        style="width: 100%"
      >
        <el-table-column type="expand">
          <template slot-scope="props">
            <div class="expand-container">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div class="inner-title" style="margin-bottom: 0;">商品明细</div>

                <el-button
                  type="primary"
                  size="mini"
                  icon="el-icon-truck"
                  style="margin-left: 15px;"
                  :disabled="!isBatchShippable(props.row._id) || props.row.orderStatus === '已关闭' || props.row.orderStatus === '草稿'"
                  @click="handleBatchShip(props.row)"
                >批量发货 / 修改</el-button>

                <el-button
                  type="success"
                  size="mini"
                  icon="el-icon-refresh-left"
                  style="margin-left: 10px;"
                  :disabled="!isAllCancelable(props.row._id) || props.row.orderStatus === '已完成' || props.row.orderStatus === '已关闭' || props.row.orderStatus === '草稿'"
                  @click="handleBatchCancelShip(props.row)"
                >批量撤销</el-button>

                <span v-if="hasIllegalSelection(props.row._id)" style="margin-left: 10px; color: #F56C6C; font-size: 12px;">
                  <i class="el-icon-warning"></i> 勾选项包含“已收货”或非法状态，无法批量操作
                </span>
              </div>

              <el-table
                :data="props.row.orderItems"
                size="mini"
                border
                class="inner-table"
                style="width: 100%"
                :row-style="{ height: '50px' }"
                :cell-style="{ padding: '0px' }"
                @selection-change="(val) => handleSelectionChange(val, props.row._id)"
              >
                <el-table-column type="selection" width="45" align="center" :selectable="(row) => canSelectItem(row, props.row.orderStatus)" />

                <el-table-column label="操作" width="160" align="center" fixed="left">
                  <template slot-scope="item">
                    <template v-if="props.row.orderStatus === '草稿' || props.row.orderStatus === '已关闭'|| props.row.orderStatus === '已完成'" >
                      <span style="color: #67C23A"><i class="el-icon-circle-check"></i>操作禁止</span>
                    </template>

                    <template v-else-if="item.row.deliveryInfo">
                      <div style="display:flex; justify-content:center; gap:5px">
                        <template v-if="item.row.deliveryInfo.deliveryStatus === '待发货'">
                          <el-button
                            type="primary"
                            size="mini"
                            :disabled="isRowSelected(props.row._id, item.row)"
                            @click="handleOpenShip(props.row, item.row)"
                          >发货</el-button>
                          <el-button size="mini" disabled>撤回</el-button>
                        </template>

                        <template v-else-if="item.row.deliveryInfo.deliveryStatus === '已发货'">
                          <el-button
                            type="warning"
                            size="mini"
                            :disabled="isRowSelected(props.row._id, item.row)"
                            @click="handleOpenShip(props.row, item.row)"
                          >修改</el-button>
                          <el-button
                            type="success"
                            size="mini"
                            :disabled="isRowSelected(props.row._id, item.row)"
                            @click="handleCancelShip(props.row, item.row)"
                          >撤回</el-button>
                        </template>

                        <span v-else style="color: #67C23A"><i class="el-icon-circle-check"></i>禁止操作</span>
                      </div>
                    </template>
                    <span v-else style="color: #999">--</span>
                  </template>
                </el-table-column>

                <el-table-column label="发货单据" width="80" align="center">
                  <template slot-scope="item">
                    <div v-if="item.row.deliveryInfo && item.row.deliveryInfo.deliveryFileImg">
                      <div v-if="item.row.deliveryInfo.deliveryFileImg.toLowerCase().endsWith('.pdf')" @click="viewFile(item.row.deliveryInfo.deliveryFileImg)" class="pdf-icon-btn">
                        PDF
                      </div>
                      <el-image
                        v-else
                        class="table-thumb"
                        :src="item.row.deliveryInfo.deliveryFileImg"
                        :preview-src-list="[item.row.deliveryInfo.deliveryFileImg]"
                        fit="cover"
                      >
                        <div slot="error" class="image-slot"><i class="el-icon-picture-outline"></i></div>
                      </el-image>
                    </div>
                    <span v-else>--</span>
                  </template>
                </el-table-column>

                <el-table-column label="识别码" width="80" align="center">
                  <template slot-scope="item">
                    <el-image
                      v-if="item.row.deliveryInfo && item.row.deliveryInfo.deliveryFileQrImg"
                      class="table-thumb"
                      :src="item.row.deliveryInfo.deliveryFileQrImg"
                      :preview-src-list="[item.row.deliveryInfo.deliveryFileQrImg]"
                      fit="cover"
                    >
                      <div slot="error" class="image-slot"><i class="el-icon-full-screen"></i></div>
                    </el-image>
                    <span v-else>--</span>
                  </template>
                </el-table-column>

                <el-table-column label="商品名称" min-width="180" align="center" prop="name" />

                <el-table-column label="物流状态"  min-width="100" align="center">
                  <template slot-scope="item">
                    <el-tag
                      v-if="item.row.deliveryInfo && item.row.deliveryInfo.deliveryStatus"
                      size="mini"
                      :color="getDeliveryStatusColor(item.row.deliveryInfo.deliveryStatus)"
                      effect="dark"
                      style="border:none; color: #ffffff; font-weight: normal;"
                    >
                      {{ item.row.deliveryInfo.deliveryStatus }}
                    </el-tag>
                    <span v-else>--</span>
                  </template>
                </el-table-column>

                <el-table-column label="克重(g)" min-width="100" align="center">
                  <template slot-scope="item">{{ item.row.base_weight > 0 ? item.row.base_weight : '--' }}</template>
                </el-table-column>

                <el-table-column label="系数" min-width="100" align="center">
                  <template slot-scope="item">{{ formatEmpty(item.row.unit_weight) }}</template>
                </el-table-column>

                <el-table-column label="加工服务" min-width="100" align="center">
                  <template slot-scope="item">
                    <el-tag size="mini" :color="getServiceColor(item.row.service)" effect="dark" style="border:none">
                      {{ item.row.service }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="加工规格" min-width="100" align="center">
                  <template slot-scope="item">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                      <el-tag size="mini" effect="dark" :type="getModeTagType(item.row)">{{ getModeLabel(item.row) }}</el-tag>
                      <el-tag v-if="item.row.service === '来料加工' && item.row.isDouble" size="mini" effect="dark" type="danger">一开二</el-tag>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="幅宽(mm)" min-width="100" align="center">
                  <template slot-scope="item">{{ formatEmpty(item.row.w) }}</template>
                </el-table-column>

                <el-table-column label="长度(mm)" min-width="100" align="center">
                  <template slot-scope="item">{{ (item.row.h && item.row.h !== '--') ? item.row.h: '--' }}</template>
                </el-table-column>

                <el-table-column label="数量" min-width="100" align="center">
                  <template slot-scope="item">
                    <div v-if="item.row.qty" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                      <span style="font-weight: bold; color: #FF0000;">{{ item.row.qty }}</span>
                      <el-tag size="mini" type="success" effect="dark">{{ getUnit(item.row) }}</el-tag>
                    </div>
                    <span v-else>--</span>
                  </template>
                </el-table-column>

                <el-table-column label="重量" min-width="100" align="center">
                  <template slot-scope="item">
                    <span v-if="item.row.weight > 0" style="color: #67C23A; font-weight: bold;">{{ item.row.weight }}吨</span>
                  </template>
                </el-table-column>

                <el-table-column label="小计(￥)" min-width="100" align="center" >
                  <template slot-scope="item">
                    <span class="price-text">{{ item.row.total || '--' }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="配送方式" min-width="100" align="center">
                  <template slot-scope="item">
                    <el-tag v-if="item.row.isSelfPick" size="mini" type="danger" effect="dark">仓库自提</el-tag>
                    <el-tag v-else size="mini" type="warning" effect="dark">送货上门</el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="收货人" min-width="100" align="center" >
                  <template slot-scope="item">
                    {{ item.row.isSelfPick ? '--' : (item.row.deliveryInfo ? item.row.deliveryInfo.receiverName : '--') }}
                  </template>
                </el-table-column>

                <el-table-column label="手机号" min-width="100" align="center" >
                  <template slot-scope="item">
                    {{ item.row.isSelfPick ? '--' : (item.row.deliveryInfo ? item.row.deliveryInfo.receiverPhone : '--') }}
                  </template>
                </el-table-column>

                <el-table-column label="收货地址" min-width="150" align="center" fixed="right" show-overflow-tooltip>
                  <template slot-scope="item">
                    <span v-if="item.row.isSelfPick" style="color: #999;">--</span>
                    <span v-else>{{ (item.row.deliveryInfo && item.row.deliveryInfo.address) || '--' }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="订单编号" prop="orderNo" align="center" />
        <el-table-column label="下单账号" align="center">
          <template slot-scope="scope"><span>{{ scope.row.username }}</span></template>
        </el-table-column>
        <el-table-column label="客户名称" align="center">
          <template slot-scope="scope"><span>{{ scope.row.name }}</span></template>
        </el-table-column>
        <el-table-column label="客户公司" align="center">
          <template slot-scope="scope"><span>{{ scope.row.company }}</span></template>
        </el-table-column>
        <el-table-column label="合计金额" align="center">
          <template slot-scope="scope"><span class="price-text">￥{{ scope.row.allTotal }}</span></template>
        </el-table-column>
        <el-table-column label="发货仓库" align="center">
          <template slot-scope="scope">
            <el-tag
              size="small"
              effect="dark"
              :color="getWarehouseTagColor(scope.row.warehouse)"
              style="border: none;"
            >
              {{ scope.row.warehouse }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusTag(scope.row.orderStatus)" size="small">{{ scope.row.orderStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="备注"
          prop="remark"
          align="center"
          min-width="150"
          show-overflow-tooltip
        >
          <template slot-scope="scope">
            <span>{{ scope.row.remark || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="180">
          <template slot-scope="scope">
            <el-dropdown
              v-if="['待发货', '已关闭'].includes(scope.row.orderStatus)"
              @command="(status) => handleUpdateStatus(scope.row, status)"
              trigger="click"
            >
              <el-button type="text" size="small">
                变更状态<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">

                <template v-if="scope.row.orderStatus === '待发货'">
                  <el-dropdown-item command="已关闭" style="color: #F56C6C;">作废订单</el-dropdown-item>
                </template>

                <template v-else-if="scope.row.orderStatus === '已关闭'">
                  <el-dropdown-item command="待发货" style="color: #67C23A; font-weight: bold;">
                    <i class="el-icon-refresh-left"></i> 开启订单
                  </el-dropdown-item>
                </template>

              </el-dropdown-menu>
            </el-dropdown>

            <span v-else style="color: #999; font-size: 12px; margin-right: 10px;">不允许操作</span>

            <el-button
              type="text"
              size="small"
              style="color: #F56C6C; margin-left: 10px;"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
            >删除数据</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="queryParams.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="queryParams.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        />
      </div>
    </el-card>

    <el-dialog title="上传发货凭证" :visible.sync="shipVisible" width="450px" append-to-body>
      <div v-loading="uploading" element-loading-text="正在同步至云端...">
        <div v-if="isBatch" style="margin-bottom: 15px;">
          <el-alert title="批量操作" type="warning" :closable="false" show-icon>
            您正在为 {{ selectedItems[currentOrderId] ? selectedItems[currentOrderId].length : 0 }} 个明细项统一上传凭证
          </el-alert>
        </div>
        <el-upload
          drag
          action=""
          :http-request="handleShipFileUpload"
          :show-file-list="false"
          accept=".jpg,.png,.pdf"
          style="text-align: center;"
        >
          <div v-if="shipPreviewUrl">
            <div v-if="isPdfFile" class="pdf-icon-preview">PDF</div>
            <img v-else :src="shipPreviewUrl" style="width: 100%; height: 180px; object-fit: contain;">
            <div style="margin-top: 10px; color: #67C23A;"><i class="el-icon-success"></i> 文件已准备就绪</div>
          </div>
          <template v-else>
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">拖拽或点击上传发货单 (JPG/PNG/PDF)</div>
          </template>
        </el-upload>
      </div>
      <div slot="footer">
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!shipForm.deliveryFileImg" @click="submitShipAction">确认发货</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { getOrderList, updateOrderStatus, delOrder, shipItem, cancelShipItem } from "@/api/wx/order";
import { uploadToCloud } from "@/api/wx/common";
import QRCode from "qrcode";

export default {
  data() {
    return {
      loading: true,
      orderList: [],
      total: 0,
      queryParams: {
        page: 1,
        pageSize: 10,
        orderNo: '',
        name: '',
        username: '',
        company: '',
        warehouse: '',
        orderStatus: ['待发货', '部分发货', '全部发货', '部分收货', '已完成', '已关闭'],
        startTime: '',
        endTime: ''
      },
      dateRange: [],
      shipVisible: false,
      uploading: false,
      shipPreviewUrl: '',
      isPdfFile: false,
      isBatch: false,
      currentOrderId: '',
      selectedItems: {},
      shipForm: {
        orderId: '',
        deliveryId: '',
        deliveryIds: [],
        deliveryFileImg: '',
        deliveryFileQrImg: ''
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    handleDateChange(val) {
      if (val) {
        this.queryParams.startTime = val[0];
        this.queryParams.endTime = val[1];
      } else {
        this.queryParams.startTime = '';
        this.queryParams.endTime = '';
      }
    },
    resetQuery() {
      this.dateRange = [];
      this.queryParams = {
        page: 1,
        pageSize: 10,
        orderNo: '',
        name: '',
        username: '',
        company: '',
        warehouse: '',
        orderStatus: [],
        startTime: '',
        endTime: ''
      };
      this.handleQuery();
    },
    getWarehouseTagColor(warehouseName) {
      const map = { '湛江仓': '#13c2c2', '直调仓': '#67C23A' };
      return map[warehouseName] || '#909399';
    },
    viewFile(url) {
      if (!url) return;
      window.open(url, '_blank');
    },
    formatEmpty(val) { return (val === 0 || val === '0' || !val) ? '--' : val; },
    getServiceColor(s) {
      const colors = { '卷筒': '#409EFF', '整卷切': '#67C23A', '零切': '#E6A23C', '一开二': '#F56C6C', '来料加工': '#909399' };
      return colors[s] || '#409EFF';
    },
    getDeliveryStatusColor(status) {
      const colorMap = { '待发货': '#E6A23C', '已发货': '#409EFF', '已收货': '#67C23A' };
      return colorMap[status] || '#909399';
    },
    getModeLabel(item) {
      const { service, isStandard } = item;
      if (service === '零切' || service === '一开二') return '张数';
      if (service === '来料加工') return isStandard ? '张数' : '件数';
      return isStandard ? '件数' : '吨数';
    },
    getModeTagType(item) {
      const map = { '张数': 'success', '件数': 'warning', '吨数': 'danger' };
      return map[this.getModeLabel(item)] || 'info';
    },
    getUnit(item) {
      if (item.service === '零切' || item.service === '一开二') return '张';
      return item.unit || '件';
    },
    getList() {
      this.loading = true;
      getOrderList(this.queryParams).then(res => {
        this.orderList = res.data.records;
        this.total = res.data.total;
        this.loading = false;
      });
    },
    handleUpdateStatus(row, status) {
      const tip = status === '待发货' ? '确认重新开启该订单吗？' : `确认将订单 ${row.orderNo} 状态修改为【${status}】吗？`;
      this.$confirm(tip, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: status === '已关闭' ? 'error' : 'warning'
      }).then(() => {
        updateOrderStatus(row._id, status).then(res => {
          this.$message.success("操作成功");
          this.getList();
        });
      }).catch(() => {});
    },
    handleDelete(row) {
      this.$confirm(`是否确认彻底删除订单 "${row.orderNo}"？此操作不可恢复！`, "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "error"
      }).then(() => {
        delOrder(row._id).then(res => {
          this.$message.success("删除成功");
          this.getList();
        });
      }).catch(() => {});
    },
    handleQuery() { this.queryParams.page = 1; this.getList(); },
    handleSizeChange(val) { this.queryParams.pageSize = val; this.getList(); },
    handleCurrentChange(val) { this.queryParams.page = val; this.getList(); },
    getStatusTag(s) {
      const map = { '待发货': 'warning', '部分发货': 'primary', '全部发货': 'success', '部分收货': 'primary', '已完成': 'success', '已关闭': 'danger', '草稿': 'info' };
      return map[s] || 'info';
    },

    canSelectItem(row, mainStatus) {
      if (['已关闭', '草稿', '已完成'].includes(mainStatus)) return false;
      return row.deliveryInfo && (row.deliveryInfo.deliveryStatus === '待发货' || row.deliveryInfo.deliveryStatus === '已发货');
    },

    handleSelectionChange(selection, orderId) {
      this.$set(this.selectedItems, orderId, selection);
    },

    isRowSelected(orderId, row) {
      const selected = this.selectedItems[orderId] || [];
      return selected.some(item => item.deliveryInfo.deliveryId === row.deliveryInfo.deliveryId);
    },

    /**
     * 批量发货/修改逻辑：
     * 允许 待发货、已发货 项。
     * 但如果勾选项里包含 已收货 或 缺失状态，则禁用。
     */
    isBatchShippable(orderId) {
      const selected = this.selectedItems[orderId] || [];
      if (selected.length === 0) return false;
      // 检查是否所有选中项都处于可以“上传凭证”的状态（待发货 或 已发货）
      return selected.every(item =>
        item.deliveryInfo && ['待发货', '已发货'].includes(item.deliveryInfo.deliveryStatus)
      );
    },

    /**
     * 批量撤销逻辑：
     * 必须全部都是 已发货 状态才有撤销意义。
     */
    isAllCancelable(orderId) {
      const selected = this.selectedItems[orderId] || [];
      if (selected.length === 0) return false;
      return selected.every(item => item.deliveryInfo && item.deliveryInfo.deliveryStatus === '已发货');
    },

    /**
     * 校验是否有非法选中项：
     * 如果用户勾选了“已收货”的项，虽然 isBatchShippable 会返回 false，但我们给个明确红字提示。
     */
    hasIllegalSelection(orderId) {
      const selected = this.selectedItems[orderId] || [];
      if (selected.length === 0) return false;
      return selected.some(item =>
        !item.deliveryInfo || !['待发货', '已发货'].includes(item.deliveryInfo.deliveryStatus)
      );
    },

    handleCancelShip(order, item) {
      this.$confirm(`确定要撤销商品 [${item.name}] 的发货凭证吗？状态将回退至待发货。`, "提示", {
        type: "warning"
      }).then(() => {
        cancelShipItem({ orderId: order._id, deliveryId: item.deliveryInfo.deliveryId }).then(() => {
          this.$message.success("已撤回");
          this.getList();
        });
      }).catch(() => {});
    },

    handleBatchCancelShip(order) {
      const selections = this.selectedItems[order._id] || [];
      const cancelableIds = selections.map(i => i.deliveryInfo.deliveryId);

      this.$confirm(`确定要批量撤销已勾选的 ${cancelableIds.length} 项发货记录吗？`, "批量操作", {
        type: "warning"
      }).then(() => {
        cancelShipItem({ orderId: order._id, deliveryIds: cancelableIds }).then(() => {
          this.$message.success("批量撤销成功");
          this.$set(this.selectedItems, order._id, []);
          this.getList();
        });
      }).catch(() => {});
    },

    handleBatchShip(order) {
      if (order.orderStatus === '已关闭' || order.orderStatus === '草稿') return;
      const selections = this.selectedItems[order._id] || [];
      const shippableIds = selections.map(i => i.deliveryInfo.deliveryId);

      this.isBatch = true;
      this.currentOrderId = order._id;
      this.shipForm = { orderId: order._id, deliveryIds: shippableIds, deliveryId: '', deliveryFileImg: '', deliveryFileQrImg: '' };
      this.shipPreviewUrl = ''; this.isPdfFile = false; this.shipVisible = true;
    },

    handleOpenShip(order, item) {
      if (order.orderStatus === '已关闭' || order.orderStatus === '草稿') return;
      const dId = (item.deliveryInfo && item.deliveryInfo.deliveryId) ? item.deliveryInfo.deliveryId : '';
      if (!dId) { this.$message.error("该明细项缺失 deliveryId"); return; }
      this.isBatch = false;
      this.currentOrderId = order._id;
      this.shipForm = { orderId: order._id, deliveryId: dId, deliveryIds: [], deliveryFileImg: '', deliveryFileQrImg: '' };
      this.shipPreviewUrl = ''; this.isPdfFile = false; this.shipVisible = true;
    },

    async handleShipFileUpload(param) {
      this.uploading = true;
      try {
        const file = param.file;
        const isPdf = file.type === 'application/pdf';
        const formData = new FormData();
        formData.append('file', file);
        const resImg = await uploadToCloud(formData);
        this.shipForm.deliveryFileImg = resImg.data.fileID;
        this.isPdfFile = isPdf;
        this.shipPreviewUrl = isPdf ? 'pdf' : URL.createObjectURL(file);
        await new Promise(r => setTimeout(r, 800));
        let qrData = this.isBatch ? `${this.shipForm.orderId}_BATCH_${this.shipForm.deliveryIds.join(',')}` : `${this.shipForm.orderId}_${this.shipForm.deliveryId}`;
        const qrBase64 = await QRCode.toDataURL(qrData, { width: 500, margin: 1 });
        const qrBlob = await (await fetch(qrBase64)).blob();
        const qrFormData = new FormData();
        qrFormData.append('file', qrBlob, 'qr.jpg');
        const resQr = await uploadToCloud(qrFormData);
        this.shipForm.deliveryFileQrImg = resQr.data.fileID;
        this.$message.success("资料上传完成");
      } catch (e) {
        this.$message.error("上传处理失败");
      } finally {
        this.uploading = false;
      }
    },

    submitShipAction() {
      if (!this.shipForm.deliveryFileQrImg) { this.$message.warning("请等待识别码生成"); return; }
      const payload = { orderId: this.shipForm.orderId, deliveryFileImg: this.shipForm.deliveryFileImg, deliveryFileQrImg: this.shipForm.deliveryFileQrImg };
      if (this.isBatch) { payload.deliveryIds = this.shipForm.deliveryIds; } else { payload.deliveryId = this.shipForm.deliveryId; }
      shipItem(payload).then(() => {
        this.$message.success(this.isBatch ? "批量发货成功" : "发货成功");
        this.shipVisible = false;
        if (this.isBatch) { this.$set(this.selectedItems, this.currentOrderId, []); }
        this.getList();
      });
    }
  }
};
</script>

<style scoped>
::v-deep .el-table__expanded-cell { padding: 0 !important; background-color: #fcfdfe !important; }
.expand-container { padding: 20px 30px; box-sizing: border-box; width: 100%; }
.inner-title { font-weight: bold; margin-bottom: 12px; color: #333; font-size: 14px; }
.inner-title::before { content: ""; width: 4px; height: 16px; background: #1890ff; display: inline-block; vertical-align: middle; margin-right: 8px; border-radius: 2px; }
.inner-table { box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); }
.price-text { color: #f5222d; font-weight: bold; }
.image-slot { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399; font-size: 20px; }
.pdf-icon-btn { width: 40px; height: 40px; background: #ff4d4f; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border-radius: 4px; cursor: pointer; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.pdf-icon-btn:hover { background: #ff7875; }
.pdf-icon-preview { width: 100%; height: 180px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #ff4d4f; font-weight: bold; border-radius: 8px; }
.table-thumb { width: 40px; height: 40px; border-radius: 4px; border: 1px solid #eee; cursor: pointer; display: block; margin: 0 auto; }
::v-deep .inner-table .el-table__row td { height: 50px !important; }

/* 强化自定义禁用样式 */
::v-deep .el-button--success.is-disabled,
::v-deep .el-button--success.is-disabled:hover {
  background-color: #f5f7fa !important;
  border-color: #e4e7ed !important;
  color: #c0c4cc !important;
}
</style>
