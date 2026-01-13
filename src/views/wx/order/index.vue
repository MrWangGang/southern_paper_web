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

                <el-button
                  type="warning"
                  size="mini"
                  icon="el-icon-printer"
                  style="margin-left: 10px;"
                  :disabled="!(selectedItems[props.row._id] && selectedItems[props.row._id].length > 0)"
                  @click="handlePrintBatchItems(props.row)"
                >批量打印</el-button>

                <span v-if="hasIllegalSelection(props.row._id)" style="margin-left: 10px; color: #F56C6C; font-size: 12px;">
                  <i class="el-icon-warning"></i> 勾选项包含“已收货”无法批量发货,但是可以批量打印
                </span>
              </div>

              <vxe-table
                v-if="props.row.orderItems && props.row.orderItems.length > 0"
                border
                show-overflow
                size="mini"
                max-height="500"
                min-height="150"
                :auto-resize="true"
                :data="props.row.orderItems"
                class="inner-vxe-table"
                :row-config="{height: 50, isCurrent: true, isHover: true}"
                @checkbox-change="(val) => handleVxeSelectionChange(val, props.row._id)"
                @checkbox-all="(val) => handleVxeSelectionChange(val, props.row._id)"
              >
                <vxe-column type="checkbox" width="50" align="center" fixed="left"></vxe-column>

                <vxe-column title="操作" width="320" align="center" fixed="left">
                  <template #default="{ row, rowIndex }">
                    <div style="display:flex; justify-content:center; align-items:center; gap:5px">
                      <template v-if="['草稿', '已关闭', '已完成'].includes(props.row.orderStatus) || (row.deliveryInfo && row.deliveryInfo.deliveryStatus === '已收货')">
                        <span style="color: #67C23A; font-size: 12px; margin-right: 5px;">
                          <i class="el-icon-circle-close"></i> 禁止操作
                        </span>
                      </template>

                      <template v-else-if="row.deliveryInfo">

                        <template v-if="row.deliveryInfo.deliveryStatus === '待发货'">
                          <el-button
                            type="warning"
                            size="mini"
                            icon="el-icon-edit"
                            :disabled="row.deliveryInfo.deliveryStatus !== '待发货' && isRowSelected(props.row._id, row)"
                            @click="handleEditProduct(props.row, row, rowIndex)"
                          >修改</el-button>
                          <el-button
                            type="primary"
                            size="mini"
                            icon="el-icon-set-up"
                            :disabled="isRowSelected(props.row._id, row)"
                            @click="handleOpenShip(props.row, row)"
                          >发货</el-button>
                        </template>

                        <template v-else-if="row.deliveryInfo.deliveryStatus === '已发货'">
                          <el-button
                            type="warning"
                            size="mini"
                            :disabled="isRowSelected(props.row._id, row)"
                            icon="el-icon-setting"
                            @click="handleOpenShip(props.row, row)"
                          >重发</el-button>
                          <el-button
                            type="success"
                            size="mini"
                            :disabled="isRowSelected(props.row._id, row)"
                            icon="el-icon-delete"
                            @click="handleCancelShip(props.row, row)"
                          >撤回</el-button>
                        </template>
                      </template>

                      <span v-else style="color: #999; margin-right: 5px;">--</span>

                      <el-button
                        type="text"
                        size="mini"
                        icon="el-icon-printer"
                        @click="handlePrintSingleItem(props.row, row, rowIndex)"
                      >打印</el-button>

                    </div>
                  </template>
                </vxe-column>

                <vxe-column title="发货单据" width="80" align="center">
                  <template #default="{ row }">
                    <div v-if="row.deliveryInfo && row.deliveryInfo.deliveryFileImg">
                      <div v-if="row.deliveryInfo.deliveryFileImg.toLowerCase().endsWith('.pdf')" @click="viewFile(row.deliveryInfo.deliveryFileImg)" class="pdf-icon-btn">PDF</div>
                      <el-image v-else class="table-thumb" :src="row.deliveryInfo.deliveryFileImg" :preview-src-list="[row.deliveryInfo.deliveryFileImg]" fit="cover" />
                    </div>
                    <span v-else>--</span>
                  </template>
                </vxe-column>

                <vxe-column title="识别码" width="80" align="center">
                  <template #default="{ row }">
                    <el-image v-if="row.deliveryInfo && row.deliveryInfo.deliveryFileQrImg" class="table-thumb" :src="row.deliveryInfo.deliveryFileQrImg" :preview-src-list="[row.deliveryInfo.deliveryFileQrImg]" fit="cover" />
                    <span v-else>--</span>
                  </template>
                </vxe-column>

                <vxe-column title="签名" width="80" align="center">
                  <template #default="{ row }">
                    <el-image
                      v-if="row.deliveryInfo && row.deliveryInfo.signImg"
                      class="table-thumb"
                      style="background-color: #FFFFFF; border: 1px solid #eee; display: block; width: 50px; height: 50px; margin: 0 auto;"
                      :src="row.deliveryInfo.signImg"
                      :preview-src-list="[row.deliveryInfo.signImg]"
                      fit="contain"
                    />
                    <span v-else>--</span>
                  </template>
                </vxe-column>

                <vxe-column title="物流状态" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.deliveryInfo && row.deliveryInfo.deliveryStatus" size="mini" :color="getDeliveryStatusColor(row.deliveryInfo.deliveryStatus)" effect="dark" style="border:none; color: #ffffff;">{{ row.deliveryInfo.deliveryStatus }}</el-tag>
                    <span v-else>--</span>
                  </template>
                </vxe-column>

                <vxe-column title="发货时间" width="160" align="center">
                  <template #default="{ row }">
                    <template v-if="row.deliveryInfo && row.deliveryInfo.shipTime">
                        <span style="font-weight: bold; color: #606266;">
                          {{ dayjs(row.deliveryInfo.shipTime).format('YYYY-MM-DD HH:mm') }}
                        </span>
                    </template>
                    <span v-else style="color: #999;">--</span>
                  </template>
                </vxe-column>

                <vxe-column title="商品名称" width="180" align="center" field="name" />
                <vxe-column title="克重(g)" width="100" align="center">
                  <template #default="{ row }">{{ row.base_weight > 0 ? row.base_weight : '--' }}</template>
                </vxe-column>
                <vxe-column title="系数" width="100" align="center">
                  <template #default="{ row }">{{ formatEmpty(row.unit_weight) }}</template>
                </vxe-column>
                <vxe-column title="加工服务" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag size="mini" :color="getServiceColor(row.service)" effect="dark" style="border:none">{{ row.service }}</el-tag>
                  </template>
                </vxe-column>
                <vxe-column title="加工规格" width="100" align="center">
                  <template #default="{ row }">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                      <el-tag size="mini" effect="dark" :type="getModeTagType(row)">{{ getModeLabel(row) }}</el-tag>
                      <el-tag v-if="row.service === '来料加工' && row.isDouble" size="mini" effect="dark" type="danger">一开二</el-tag>
                    </div>
                  </template>
                </vxe-column>
                <vxe-column title="幅宽(mm)" width="100" align="center">
                  <template #default="{ row }">{{ formatEmpty(row.w) }}</template>
                </vxe-column>
                <vxe-column title="长度(mm)" width="100" align="center">
                  <template #default="{ row }">{{ (row.h && row.h !== '--') ? row.h: '--' }}</template>
                </vxe-column>
                <vxe-column title="数量" width="100" align="center">
                  <template #default="{ row }">
                    <div v-if="row.qty" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                      <span style="font-weight: bold; color: #FF0000;">{{ row.qty }}</span>
                      <el-tag size="mini" type="success" effect="dark">{{ getUnit(row) }}</el-tag>
                    </div>
                    <span v-else>--</span>
                  </template>
                </vxe-column>
                <vxe-column title="重量" width="100" align="center">
                  <template #default="{ row }">
                    <span v-if="row.weight && row.weight > 0" style="color: #67C23A; font-weight: bold;">
                      {{ row.weight }}吨
                    </span>
                    <span v-else>--</span>
                  </template>
                </vxe-column>
                <vxe-column title="单价(￥/吨)" width="100" align="center">
                  <template #default="{ row }">
                    <span v-if="row.unit_price && row.unit_price > 0" style="color: #67C23A; font-weight: bold;">
                      {{ row.unit_price }} 元
                    </span>
                    <span v-else>--</span>
                  </template>
                </vxe-column>
                <vxe-column title="小计(￥)" width="100" align="center" >
                  <template #default="{ row }"><span class="price-text">{{ row.total || '--' }}</span></template>
                </vxe-column>
                <vxe-column title="配送方式" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.isSelfPick" size="mini" type="danger" effect="dark">仓库自提</el-tag>
                    <el-tag v-else size="mini" type="warning" effect="dark">送货上门</el-tag>
                  </template>
                </vxe-column>
                <vxe-column title="收货人" width="100" align="center" >
                  <template #default="{ row }">{{ row.isSelfPick ? '--' : (row.deliveryInfo ? row.deliveryInfo.receiverName : '--') }}</template>
                </vxe-column>
                <vxe-column title="手机号" width="100" align="center" >
                  <template #default="{ row }">{{ row.isSelfPick ? '--' : (row.deliveryInfo ? row.deliveryInfo.receiverPhone : '--') }}</template>
                </vxe-column>
                <vxe-column title="收货地址" width="200" align="center" fixed="right">
                  <template #default="{ row }">
                    <el-tooltip
                      effect="dark"
                      :content="row.isSelfPick ? '自提' : (row.deliveryInfo && row.deliveryInfo.address) || '--'"
                      placement="top"
                      :disabled="row.isSelfPick"
                    >
                      <div style="
                            width: 180px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            margin: 0 auto;
                          ">
                        <span v-if="row.isSelfPick" style="color: #999;">--</span>
                        <span v-else>{{ (row.deliveryInfo && row.deliveryInfo.address) || '--' }}</span>
                      </div>
                    </el-tooltip>
                  </template>
                </vxe-column>
                <vxe-column title="收货时间" width="160" align="center">
                  <template #default="{ row }">
                    <template v-if="row.deliveryInfo && row.deliveryInfo.receiveTime">
                        <span style="font-weight: bold; color: #606266;">
                          {{ dayjs(row.deliveryInfo.receiveTime).format('YYYY-MM-DD HH:mm') }}
                        </span>
                    </template>
                    <span v-else style="color: #999;">--</span>
                  </template>
                </vxe-column>
              </vxe-table>
              <div v-else style="text-align:center; padding: 20px; color: #999;">暂无商品明细</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="订单编号" prop="orderNo" align="center" show-overflow-tooltip/>
        <el-table-column label="下单账号" align="center">
          <template slot-scope="scope"><span show-overflow-tooltip>{{ scope.row.username }}</span></template>
        </el-table-column>
        <el-table-column label="客户名称" align="center">
          <template slot-scope="scope"><span>{{ scope.row.name }}</span></template>
        </el-table-column>
        <el-table-column label="客户公司" align="center" show-overflow-tooltip>
          <template slot-scope="scope"><span>{{ scope.row.company }}</span></template>
        </el-table-column>
        <el-table-column label="合计金额(￥)" align="center" show-overflow-tooltip>
          <template slot-scope="scope"><span class="price-text">￥{{ scope.row.allTotal }}</span></template>
        </el-table-column>
        <el-table-column label="合计重量(吨)" align="center" show-overflow-tooltip>
          <template slot-scope="scope"><span class="price-text">{{ scope.row.allWeight }}吨</span></template>
        </el-table-column>
        <el-table-column label="发货仓库" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <el-tag v-if="scope.row.warehouse" size="small" effect="dark" :color="getWarehouseTagColor(scope.row.warehouse)" style="border: none;">{{ scope.row.warehouse }}</el-tag>
            <span v-else style="color: #999;">--</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" show-overflow-tooltip>
          <template slot-scope="scope"><el-tag :type="getStatusTag(scope.row.orderStatus)" size="small">{{ scope.row.orderStatus }}</el-tag></template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" align="center" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope"><span>{{ scope.row.remark || '--' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="220">
          <template slot-scope="scope">
            <el-button type="text" size="small" icon="el-icon-printer" @click="handlePrint(scope.row)">打印整单</el-button>

            <el-dropdown v-if="['待发货', '已关闭'].includes(scope.row.orderStatus)" @command="(status) => handleUpdateStatus(scope.row, status)" trigger="click">
              <el-button type="text" size="small">变更状态<i class="el-icon-arrow-down el-icon--right"></i></el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item v-if="scope.row.orderStatus === '待发货'" command="已关闭" style="color: #F56C6C;">作废订单</el-dropdown-item>
                <el-dropdown-item v-else-if="scope.row.orderStatus === '已关闭'" command="待发货" style="color: #67C23A; font-weight: bold;"><i class="el-icon-refresh-left"></i> 开启订单</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <span v-else style="color: #999; font-size: 12px; margin-right: 10px;">&ensp;不可作废</span>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; text-align: right;">
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="queryParams.page" :page-sizes="[10, 20, 50, 100]" :page-size="queryParams.pageSize" layout="total, sizes, prev, pager, next, jumper" :total="total" />
      </div>
    </el-card>

    <el-dialog title="打印预览" :visible.sync="printVisible" width="1050px" append-to-body>
      <div id="printArea" v-loading="printCountLoading">
        <div v-for="(order, index) in printData" :key="index" class="print-page-wrapper">

          <div class="print-header-container" style="position: relative;">
            <div style="position: absolute; left: 0; top: 0; font-size: 12px; color: #666;">
              打印次数：{{ printType === 'order' ? (order.printCount || 0) : (order.orderItems[0].printCount || 0) }}
            </div>

            <h1 class="print-main-title">订 单 明 细</h1>

            <div class="print-top-info-grid">
              <div class="info-cell"><strong>订单编号：</strong>{{ order.orderNo }}</div>
              <div class="info-cell"><strong>客户公司：</strong>{{ order.company }}</div>
              <div class="info-cell"><strong>合计重量：</strong>{{ order.allWeight }} 吨</div>
              <div class="info-cell"><strong>下单时间：</strong>{{ dayjs(order.createTime).format('YYYY-MM-DD HH:mm') }}</div>
            </div>
          </div>

          <div v-for="(item, idx) in order.orderItems" :key="'item'+idx" class="print-item-card">
            <div class="card-title-row">
              <span class="item-no">#{{ item.printIdx || idx + 1 }}</span>
              <span class="item-name">{{ item.name }}</span>
            </div>

            <div class="card-main-body-table">
              <table class="print-table">
                <thead>
                <tr>
                  <th>商品名称</th>
                  <th>加工服务</th>
                  <th>加工规格</th>
                  <th>幅宽(mm)</th>
                  <th>长度(mm)</th>
                  <th>数量</th>
                  <th>重量(吨)</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                  <td width="180px">{{ item.name }}{{ item.base_weight }}g</td>
                  <td width="100px">{{ item.service }}</td>
                  <td width="100px">
                    {{ getModeLabel(item) }}
                    <span v-if="item.service === '来料加工' && item.isDouble" style="color:red">(一开二)</span>
                  </td>
                  <td width="100px">{{ formatEmpty(item.w) }}</td>
                  <td width="100px">{{ (item.h && item.h !== '--') ? item.h: '--' }}</td>
                  <td width="100px" class="highlight-red">{{ item.qty }} {{ getUnit(item) }}</td>
                  <td width="100px">{{ item.weight || '--' }}</td>
                </tr>
                <tr>
                  <tr v-if="printType !== 'order'">
                    <td colspan="6" style="text-align: right; font-weight: bold; padding-right: 20px;">合计重量：</td>
                    <td style="font-weight: bold; color: #67C23A;">{{ item.weight || '--' }}</td>
                  </tr>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="printType === 'order'" class="print-total-table-wrapper">
            <table class="print-table" style="border-top: none;">
              <tbody>
              <tr>
                <td colspan="7" style="text-align: right; font-weight: bold; background: #fafafa; padding-right: 20px;">
                  合计重量：<span style="font-size: 16px; color: #67C23A; margin-left: 10px;">{{ order.allWeight }} 吨</span>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div class="print-remark-area">
            <strong>备注：</strong>{{ order.remark || '无备注' }}
          </div>
        </div>
      </div>
      <div slot="footer">
        <el-button @click="printVisible = false">取消预览</el-button>
        <el-button type="primary" icon="el-icon-printer" @click="doPrint">确认打印</el-button>
      </div>
    </el-dialog>

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
                            <el-table-column prop="deliveryInfo.receiverName" label="收货人"  align="center" show-overflow-tooltip/>
                            <el-table-column prop="deliveryInfo.receiverPhone" label="手机号" show-overflow-tooltip/>
                            <el-table-column prop="deliveryInfo.address" label="收货地址" show-overflow-tooltip/>
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
    <el-dialog title="修改商品属性" :visible.sync="editVisible" width="550px" append-to-body>
      <div v-if="editForm">
        <el-form label-width="110px" size="small">

          <el-form-item label="当前商品">
            <div class="product-info-display" @click="openProductSelector">
              <div v-if="editForm.productImg" class="img-box">
                <el-image :src="editForm.productImg" fit="cover" class="p-img"></el-image>
              </div>
              <div v-else class="name-avatar-mini" :style="{backgroundColor: getBgColor(editForm.name)}">
                {{ editForm.name ? editForm.name.substring(0,1) : '商' }}
              </div>

              <div class="info-text">
                <div class="p-name">{{ editForm.name }}{{ editForm.base_weight }}g</div>
                <div class="p-spec">╮(╯▽╰)╭</div>
                <div class="p-spec">点击可以更换商品</div>
              </div>
              <div class="change-tag"><i class="el-icon-refresh"></i> 更换</div>
            </div>
          </el-form-item>

          <el-form-item label="加工服务">
            <el-radio-group v-model="editForm.service" @change="onServiceChange">
              <el-radio-button v-for="s in services" :key="s" :label="s">{{ s }}</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="规格类型" v-if="['卷筒', '整卷切', '来料加工'].includes(editForm.service)">
            <el-radio-group v-model="editForm.isStandard" @change="onSpecTypeChange">
              <el-radio :label="true">{{ editForm.service === '来料加工' ? '张数' : '件数' }}</el-radio>
              <el-radio :label="false">{{ editForm.service === '来料加工' ? '件数' : '吨数' }}</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="幅宽(mm)">
            <el-input type="number" v-model="editForm.w" @input="handleCalc" placeholder="请输入"></el-input>
          </el-form-item>

          <el-form-item v-if="editForm.service !== '卷筒'" label="长度(mm)">
            <el-input type="number" v-model="editForm.h" @input="handleCalc" placeholder="请输入"></el-input>
          </el-form-item>

          <el-form-item v-if="!((editForm.service === '卷筒' || editForm.service === '整卷切') && !editForm.isStandard)">
            <span slot="label">数量({{ getQtyUnitLabel }})</span>
            <el-input type="number" v-model="editForm.qty" @input="handleCalc" placeholder="请输入"></el-input>
          </el-form-item>

          <el-form-item label="重量(吨)">
            <el-input
              type="number"
              v-model="editForm.weight"
              :disabled="!((editForm.service === '卷筒' || editForm.service === '整卷切') && !editForm.isStandard)"
              @input="handleCalc"
              placeholder="计算结果"
            ></el-input>
          </el-form-item>

          <el-form-item label="一开二" v-if="editForm.service === '来料加工'">
            <el-switch v-model="editForm.isDouble" @change="handleCalc"></el-switch>
          </el-form-item>

          <el-form-item label="单价(元/吨)">
            <el-input type="number" v-model="editForm.unit_price" @input="handleCalc" placeholder="请输入"></el-input>
          </el-form-item>

          <div style="background: #fdf6ec; padding: 20px; border-radius: 8px; text-align: right; border: 1px solid #faecd8; margin-top: 10px;">
            <span style="color: #666;">金额小计：</span>
            <span style="font-size: 26px; font-weight: bold; color: #F56C6C;">￥{{ editForm.total }}</span>
          </div>

          <el-divider content-position="left">配送信息</el-divider>

          <el-form-item label="配送方式">
            <el-radio-group v-model="editForm.isSelfPick" @change="handleDeliveryTypeChange">
              <el-radio :label="false">送货上门</el-radio>
              <el-radio :label="true">仓库自提</el-radio>
            </el-radio-group>
          </el-form-item>

          <div v-show="!editForm.isSelfPick">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="收货人">
                  <el-input v-model="editForm.deliveryInfo.receiverName" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号">
                  <el-input v-model="editForm.deliveryInfo.receiverPhone" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="收货地址">
              <el-input type="textarea" v-model="editForm.deliveryInfo.address" />
            </el-form-item>
          </div>

        </el-form>
      </div>
      <div slot="footer">
        <el-button @click="editVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmEdit">确认修改</el-button>
      </div>
    </el-dialog>

    <el-dialog title="选择商品" :visible.sync="selectorOpen" width="1000px" append-to-body custom-class="mall-selector-dialog">
      <div class="selector-container" style="height: 550px; display: flex;">

        <div class="aside-menu" style="width: 200px; background: #f8f9fb; border-right: 1px solid #eee; overflow-y: auto;">
          <el-menu :default-active="selectorQuery.category" @select="handleCategoryChange" style="border:none; background:transparent;">
            <el-menu-item index="ALL">
              <i class="el-icon-menu"></i> 全部品类
            </el-menu-item>
            <el-menu-item v-for="item in categoryOptions" :key="item" :index="item">
              <i class="el-icon-collection-tag"></i> {{ item }}
            </el-menu-item>
          </el-menu>
        </div>

        <div class="main-content" style="flex: 1; padding: 15px; display: flex; flex-direction: column;">
          <div style="margin-bottom: 15px;">
            <el-input
              v-model="selectorQuery.name"
              placeholder="搜索商品名称"
              size="small"
              clearable
              @keyup.enter.native="getSelectorList"
              style="width: 300px;"
            >
              <el-button slot="append" icon="el-icon-search" @click="getSelectorList"></el-button>
            </el-input>
          </div>

          <el-table
            v-loading="selectorLoading"
            :data="selectorList"
            height="400"
            border
            stripe
            size="mini"
            @row-click="selectAndClose"
          >
            <el-table-column label="预览" align="center" width="60">
              <template slot-scope="scope">
                <el-avatar
                  shape="square"
                  :size="30"
                  :src="scope.row.productImg"
                  style="background-color: transparent;"
                >
                  <div
                    v-if="!scope.row.productImg"
                    :style="{
                      backgroundColor: getBgColor(scope.row.name),
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }"
                  >
                    {{ scope.row.name.substring(0,1) }}
                  </div>
                </el-avatar>
              </template>
            </el-table-column>

            <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
            <el-table-column prop="category" label="分类" align="center" />
            <el-table-column prop="base_weight" label="克重(g)" align="center" />

            <el-table-column prop="unit_weight" label="系数" align="center">
              <template slot-scope="scope">
                <el-tag size="mini" type="info">{{ scope.row.unit_weight || 0 }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="操作" align="center" width="80">
              <template><el-button type="text">选择</el-button></template>
            </el-table-column>
          </el-table>

          <div style="margin-top: auto; padding-top: 10px;">
            <pagination
              v-show="selectorTotal > 0"
              :total="selectorTotal"
              :page.sync="selectorQuery.pageNum"
              :limit.sync="selectorQuery.pageSize"
              @pagination="getSelectorList"
            />
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getOrderList, updateOrderStatus, delOrder, shipItem, cancelShipItem, createShipOrder, getShipGroups, exportOrder,
  getPrintOrderCount, getPrintDeliveryCount, countPrintOrder, countPrintDelivery,updateOrderItems
} from "@/api/wx/order";
import { uploadToCloud } from "@/api/wx/common";
import QRCode from "qrcode";
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';
import { listProduct,getProductCategories } from "@/api/wx/product";
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
      expandedShipNos: [],
      groupCurrentPage: 1,
      groupPageSize: 4,
      shipForm: {
        orderId: '', deliveryId: '', deliveryIds: [], shipNo: '',
        deliveryFileImg: '', deliveryFileQrImg: ''
      },
      printVisible: false,
      printData: [],
      // 新增状态
      printType: 'order', // 'order' 或 'delivery'
      printCountLoading: false,
      editVisible: false,
      services: ['卷筒', '整卷切', '零切', '一开二', '来料加工'],
      editingInfo: { orderId: '', itemIndex: -1 },
      editForm: {
        isSelfPick: false,
        deliveryInfo: {
          receiverName: '',
          receiverPhone: '',
          address: ''
        },
      },
      selectorOpen: false,      // 控制更换商品弹窗的显示
      selectorLoading: false,   // 选择器表格加载状态
      selectorList: [],         // 选择器中的商品数据
      selectorTotal: 0,         // 商品总数
      selectorQuery: {          // 选择器的查询参数
        pageNum: 1,
        pageSize: 10,
        name: '',
        category: 'ALL'
      },
      categoryOptions: [],   // 如果你之前没定义分类列表，请取消注释
    };
  },
  computed: {
    /** 获取分类列表 */
    getCategoryList() {
      getProductCategories().then(res => {
        // 假设返回的是字符串数组 ['白卡纸', '铜版纸', ...]
        this.categoryOptions = res.data;
      });
    },
    paginatedGroups() {
      const start = (this.groupCurrentPage - 1) * this.groupPageSize;
      const end = start + this.groupPageSize;
      return this.existingGroups.slice(start, end);
    },
    // 实时切换单位文字
    getQtyUnitLabel() {
      if (!this.editForm) return '';
      const { service, isStandard } = this.editForm;
      if (service === '零切' || service === '一开二') return '张';
      if (service === '来料加工') return isStandard ? '张' : '件';
      return isStandard ? '件' : '张';
    }
  },
  created() {
    this.getList();
  },
  methods: {
// handleEditProduct 负责“加载”原数据
    handleEditProduct(order, item, index) {
      // 1. 记录编辑信息（这里已经存了 orderId）
      this.editingInfo = {
        orderId: order._id,
        itemIndex: index
      };

      // 2. 深拷贝原始数据
      const baseItem = JSON.parse(JSON.stringify(item));

      // 3. 构造完整对象
      const preparedForm = {
        ...baseItem,
        // 【新增】显式保存订单ID在顶层，方便后续提交使用
        orderId: order._id,

        isSelfPick: baseItem.isSelfPick === true,

        // 配送信息初始化
        deliveryInfo: baseItem.deliveryInfo ? {
          ...baseItem.deliveryInfo,
          // 【新增】确保 deliveryId 被拷贝进来（即使它是空字符或null）
          deliveryId: baseItem.deliveryInfo.deliveryId || ''
        } : {
          deliveryId: '', // 初始主键为空
          receiverName: '',
          receiverPhone: '',
          address: '',
          deliveryStatus: '待发货'
        },

        // 规格字段（根据你的逻辑保持原值或设为null）
        w: baseItem.w || null,
        h: baseItem.h || null,
        qty: baseItem.qty || null,
        total: baseItem.total || '0.00'
      };

      // 4. 赋值并打开弹窗
      this.editForm = preparedForm;
      this.editVisible = true;

      console.log("初始化填充完成，检查主键:", {
        orderId: this.editForm.orderId,
        deliveryId: this.editForm.deliveryInfo.deliveryId
      });
    },

    handleDeliveryTypeChange(val) {
      const currentDeliveryId = this.editForm.deliveryInfo ? this.editForm.deliveryInfo.deliveryId : '';

      if (val === true) {
        // 切换到：仓库自提
        this.$set(this.editForm, 'deliveryInfo', {
          deliveryId: currentDeliveryId, // 保留主键
          receiverName: '--',
          receiverPhone: '--',
          address: '仓库自提',
          deliveryStatus: '待发货'
        });
      } else {
        // 切换到：送货上门
        this.$set(this.editForm, 'deliveryInfo', {
          deliveryId: currentDeliveryId, // 保留主键
          receiverName: '',
          receiverPhone: '',
          address: '',
          deliveryStatus: '待发货'
        });
      }
    },
    // 2. 切换服务触发：完全清空数值
    onServiceChange() {
      this.editForm.isStandard = true;
      this.editForm.isDouble = false;
      this.resetAndCalc();
    },

    // 3. 切换模式（件数/张数/吨数）触发：完全清空数值
    onSpecTypeChange() {
      this.resetAndCalc();
    },

    // 内部辅助：重置并刷新
    resetAndCalc() {
      this.editForm.w = null;
      this.editForm.h = null;
      this.editForm.qty = null;
      this.editForm.weight = null;
      this.editForm.unit_price = null;
      this.editForm.total = '0.00';
      this.handleCalc();
    },

    /**
     * 4. 核心计算函数：严格按照 index.js 第 238 行开始的逻辑
     */
    handleCalc() {
      const f = this.editForm;
      if (!f) return;

      // 1. 严格按照小程序 index.js 168-175行的转换逻辑
      const W = parseFloat(f.w || 0);
      const H = parseFloat(f.h || 0);
      const Q = parseFloat(f.qty || 0);
      const G = parseFloat(f.base_weight || 0);
      const X = parseFloat(f.unit_weight || 0);
      const uPrice = parseFloat(f.unit_price || 0);

      let resW = 0;
      const s = f.service;

      // 2. 计算逻辑（严格复刻 index.js 177-195行）
      if (s === '卷筒' || s === '整卷切') {
        if (f.isStandard) {
          // 对应小程序 index.js 177行
          resW = (W * Q * X) / 1000;
        } else {
          resW = parseFloat(f.weight || 0);
        }
      }
      else if (s === '零切' || s === '一开二') {
        // 对应小程序 index.js 185行：注意这里的括号嵌套顺序
        // ((W/1000) * (H/1000) * (G/1000) * Q) / 1000
        resW = ((W / 1000) * (H / 1000) * (G / 1000) * Q) / 1000;
      }
      else if (s === '来料加工') {
        if (f.isStandard) {
          resW = ((W / 1000) * (H / 1000) * (G / 1000) * Q) / 1000;
        } else {
          // 对应小程序 index.js 189行
          resW = (W * X / 1000) * Q;
        }
      }

      // 3. 赋值重量：小程序显示重量是 weightSum.toFixed(3)
      const isManualMode = (s === '卷筒' || s === '整卷切') && !f.isStandard;
      if (!isManualMode) {
        // 小程序 updateCartStatus 里是用 toFixed(3)
        f.weight = resW > 0 ? resW.toFixed(3) : '';
      }

      // 4. 【核心点】计算总价：严格复刻 index.js 200行
      // 注意：小程序在算 total 时，是直接用 resW (原始浮点数) * uPrice，然后再 toFixed(2)
      if (resW > 0 && uPrice > 0) {
        // 这里不要先对 resW 取三位，要直接乘，然后对乘积进行 toFixed(2)
        let total = (resW * uPrice).toFixed(2);
        f.total = total;
      } else {
        f.total = '0.00';
      }

      this.$forceUpdate();
    },


    async confirmEdit() {
      if (!this.editForm) return;

      // 1. 明确提取所有字段（实现彻底平铺）
      const {
        orderId,
        name,
        qty,
        base_weight,
        unit_weight,
        service,
        unit_price,
        weight,
        total,
        w,
        h,
        isDouble,
        isSelfPick,
        warehouse,
        isStandard,
        deliveryInfo // 这是一个对象，下面我们要把它里面的字段也提出来
      } = this.editForm;

      // 2. 提取收货明细中的主键和其他关键字段
      const deliveryId = deliveryInfo ? deliveryInfo.deliveryId : '';
      const receiverName = deliveryInfo ? deliveryInfo.receiverName : '';
      const receiverPhone = deliveryInfo ? deliveryInfo.receiverPhone : '';
      const address = deliveryInfo ? deliveryInfo.address : '';
      const deliveryStatus = deliveryInfo ? deliveryInfo.deliveryStatus : '';

      // 3. 校验关键主键
      if (!orderId || !deliveryId) {
        this.$message.error("提交失败：缺失关键主键 (orderId 或 deliveryId)");
        return;
      }

      try {
        this.$modal.loading("正在保存...");

        // 4. 构造完全平铺的参数对象（明确传哪些）
        const params = {
          orderId,        // 订单主键
          deliveryId,     // 配送主键（用于后端定位数组下标）
          name,           // 产品名称
          qty,            // 数量
          base_weight,    // 克重
          unit_weight,    // 换算系数
          service,        // 加工服务
          unit_price,     // 单价
          weight,         // 重量
          total,          // 总价
          w,              // 宽
          h,              // 高
          isDouble,       // 是否双面
          isSelfPick,     // 是否自提
          warehouse,      // 仓库
          isStandard,     // 是否标准
          receiverName,   // 收货人（原属于 deliveryInfo）
          receiverPhone,  // 电话（原属于 deliveryInfo）
          address,        // 地址（原属于 deliveryInfo）
          deliveryStatus  // 配送状态（原属于 deliveryInfo）
        };

        console.log("平铺后的最终提交参数:", params);

        // 5. 调用 API
        const res = await updateOrderItems(params);

        this.$modal.closeLoading();
        if (res.code === 200 || res.code === 0) {
          this.$message.success('修改成功');
          this.editVisible = false;
          this.getList();
        }
      } catch (err) {
        this.$modal.closeLoading();
        console.error('提交异常:', err);
      }
    },
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
    getUnit(item) {
      const { service, isStandard, unit } = item;
      if (service === '零切' || service === '一开二') return '张';
      if (service === '来料加工') return isStandard ? '张' : '件';
      return isStandard ? '件' : (unit || '吨');
    },
    getList() {
      this.loading = true;

      // 从路由获取 type 参数
      const type = this.$route.query.type;

      // 根据 type 设置仓库名称
      if (type === '1' || type === 1) {
        this.queryParams.warehouse = '直调仓';
      } else if (type === '2' || type === 2) {
        this.queryParams.warehouse = '湛江仓';
      }

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
    handleQuery() { this.queryParams.page = 1; this.getList(); },
    handleSizeChange(val) { this.queryParams.pageSize = val; this.getList(); },
    handleCurrentChange(val) { this.queryParams.page = val; this.getList(); },
    getStatusTag(s) {
      const map = { '待发货': 'warning', '部分发货': 'primary', '全部发货': 'success', '部分收货': 'primary', '已完成': 'success', '已关闭': 'danger', '草稿': 'info' };
      return map[s] || 'info';
    },
    // vxe-table 专用勾选回调
    handleVxeSelectionChange({ records }, orderId) {
      this.$set(this.selectedItems, orderId, records);
    },
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
    handleBatchCancelShip(order) {
      const selections = this.selectedItems[order._id] || [];
      if (selections.length === 0) return;
      const cancelableIds = selections.map(i => i.deliveryInfo.deliveryId);
      this.$confirm(`确定要撤销已勾选的 ${cancelableIds.length} 项发货记录吗？`, "批量撤销确认", { type: "warning" }).then(() => {
        cancelShipItem({ orderId: order._id, deliveryIds: cancelableIds }).then(() => {
          this.$message.success("批量撤销成功");
          this.$set(this.selectedItems, order._id, []);
          this.getList();
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
    handleExport() {
      this.$confirm('是否确认导出当前搜索条件下的所有订单明细?', "导出确认", { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }).then(() => {
        this.loading = true;
        const { page, pageNum, pageSize, ...cleanParams } = this.queryParams;
        return exportOrder(cleanParams);
      }).then(response => {
        const list = response.data;
        if (!list || list.length === 0) {
          this.$modal.msgWarning("没有找到数据");
          this.loading = false;
          return;
        }

        // 1. 创建工作表
        const ws = XLSX.utils.json_to_sheet(list);

        // 2. 计算自动列宽逻辑
        // 获取数据的 key（即表头）
        const header = Object.keys(list[0]);
        const colWidths = header.map(key => {
          // 初始长度：先取表头的长度
          let maxLen = key.toString().length;

          // 遍历该列的所有行，找出最长的一个
          list.forEach(row => {
            const cellValue = row[key] ? row[key].toString() : '';
            // 简单处理：中文字符计 2 个单位长度，英文字符计 1 个
            const cellLen = cellValue.replace(/[^\x00-\xff]/g, '00').length;
            if (cellLen > maxLen) {
              maxLen = cellLen;
            }
          });

          // 设置最大宽度限制（例如最大 50），并增加一点缓冲空间
          return { wch: Math.min(maxLen + 2, 50) };
        });

        // 3. 将计算好的宽度赋值给工作表
        ws['!cols'] = colWidths;

        // 4. 生成并保存文件
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "订单明细");
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        FileSaver.saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `订单导出_${new Date().getTime()}.xlsx`);

        this.loading = false;
      }).catch((err) => {
        console.error(err);
        this.loading = false;
      });
    },
    openGroupDialog(orderId) {
      this.groupVisible = true;
      this.loadingGroups = true;
      this.groupType = 'new';
      this.targetShipNo = '';
      this.expandedShipNos = [];
      this.existingGroups = [];
      getShipGroups(orderId).then(res => { this.existingGroups = res.data || []; }).finally(() => { this.loadingGroups = false; });
    },
    toggleExpand(shipNo) {
      const index = this.expandedShipNos.indexOf(shipNo);
      index > -1 ? this.expandedShipNos.splice(index, 1) : this.expandedShipNos.push(shipNo);
    },
    confirmGrouping() {
      if (this.groupType === 'join' && !this.targetShipNo) { this.$message.warning("请选择一个现有的发货单"); return; }
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
        const resImg = await uploadToCloud(formData);
        this.shipForm.deliveryFileImg = resImg.data.fileID;
        this.isPdfFile = isPdf;
        this.shipPreviewUrl = isPdf ? 'pdf' : URL.createObjectURL(file);
        const payload = { orderId: this.currentOrderId, shipNo: this.groupType === 'join' ? this.targetShipNo : null };
        const resShipOrder = await createShipOrder(payload);
        this.shipForm.shipNo = resShipOrder.data.shipNo;
        const qrBase64 = await QRCode.toDataURL(String(this.shipForm.shipNo), { width: 500, margin: 1 });
        const qrBlob = await (await fetch(qrBase64)).blob();
        const qrFormData = new FormData();
        qrFormData.append('file', qrBlob, 'qr.jpg');
        const resQr = await uploadToCloud(qrFormData);
        this.shipForm.deliveryFileQrImg = resQr.data.fileID;
      } catch (e) { this.$message.error("上传失败"); } finally { this.uploading = false; }
    },
    submitShipAction() {
      if (!this.shipForm.deliveryFileQrImg) { this.$message.warning("二维码生成中..."); return; }
      const payload = {
        orderId: this.currentOrderId, shipNo: this.shipForm.shipNo,
        deliveryFileImg: this.shipForm.deliveryFileImg, deliveryFileQrImg: this.shipForm.deliveryFileQrImg,
        deliveryIds: this.isBatch ? this.shipForm.deliveryIds : [this.shipForm.deliveryId]
      };
      shipItem(payload).then(() => {
        this.$message.success("发货成功");
        this.shipVisible = false;
        if (this.isBatch) this.$set(this.selectedItems, this.currentOrderId, []);
        this.getList();
      });
    },
    async handlePrint(row) {
      this.printType = 'order';
      this.printCountLoading = true;
      const orderCopy = JSON.parse(JSON.stringify(row));
      try {
        const res = await getPrintOrderCount(orderCopy.orderNo);
        orderCopy.printCount = res.data || 0;
      } catch (e) { console.error(e); }
      this.printData = [orderCopy];
      this.printVisible = true;
      this.printCountLoading = false;
    },
    async handlePrintSingleItem(order, item, index) {
      this.printType = 'delivery';
      this.printCountLoading = true;
      const newOrder = JSON.parse(JSON.stringify(order));
      const itemCopy = JSON.parse(JSON.stringify(item));
      itemCopy.printIdx = index + 1;

      try {
        if (itemCopy.deliveryInfo && itemCopy.deliveryInfo.deliveryId) {
          const res = await getPrintDeliveryCount(itemCopy.deliveryInfo.deliveryId);
          itemCopy.printCount = res.data || 0;
        }
      } catch (e) { console.error(e); }

      newOrder.orderItems = [itemCopy];
      this.printData = [newOrder];
      this.printVisible = true;
      this.printCountLoading = false;
    },
    async handlePrintBatchItems(order) {
      this.printType = 'delivery';
      this.printCountLoading = true;
      const selections = this.selectedItems[order._id] || [];
      if (selections.length === 0) return;

      const promises = selections.map(async (item, index) => {
        const o = JSON.parse(JSON.stringify(order));
        const itemCopy = JSON.parse(JSON.stringify(item));
        itemCopy.printIdx = index + 1;
        try {
          if (itemCopy.deliveryInfo && itemCopy.deliveryInfo.deliveryId) {
            const res = await getPrintDeliveryCount(itemCopy.deliveryInfo.deliveryId);
            itemCopy.printCount = res.data || 0;
          }
        } catch (e) { console.error(e); }
        o.orderItems = [itemCopy];
        return o;
      });

      this.printData = await Promise.all(promises);
      this.printVisible = true;
      this.printCountLoading = false;
    },
    doPrint() {
      const printContent = document.getElementById('printArea').innerHTML;
      const windowPrint = window.open('', '', 'width=1100,height=900');
      if (!windowPrint) { this.$message.error("弹出窗口被拦截"); return; }
      windowPrint.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>销售订单明细打印</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: "Microsoft YaHei", sans-serif; margin: 0; padding: 0; color: #1a1a1a; background: #fff; }
              .print-page-wrapper { width: 100%; padding: 20px; page-break-after: always; page-break-inside: avoid; clear: both; }
              .print-page-wrapper:last-child { page-break-after: auto; }
              .print-header-container { text-align: center; margin-bottom: 20px; border-bottom: 3px double #000; padding-bottom: 10px; }
              .print-main-title { font-size: 26px; font-weight: 800; letter-spacing: 5px; margin: 0 0 15px 0; }
              .print-top-info-grid { display: grid; grid-template-columns: 1.2fr 1.2fr 0.8fr 0.8fr; border: 1px solid #000; text-align: left; }
              .info-cell { padding: 6px 8px; border: 0.5px solid #000; font-size: 13px; }

              .print-item-card { border: 2px solid #000; margin-bottom: 15px; border-radius: 4px; overflow: hidden; background: #fff; }
              .card-title-row { background: #f2f2f2; padding: 8px 15px; border-bottom: 1px solid #000; display: flex; align-items: center; gap: 15px; }
              .item-no { background: #000; color: #fff; padding: 2px 10px; border-radius: 3px; font-weight: bold; }
              .item-name { font-weight: 900; font-size: 16px; flex: 1; }

              /* 表格样式 */
              .card-main-body-table { padding: 0; }
              .print-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
              .print-table th, .print-table td { border: 1px solid #000; padding: 10px 5px; text-align: center; font-size: 14px; }
              .print-table th { background: #fafafa; font-weight: bold; }

              .highlight-red { color: #d00; font-weight: bold; }
              .print-remark-area { border: 1px solid #000; padding: 10px; margin-top: 20px; font-size: 14px; background: #fff; }
              @media print {
                @page { size: auto; margin: 10mm; }
                .print-page-wrapper { border: none; margin: 0; height: auto; page-break-after: always !important; -webkit-print-color-adjust: exact; }
                .card-title-row { background-color: #f2f2f2 !important; }
                .print-table th { background-color: #fafafa !important; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      windowPrint.document.close();
      windowPrint.onload = () => {
        windowPrint.focus();
        setTimeout(() => {
          windowPrint.print();
          windowPrint.close();
          // 打印完成后执行计数
          this.afterPrintAction();
        }, 300);
      };
      setTimeout(() => {
        if (windowPrint.document.readyState === 'complete') {
          windowPrint.print();
          windowPrint.close();
          this.afterPrintAction();
        }
      }, 1000);
    },
    async afterPrintAction() {
      // 1. 立即清空/标记，防止重入
      if (this.isProcessingCount) return;
      this.isProcessingCount = true;

      try {
        if (this.printType === 'order') {
          await countPrintOrder(this.printData[0].orderNo);
        } else if (this.printType === 'delivery') {
          // 批量打印时，一次性把所有的 ID 发给后端，或者保证这里只跑一次
          const deliveryIds = this.printData.map(o => o.orderItems[0].deliveryInfo.deliveryId);
          // 建议后端写一个批量计数的接口，或者在这里用 Promise.all
          await Promise.all(deliveryIds.map(id => countPrintDelivery(id)));
        }
      } finally {
        this.isProcessingCount = false;
        this.printVisible = false; // 打印完关闭预览
      }
    },
    // 1. 打开商品选择弹窗
    openProductSelector() {
      this.selectorOpen = true;
      this.selectorQuery.name = ''; // 清空之前的搜索词
      this.selectorQuery.category = 'ALL'; // 重置分类
      this.selectorQuery.pageNum = 1;
      // 关键：打开弹窗时立即调用获取数据的方法
      this.getSelectorList();
      this.getCategoryList();

    },
    /** 获取分类列表 */
    getCategoryList() {
      // 检查这个接口是否成功引入
      getProductCategories().then(res => {
        // 关键：根据你之前的接口风格，res 后面可能需要 .data
        // 请在浏览器控制台看看 console.log(res)，确认分类是在 res.data 还是 res.data.data 里
        console.log("分类接口返回：", res);

        if (res.code === 200) {
          // 如果返回的是 ['白卡纸', '铜版纸'] 这种数组
          this.categoryOptions = res.data;
        }
      }).catch(err => {
        console.error("分类加载失败", err);
      });
    },
    // 2. 获取选择器列表数据 (对接你的 listProduct 接口)
    getSelectorList() {
      this.selectorLoading = true;
      const params = {
        pageNum: this.selectorQuery.pageNum,
        pageSize: this.selectorQuery.pageSize,
        name: this.selectorQuery.name || undefined,
        category: this.selectorQuery.category === 'ALL' ? undefined : this.selectorQuery.category
      };

      listProduct(params).then(response => {
        // 注意：根据你的 JSON 结构，这里要从 response.data 中取值
        if (response.code === 200) {
          this.selectorList = response.data.records; // 对应 JSON 里的 records
          this.selectorTotal = response.data.total;   // 对应 JSON 里的 total
        } else {
          this.$message.error(response.msg || "请求失败");
        }
        this.selectorLoading = false;
      }).catch(err => {
        console.error("加载商品列表失败:", err);
        this.selectorLoading = false;
      });
    },

    // 3. 切换左侧大类
    handleCategoryChange(categoryName) {
      this.selectorQuery.category = categoryName;
      this.selectorQuery.pageNum = 1; // 切换分类重置回第一页
      this.getSelectorList();
    },

    // 4. 确认选择商品并回填到编辑表单
    selectAndClose(row) {
      if (!row) return;

      // 使用 $set 确保响应式更新
      this.$set(this.editForm, 'name', row.name);
      this.$set(this.editForm, 'productImg', row.productImg);
      this.$set(this.editForm, 'base_weight', row.base_weight);
      this.$set(this.editForm, 'category', row.category);
      this.$set(this.editForm, 'unit_weight', row.unit_weight);

      // 如果你的 editForm 需要记录选中的商品 ID
      this.$set(this.editForm, 'productId', row._id);

      if (typeof this.handleCalc === 'function') {
        this.handleCalc();
      }

      this.selectorOpen = false;
      this.$message.success(`已关联：${row.name}`);
    },

    // 5. 获取背景色的辅助函数 (保持和主界面一致)
    getBgColor(name) {
      if (!name) return '#409EFF';
      const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#66b1ff', '#85ce61', '#ebb563', '#f78989'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    }
  }
};
</script>

<style scoped>
/* 确保展开行容器不会收缩 */
::v-deep .el-table__expanded-cell { padding: 0 !important; background-color: #fcfdfe !important; }
.expand-container {
  padding: 20px 30px;
  box-sizing: border-box;
  width: 100%;
  background: #fcfdfe;
  min-height: 200px;
}

/* vxe-table 内部滚动条样式修正 */
.inner-vxe-table {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  background-color: #fff;
}

.inner-title { font-weight: bold; margin-bottom: 12px; color: #333; font-size: 14px; }
.inner-title::before { content: ""; width: 4px; height: 16px; background: #1890ff; display: inline-block; vertical-align: middle; margin-right: 8px; border-radius: 2px; }
.price-text { color: #f5222d; font-weight: bold; }
.pdf-icon-btn { width: 40px; height: 40px; background: #ff4d4f; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border-radius: 4px; cursor: pointer; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.pdf-icon-btn:hover { background: #ff7875; }
.pdf-icon-preview { width: 100%; height: 180px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #ff4d4f; font-weight: bold; border-radius: 8px; }
.table-thumb { width: 40px; height: 40px; border-radius: 4px; border: 1px solid #eee; cursor: pointer; display: block; margin: 0 auto; }
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
.custom-table-wrapper { overflow: hidden; border-radius: 4px; border: 1px solid #ebeef5; }
.custom-pure-table { width: 100%; border-collapse: collapse; background: #fff; font-size: 13px; }
.custom-pure-table th { background: #f8f9fb; padding: 10px; color: #606266; font-weight: bold; border-bottom: 1px solid #ebeef5; text-align: center; }
.custom-pure-table td { padding: 12px 10px; border-bottom: 1px solid #ebeef5; color: #606266; transition: background 0.2s; cursor: pointer; }
.custom-radio { width: 16px; height: 16px; border: 1px solid #dcdfe6; border-radius: 50%; display: inline-block; position: relative; background: #fff; vertical-align: middle; }
.custom-radio.checked { border-color: #409EFF; background: #409EFF; }
.custom-radio.checked::after { content: ""; width: 6px; height: 6px; background: #fff; border-radius: 50%; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }

/* 打印预览容器样式 */
.print-page-wrapper { background: #fff; padding: 20px; color: #333; }
.print-header-container { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
.print-main-title { font-size: 22px; margin-bottom: 10px; }
.print-top-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #000; }
.info-cell { padding: 5px; border: 0.5px solid #000; font-size: 12px; }
.print-item-card { border: 1px solid #000; margin-bottom: 10px; border-radius: 4px; overflow: hidden; }
.card-title-row { background: #eee; padding: 5px 10px; display: flex; align-items: center; border-bottom: 1px solid #000; }
.item-name { font-weight: bold; margin-left: 10px; }

/* 预览态表格 */
.card-main-body-table { padding: 0; }
.print-table { width: 100%; border-collapse: collapse; }
.print-table th, .print-table td { border: 1px solid #000; padding: 8px 4px; text-align: center; font-size: 12px; }

.print-remark-area { border: 1px solid #000; padding: 8px; font-size: 12px; margin-top: 10px; }
.product-info-display {
  display: flex;
  align-items: center;
  background: #f8f9fb;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.product-info-display:hover {
  border-color: #409eff;
  background: #f0f7ff;
}
.img-box, .p-img {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  flex-shrink: 0;
}
.name-avatar-mini {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
}
.info-text {
  margin-left: 12px;
  line-height: 1.4;
  flex: 1;
}
.p-name {
  font-weight: bold;
  color: #303133;
  font-size: 14px;
}
.p-spec {
  font-size: 12px;
  color: #909399;
}
.change-tag {
  font-size: 12px;
  color: #409eff;
  background: #fff;
  border: 1px solid #409eff;
  padding: 2px 8px;
  border-radius: 12px;
}
/* 弹窗整体容器 */
.selector-container {
  display: flex;
  flex-direction: row;
  height: 550px; /* 固定高度，内部滚动 */
  border-top: 1px solid #f0f0f0;
}

/* 左侧分类导航栏 */
.aside-menu {
  width: 200px;
  background-color: #f8f9fb;
  border-right: 1px solid #ebeef5;
  overflow-y: auto;

  .el-menu {
    border-right: none;
    background: transparent;

    .el-menu-item {
      height: 50px;
      line-height: 50px;
      font-size: 14px;
      color: #606266;
      transition: all 0.2s;

      i {
        margin-right: 8px;
        font-size: 16px;
      }

      &:hover {
        background-color: #ecf5ff;
      }

      &.is-active {
        background-color: #fff !important;
        color: #409eff;
        font-weight: bold;
        border-left: 4px solid #409eff;
      }
    }
  }
}

/* 右侧内容主区域 */
.main-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  overflow: hidden;

  /* 搜索栏样式 */
  .search-bar {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
  }

  /* 表格内图片与首字头像 */
  .table-p-avatar {
    width: 36px;
    height: 36px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-weight: bold;
    font-size: 14px;
    margin: 0 auto;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  /* 分页容器居底 */
  .pagination-container {
    margin-top: auto;
    padding-top: 15px;
    text-align: right;
  }
}

/* 覆盖 ElementUI 默认弹框内边距，让侧边栏顶到边缘 */
::v-deep .mall-selector-dialog {
  .el-dialog__body {
    padding: 0 !important;
  }
  .el-dialog__header {
    padding: 15px 20px;
    border-bottom: 1px solid #f0f0f0;
  }
}

/* 自定义表格滚动条样式（可选） */
.aside-menu::-webkit-scrollbar {
  width: 5px;
}
.aside-menu::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}

/* 鼠标悬停表格行变手型 */
::v-deep .el-table__row {
  cursor: pointer;
}
</style>
