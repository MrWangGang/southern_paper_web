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
          <el-button type="warning" icon="el-icon-download" @click="handleExport">导出 Excel</el-button>
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
                >批量发货 / 批量重发</el-button>

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
                    <template v-if="['草稿', '已关闭', '已完成'].includes(props.row.orderStatus)" >
                      <span style="color: #67C23A"><i class="el-icon-circle-close"></i>禁止操作</span>
                    </template>
                    <template v-else-if="item.row.deliveryInfo">
                      <div style="display:flex; justify-content:center; gap:5px">
                        <template v-if="item.row.deliveryInfo.deliveryStatus === '待发货'">
                          <el-button type="primary" size="mini" :disabled="isRowSelected(props.row._id, item.row)" @click="handleOpenShip(props.row, item.row)">发货</el-button>
                          <el-button size="mini" disabled>撤回</el-button>
                        </template>
                        <template v-else-if="item.row.deliveryInfo.deliveryStatus === '已发货'">
                          <el-button type="warning" size="mini" :disabled="isRowSelected(props.row._id, item.row)" @click="handleOpenShip(props.row, item.row)">重发</el-button>
                          <el-button type="success" size="mini" :disabled="isRowSelected(props.row._id, item.row)" @click="handleCancelShip(props.row, item.row)">撤回</el-button>
                        </template>
                        <span v-else style="color: #67C23A"><i class="el-icon-circle-close"></i>禁止操作</span>
                      </div>
                    </template>
                    <span v-else style="color: #999">--</span>
                  </template>
                </el-table-column>
                <el-table-column label="发货单据" width="80" align="center">
                  <template slot-scope="item">
                    <div v-if="item.row.deliveryInfo && item.row.deliveryInfo.deliveryFileImg">
                      <div v-if="item.row.deliveryInfo.deliveryFileImg.toLowerCase().endsWith('.pdf')" @click="viewFile(item.row.deliveryInfo.deliveryFileImg)" class="pdf-icon-btn">PDF</div>
                      <el-image v-else class="table-thumb" :src="item.row.deliveryInfo.deliveryFileImg" :preview-src-list="[item.row.deliveryInfo.deliveryFileImg]" fit="cover" />
                    </div>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="识别码" width="80" align="center">
                  <template slot-scope="item">
                    <el-image v-if="item.row.deliveryInfo && item.row.deliveryInfo.deliveryFileQrImg" class="table-thumb" :src="item.row.deliveryInfo.deliveryFileQrImg" :preview-src-list="[item.row.deliveryInfo.deliveryFileQrImg]" fit="cover" />
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="签名" width="80" align="center">
                  <template slot-scope="item">
                    <el-image
                      v-if="item.row.deliveryInfo && item.row.deliveryInfo.signImg"
                      class="table-thumb"
                      style="background-color: #FFFFFF; border: 1px solid #eee; display: block; width: 50px; height: 50px; margin: 0 auto;"
                      :src="item.row.deliveryInfo.signImg"
                      :preview-src-list="[item.row.deliveryInfo.signImg]"
                      fit="contain"
                    />
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="物流状态" min-width="100" align="center">
                  <template slot-scope="item">
                    <el-tag v-if="item.row.deliveryInfo && item.row.deliveryInfo.deliveryStatus" size="mini" :color="getDeliveryStatusColor(item.row.deliveryInfo.deliveryStatus)" effect="dark" style="border:none; color: #ffffff;">{{ item.row.deliveryInfo.deliveryStatus }}</el-tag>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="发货时间" min-width="160" align="center">
                  <template slot-scope="item">
                    <template v-if="item.row.deliveryInfo && item.row.deliveryInfo.shipTime">
                        <span style="font-weight: bold; color: #606266;">
                          {{ dayjs(item.row.deliveryInfo.shipTime).format('YYYY-MM-DD HH:mm') }}
                        </span>
                    </template>
                    <span v-else style="color: #999;">--</span>
                  </template>
                </el-table-column>
                <el-table-column label="商品名称" min-width="180" align="center" prop="name" show-overflow-tooltip/>
                <el-table-column label="克重(g)" min-width="100" align="center">
                  <template slot-scope="item">{{ item.row.base_weight > 0 ? item.row.base_weight : '--' }}</template>
                </el-table-column>
                <el-table-column label="系数" min-width="100" align="center">
                  <template slot-scope="item">{{ formatEmpty(item.row.unit_weight) }}</template>
                </el-table-column>
                <el-table-column label="加工服务" min-width="100" align="center">
                  <template slot-scope="item">
                    <el-tag size="mini" :color="getServiceColor(item.row.service)" effect="dark" style="border:none">{{ item.row.service }}</el-tag>
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
                    <span v-if="item.row.weight && item.row.weight > 0" style="color: #67C23A; font-weight: bold;">
                      {{ item.row.weight }}吨
                    </span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="单价(￥/吨)" min-width="100" align="center">
                  <template slot-scope="item">
                    <span v-if="item.row.unit_price && item.row.unit_price > 0" style="color: #67C23A; font-weight: bold;">
                      {{ item.row.unit_price }} 元
                    </span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="小计(￥)" min-width="100" align="center" >
                  <template slot-scope="item"><span class="price-text">{{ item.row.total || '--' }}</span></template>
                </el-table-column>
                <el-table-column label="配送方式" min-width="100" align="center">
                  <template slot-scope="item">
                    <el-tag v-if="item.row.isSelfPick" size="mini" type="danger" effect="dark">仓库自提</el-tag>
                    <el-tag v-else size="mini" type="warning" effect="dark">送货上门</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="收货人" min-width="100" align="center" >
                  <template slot-scope="item">{{ item.row.isSelfPick ? '--' : (item.row.deliveryInfo ? item.row.deliveryInfo.receiverName : '--') }}</template>
                </el-table-column>
                <el-table-column label="手机号" min-width="100" align="center" >
                  <template slot-scope="item">{{ item.row.isSelfPick ? '--' : (item.row.deliveryInfo ? item.row.deliveryInfo.receiverPhone : '--') }}</template>
                </el-table-column>
                <el-table-column label="收货地址" min-width="150" align="center" fixed="right" show-overflow-tooltip>
                  <template slot-scope="item">
                    <span v-if="item.row.isSelfPick" style="color: #999;">--</span>
                    <span v-else>{{ (item.row.deliveryInfo && item.row.deliveryInfo.address) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="收货时间" min-width="160" align="center">
                  <template slot-scope="item">
                    <template v-if="item.row.deliveryInfo && item.row.deliveryInfo.receiveTime">
                        <span style="font-weight: bold; color: #606266;">
                          {{ dayjs(item.row.deliveryInfo.receiveTime).format('YYYY-MM-DD HH:mm') }}
                        </span>
                    </template>
                    <span v-else style="color: #999;">--</span>
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
            <el-tag v-if="scope.row.warehouse" size="small" effect="dark" :color="getWarehouseTagColor(scope.row.warehouse)" style="border: none;">{{ scope.row.warehouse }}</el-tag>
            <span v-else style="color: #999;">--</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center">
          <template slot-scope="scope"><el-tag :type="getStatusTag(scope.row.orderStatus)" size="small">{{ scope.row.orderStatus }}</el-tag></template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" align="center" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope"><span>{{ scope.row.remark || '--' }}</span></template>
        </el-table-column>
        <el-table-column label="发货操作" fixed="right" align="center" width="180">
          <template slot-scope="scope">
            <el-dropdown v-if="['待发货', '已关闭'].includes(scope.row.orderStatus)" @command="(status) => handleUpdateStatus(scope.row, status)" trigger="click">
              <el-button type="text" size="small">变更状态<i class="el-icon-arrow-down el-icon--right"></i></el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item v-if="scope.row.orderStatus === '待发货'" command="已关闭" style="color: #F56C6C;">作废订单</el-dropdown-item>
                <el-dropdown-item v-else-if="scope.row.orderStatus === '已关闭'" command="待发货" style="color: #67C23A; font-weight: bold;"><i class="el-icon-refresh-left"></i> 开启订单</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <span v-else style="color: #999; font-size: 12px; margin-right: 10px;">不允许操作</span>
<!--
            <el-button type="text" size="small" style="color: #F56C6C; margin-left: 10px;" icon="el-icon-delete" @click="handleDelete(scope.row)">删除数据</el-button>
-->
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; text-align: right;">
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="queryParams.page" :page-sizes="[10, 20, 50, 100]" :page-size="queryParams.pageSize" layout="total, sizes, prev, pager, next, jumper" :total="total" />
      </div>
    </el-card>

    <el-dialog title="发货单配置" :visible.sync="groupVisible" width="1300px" append-to-body custom-class="ship-group-dialog">
      <div style="padding: 10px 20px;" v-loading="loadingGroups">
        <div class="dialog-section-tip">请确定本次货物的发货单归属：</div>

        <el-radio-group v-model="groupType" style="width: 100%;">
          <div class="group-option-card" :class="{active: groupType === 'new'}" @click="groupType = 'new'">
            <el-radio label="new">
              <div class="option-content">
                <span class="main-label">生成新发货单</span>
                <p class="sub-label">系统将生成全新的发货单，并为其绑定独立的识别二维码。</p>
              </div>
            </el-radio>
          </div>

          <div class="group-option-card" :class="{active: groupType === 'join'}" @click="existingGroups.length > 0 ? groupType = 'join' : null">
            <el-radio label="join" :disabled="existingGroups.length === 0">
              <div class="option-content">
                <span class="main-label">合并至已有发货单</span>
                <p v-if="existingGroups.length === 0" class="sub-label error">此订单目前暂无已生成的发货单。</p>
                <p v-else class="sub-label">将本次勾选的商品合并到已有的发货单，共用同一个识别码。</p>
              </div>
            </el-radio>

            <transition name="el-zoom-in-top">
              <div v-if="groupType === 'join' && existingGroups.length > 0" class="existing-list-container">
                <div class="custom-table-wrapper">
                  <table class="custom-pure-table">
                    <thead>
                    <tr>
                      <th width="40"></th>
                      <th width="50">选择</th>
                      <th width="180">发货单</th>
                      <th>生成日期</th>
                    </tr>
                    </thead>
                    <tbody v-for="item in paginatedGroups" :key="item.shipNo">
                    <tr
                      :class="{ 'is-selected': targetShipNo === String(item.shipNo) }"
                      @click="targetShipNo = String(item.shipNo)"
                    >
                      <td align="center" @click.stop="toggleExpand(item.shipNo)">
                        <i :class="expandedShipNos.includes(item.shipNo) ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" style="color: #909399; cursor: pointer;"></i>
                      </td>
                      <td align="center">
                        <div class="custom-radio" :class="{ checked: targetShipNo === String(item.shipNo) }"></div>
                      </td>
                      <td>
                        <span class="ship-no-text">{{ item.shipNo }}</span>
                      </td>
                      <td align="center">
                        {{ item.createTime ? item.createTime.substring(0, 10) : '--' }}
                      </td>
                    </tr>
                    <tr v-if="expandedShipNos.includes(item.shipNo)" class="expand-row-tr">
                      <td colspan="4" class="expand-cell-td">
                        <div class="ship-detail-box">
                          <div class="detail-header">已包含商品明细：</div>
                          <el-table :data="item.items" size="mini" border stripe>
                            <el-table-column prop="name" label="名称" show-overflow-tooltip />
                            <el-table-column prop="base_weight" label="克重" show-overflow-tooltip />
                            <el-table-column label="配送方式" align="center">
                              <template slot-scope="scope">
                                <span v-if="scope.row.deliveryInfo && scope.row.deliveryInfo.isSelfPick">自提</span>
                                <span v-else>送货</span>
                              </template>
                            </el-table-column>
                            <el-table-column prop="deliveryInfo.receiverName" label="收货人"  align="center" />
                            <el-table-column prop="deliveryInfo.receiverPhone" label="手机号" show-overflow-tooltip />
                            <el-table-column prop="deliveryInfo.address" label="收货地址" show-overflow-tooltip />
                          </el-table>
                        </div>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <div class="list-pagination">
                  <el-pagination
                    small
                    layout="total, prev, pager, next"
                    :total="existingGroups.length"
                    :page-size="groupPageSize"
                    :current-page.sync="groupCurrentPage"
                  />
                </div>
              </div>
            </transition>
          </div>
        </el-radio-group>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="groupVisible = false" size="medium">取 消</el-button>
        <el-button type="primary" @click="confirmGrouping" size="medium">下一步：上传凭证</el-button>
      </div>
    </el-dialog>

    <el-dialog title="上传发货凭证" :visible.sync="shipVisible" width="450px" append-to-body>
      <div v-loading="uploading" element-loading-text="正在同步至云端...">
        <div v-if="isBatch" style="margin-bottom: 15px;">
          <el-alert title="批量操作" type="warning" :closable="false" show-icon>
            您正在为 {{ selectedItems[currentOrderId] ? selectedItems[currentOrderId].length : 0 }} 个明细项统一上传凭证
          </el-alert>
        </div>
        <el-upload drag action="" :http-request="handleShipFileUpload" :show-file-list="false" accept=".jpg,.png,.pdf" style="text-align: center;">
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
import { getOrderList, updateOrderStatus, delOrder, shipItem, cancelShipItem, createShipOrder, getShipGroups,exportOrder } from "@/api/wx/order";
import { uploadToCloud } from "@/api/wx/common";
import QRCode from "qrcode";
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';
export default {
  data() {
    return {
      dayjs,
      loading: true,
      orderList: [],
      total: 0,
      queryParams: {
        page: 1, pageSize: 10, orderNo: '', name: '', username: '', company: '', warehouse: '',
        orderStatus: ['待发货', '部分发货', '全部发货', '部分收货'],
        startTime: '', endTime: ''
      },
      dateRange: [],
      shipVisible: false,
      uploading: false,
      shipPreviewUrl: '',
      isPdfFile: false,
      isBatch: false,
      currentOrderId: '',
      selectedItems: {},
      groupVisible: false,
      loadingGroups: false,
      groupType: 'new',
      existingGroups: [],
      targetShipNo: '',
      expandedShipNos: [], // 新增：用于存储展开的行ID
      groupCurrentPage: 1,
      groupPageSize: 4,
      shipForm: {
        orderId: '', deliveryId: '', deliveryIds: [], shipNo: '',
        deliveryFileImg: '', deliveryFileQrImg: ''
      }
    };
  },
  computed: {
    paginatedGroups() {
      const start = (this.groupCurrentPage - 1) * this.groupPageSize;
      const end = start + this.groupPageSize;
      return this.existingGroups.slice(start, end);
    }
  },
  created() {
    this.getList();
  },
  methods: {
    handleDateChange(val) {
      if (val) { this.queryParams.startTime = val[0]; this.queryParams.endTime = val[1]; }
      else { this.queryParams.startTime = ''; this.queryParams.endTime = ''; }
    },
    resetQuery() {
      this.dateRange = [];
      this.queryParams = { page: 1, pageSize: 10, orderNo: '', name: '', username: '', company: '', warehouse: '', orderStatus: [], startTime: '', endTime: '' };
      this.handleQuery();
    },
    getWarehouseTagColor(warehouseName) {
      const map = { '湛江仓': '#13c2c2', '直调仓': '#67C23A' };
      return map[warehouseName] || '#909399';
    },
    viewFile(url) { if (url) window.open(url, '_blank'); },
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
    getUnit(item) { return (item.service === '零切' || item.service === '一开二') ? '张' : (item.unit || '件'); },
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
      this.$confirm(tip, "提示", { confirmButtonText: "确定", cancelButtonText: "取消", type: status === '已关闭' ? 'error' : 'warning' }).then(() => {
        updateOrderStatus(row._id, status).then(() => { this.$message.success("操作成功"); this.getList(); });
      }).catch(() => {});
    },
    handleDelete(row) {
      this.$confirm(`是否确认彻底删除订单 "${row.orderNo}"？此操作不可恢复！`, "警告", { confirmButtonText: "确定", cancelButtonText: "取消", type: "error" }).then(() => {
        delOrder(row._id).then(() => { this.$message.success("删除成功"); this.getList(); });
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
    handleSelectionChange(selection, orderId) { this.$set(this.selectedItems, orderId, selection); },
    isRowSelected(orderId, row) {
      const selected = this.selectedItems[orderId] || [];
      return selected.some(item => item.deliveryInfo.deliveryId === row.deliveryInfo.deliveryId);
    },
    isBatchShippable(orderId) {
      const selected = this.selectedItems[orderId] || [];
      if (selected.length === 0) return false;
      return selected.every(item => item.deliveryInfo && ['待发货', '已发货'].includes(item.deliveryInfo.deliveryStatus));
    },
    isAllCancelable(orderId) {
      const selected = this.selectedItems[orderId] || [];
      if (selected.length === 0) return false;
      return selected.every(item => item.deliveryInfo && item.deliveryInfo.deliveryStatus === '已发货');
    },
    hasIllegalSelection(orderId) {
      const selected = this.selectedItems[orderId] || [];
      if (selected.length === 0) return false;
      return selected.some(item => !item.deliveryInfo || !['待发货', '已发货'].includes(item.deliveryInfo.deliveryStatus));
    },
    handleCancelShip(order, item) {
      this.$confirm(`确定要撤销商品 [${item.name}] 的发货凭证吗？状态将回退至待发货。`, "提示", { type: "warning" }).then(() => {
        cancelShipItem({ orderId: order._id, deliveryId: item.deliveryInfo.deliveryId }).then(() => { this.$message.success("已撤回"); this.getList(); });
      }).catch(() => {});
    },
    /**
     * 🌟 批量撤销
     */
    handleBatchCancelShip(order) {
      const selections = this.selectedItems[order._id] || [];
      if (selections.length === 0) return;

      // 从勾选的项中提取 deliveryId
      const cancelableIds = selections.map(i => i.deliveryInfo.deliveryId);

      // 这里可以增加一层校验：看看选中的项里是不是都有 shipNo
      const hasShipNo = selections.every(i => i.deliveryInfo && i.deliveryInfo.shipNo);

      this.$confirm(`确定要撤销已勾选的 ${cancelableIds.length} 项发货记录吗？`, "批量撤销确认", {
        type: "warning"
      }).then(() => {
        // 调用接口
        cancelShipItem({
          orderId: order._id,
          deliveryIds: cancelableIds
        }).then(() => {
          this.$message.success("批量撤销成功");
          // 清空当前订单的勾选状态
          this.$set(this.selectedItems, order._id, []);
          this.getList(); // 刷新数据
        });
      }).catch(() => {});
    },
    handleBatchShip(order) {
      if (['已关闭', '草稿'].includes(order.orderStatus)) return;
      const selections = this.selectedItems[order._id] || [];
      this.isBatch = true;
      this.currentOrderId = order._id;
      this.shipForm = { orderId: order._id, deliveryIds: selections.map(i => i.deliveryInfo.deliveryId), deliveryId: '', shipNo: '', deliveryFileImg: '', deliveryFileQrImg: '' };
      this.openGroupDialog(order._id);
    },
    handleOpenShip(order, item) {
      if (['已关闭', '草稿'].includes(order.orderStatus)) return;
      const dId = (item.deliveryInfo && item.deliveryInfo.deliveryId) ? item.deliveryInfo.deliveryId : '';
      if (!dId) { this.$message.error("该明细项缺失 deliveryId"); return; }
      this.isBatch = false;
      this.currentOrderId = order._id;
      this.shipForm = { orderId: order._id, deliveryId: dId, deliveryIds: [], shipNo: '', deliveryFileImg: '', deliveryFileQrImg: '' };
      this.openGroupDialog(order._id);
    },
    /** 导出订单功能 - 全量导出 */
    /** 导出订单功能 - 彻底去除分页参数 */
    /** 导出订单功能 */
    handleExport() {
      this.$confirm('是否确认导出当前搜索条件下的所有订单明细?', "导出确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        this.loading = true;

        const fullParams = this.addDateRange({...this.queryParams}, this.dateRange);

        const { page, pageNum, pageSize, ...cleanParams } = fullParams;

        return exportOrder(cleanParams);

      }).then(response => {
        const list = response.data;
        console.log(list)
        if (!list || list.length === 0) {
          this.$modal.msgWarning("没有找到可导出的数据");
          this.loading = false;
          return;
        }

        // 4. 执行导出 Excel 逻辑
        const ws = XLSX.utils.json_to_sheet(list);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "订单明细");

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        FileSaver.saveAs(
          new Blob([wbout], { type: 'application/octet-stream' }),
          `订单导出_${new Date().getTime()}.xlsx`
        );

        this.$modal.msgSuccess("导出成功");
        this.loading = false;
      }).catch((err) => {
        console.error("导出异常:", err);
        this.loading = false;
      });
    },
    openGroupDialog(orderId) {
      this.groupVisible = true;
      this.loadingGroups = true;
      this.groupType = 'new';
      this.targetShipNo = '';
      this.expandedShipNos = []; // 重置展开
      this.existingGroups = [];
      this.groupCurrentPage = 1;

      getShipGroups(orderId).then(res => {
        this.existingGroups = res.data || [];
      }).catch(() => {
        this.$message.error("加载发货单列表失败");
      }).finally(() => {
        this.loadingGroups = false;
      });
    },

    toggleExpand(shipNo) {
      const index = this.expandedShipNos.indexOf(shipNo);
      if (index > -1) {
        this.expandedShipNos.splice(index, 1);
      } else {
        this.expandedShipNos.push(shipNo);
      }
    },

    confirmGrouping() {
      if (this.groupType === 'join' && !this.targetShipNo) {
        this.$message.warning("请从下方列表中选择一个现有的发货单");
        return;
      }
      this.groupVisible = false;
      this.shipPreviewUrl = '';
      this.isPdfFile = false;
      this.shipVisible = true;
    },

    async handleShipFileUpload(param) {
      this.uploading = true;
      try {
        const file = param.file;
        const isPdf = file.type === 'application/pdf';
        const formData = new FormData();
        formData.append('file', file);

        // 1. 先上传凭证图片
        const resImg = await uploadToCloud(formData);
        this.shipForm.deliveryFileImg = resImg.data.fileID;
        this.isPdfFile = isPdf;
        this.shipPreviewUrl = isPdf ? 'pdf' : URL.createObjectURL(file);

        // 🌟 2. 核心适配：此处向后端请求预分配单号（后端现在仅计算不入库）
        const payload = {
          orderId: this.currentOrderId,
          shipNo: this.groupType === 'join' ? this.targetShipNo : null
        };
        const resShipOrder = await createShipOrder(payload);
        this.shipForm.shipNo = resShipOrder.data.shipNo;

        // 3. 生成二维码并上传
        const qrBase64 = await QRCode.toDataURL(String(this.shipForm.shipNo), { width: 500, margin: 1 });
        const qrBlob = await (await fetch(qrBase64)).blob();
        const qrFormData = new FormData();
        qrFormData.append('file', qrBlob, 'qr.jpg');
        const resQr = await uploadToCloud(qrFormData);
        this.shipForm.deliveryFileQrImg = resQr.data.fileID;

        this.$message.success("发货资料处理完成");
      } catch (e) {
        console.error(e);
        this.$message.error("上传处理失败");
      } finally {
        this.uploading = false;
      }
    },

    submitShipAction() {
      if (!this.shipForm.deliveryFileQrImg) {
        this.$message.warning("正在生成发货识别码，请稍后...");
        return;
      }
      // 🌟 最终提交，后端会在此处统一处理解绑、合并逻辑
      const payload = {
        orderId: this.currentOrderId,
        shipNo: this.shipForm.shipNo,
        deliveryFileImg: this.shipForm.deliveryFileImg,
        deliveryFileQrImg: this.shipForm.deliveryFileQrImg,
        deliveryIds: this.isBatch ? this.shipForm.deliveryIds : [this.shipForm.deliveryId]
      };
      shipItem(payload).then(() => {
        this.$message.success(this.isBatch ? "批量发货登记成功" : "发货登记成功");
        this.shipVisible = false;
        if (this.isBatch) {
          this.$set(this.selectedItems, this.currentOrderId, []);
        }
        this.getList();
      }).catch(err => {
        this.$message.error(err.message || "发货失败");
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
.pdf-icon-btn { width: 40px; height: 40px; background: #ff4d4f; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border-radius: 4px; cursor: pointer; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.pdf-icon-btn:hover { background: #ff7875; }
.pdf-icon-preview { width: 100%; height: 180px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #ff4d4f; font-weight: bold; border-radius: 8px; }
.table-thumb { width: 40px; height: 40px; border-radius: 4px; border: 1px solid #eee; cursor: pointer; display: block; margin: 0 auto; }
::v-deep .inner-table .el-table__row td { height: 50px !important; }

.dialog-section-tip { font-size: 14px; color: #555; margin-bottom: 20px; font-weight: 500; }
.group-option-card { border: 1px solid #ebeef5; padding: 18px; border-radius: 8px; margin-bottom: 15px; transition: all 0.3s; background: #fff; cursor: pointer; }
.group-option-card:hover { border-color: #c0d9ff; background: #f9fbff; }
.group-option-card.active { border-color: #409EFF; background-color: #f0f7ff; box-shadow: 0 2px 12px 0 rgba(64,158,255,0.1); }
.option-content { display: inline-block; vertical-align: middle; margin-left: 10px; width: calc(100% - 40px); }
.main-label { font-size: 15px; font-weight: bold; color: #333; display: block; margin-bottom: 5px; }
.sub-label { font-size: 13px; color: #888; margin: 0; line-height: 1.4; }
.sub-label.error { color: #F56C6C; }

.existing-list-container { margin-top: 20px; padding: 10px; background: #fff; border-radius: 6px; border: 1px dashed #dcdfe6; }
.ship-detail-box { padding: 10px 15px; background: #fcfdfe; }
.detail-header { font-size: 12px; font-weight: bold; color: #409EFF; margin-bottom: 8px; }
.list-pagination { padding: 10px 0 0; text-align: right; }

/* 自制表格样式 */
.custom-table-wrapper { overflow: hidden; border-radius: 4px; border: 1px solid #ebeef5; }
.custom-pure-table { width: 100%; border-collapse: collapse; background: #fff; font-size: 13px; }
.custom-pure-table th { background: #f8f9fb; padding: 10px; color: #606266; font-weight: bold; border-bottom: 1px solid #ebeef5; text-align: center; }
.custom-pure-table td { padding: 12px 10px; border-bottom: 1px solid #ebeef5; color: #606266; transition: background 0.2s; cursor: pointer; }
.custom-pure-table tr:hover td { background-color: #f5f7fa; }
.custom-pure-table tr.is-selected td { background-color: #f0f7ff; }

/* 展开行专用样式 */
.expand-row-tr:hover td { background-color: #fcfdfe !important; }
.expand-cell-td { padding: 0 !important; border-bottom: 1px solid #ebeef5; }

/* 自制单选框样式 */
.custom-radio { width: 16px; height: 16px; border: 1px solid #dcdfe6; border-radius: 50%; display: inline-block; position: relative; background: #fff; vertical-align: middle; }
.custom-radio.checked { border-color: #409EFF; background: #409EFF; }
.custom-radio.checked::after { content: ""; width: 6px; height: 6px; background: #fff; border-radius: 50%; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.ship-no-text { font-family: monospace; font-weight: bold; color: #409EFF; }
</style>
