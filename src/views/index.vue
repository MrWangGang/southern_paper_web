<template>
  <div class="app-container dashboard-page">

    <h2 class="page-title">🎉 酒吧运营仪表盘 (纯 Element UI)</h2>

    <el-row :gutter="20" class="metric-row">
      <el-col :span="12">
        <el-card shadow="hover" class="metric-card metric-revenue">
          <div class="card-header">
            <i class="el-icon-money" style="color: #67C23A; font-size: 20px; margin-right: 8px;"></i>
            <span class="header-text">总营收金额 (RMB)</span>
          </div>
          <div class="metric-value">¥ {{ totalRevenue.toLocaleString() }}</div>
          <div class="metric-desc">
            <el-tag type="success" size="small">今日营收: ¥{{ todayRevenue.toLocaleString() }}</el-tag>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="metric-card metric-users">
          <div class="card-header">
            <i class="el-icon-user-solid" style="color: #409EFF; font-size: 20px; margin-right: 8px;"></i>
            <span class="header-text">总用户数量 (人)</span>
          </div>
          <div class="metric-value">{{ totalUsers.toLocaleString() }}</div>
          <div class="metric-desc">
            <el-tag type="primary" size="small">昨日新增: {{ newUserCount }}</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="pending-row">
      <el-col :span="8">
        <el-card shadow="always" class="pending-card card-store">
          <div class="pending-label">门店订单 待处理</div>
          <div class="pending-count">{{ pendingOrders.store }}</div>
          <el-button type="danger" size="small" @click="goToOrderList('store')">立即处理</el-button>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="always" class="pending-card card-reservation">
          <div class="pending-label">预订订单 待确认</div>
          <div class="pending-count">{{ pendingOrders.reservation }}</div>
          <el-button type="warning" size="small" @click="goToOrderList('reservation')">立即处理</el-button>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="always" class="pending-card card-cocktail">
          <div class="pending-label">调酒订单 待制作</div>
          <div class="pending-count">{{ pendingOrders.cocktail }}</div>
          <el-button type="primary" size="small" @click="goToOrderList('cocktail')">立即查看</el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <div slot="header" class="card-title-icon">
            <i class="el-icon-s-flag" style="color: #F56C6C; font-size: 18px; margin-right: 8px;"></i>
            <span>客流高峰与热卖时段分析</span>
          </div>
          <div class="table-analysis-box">
            <el-table :data="trafficPeakData.tableData" max-height="300" border size="small" :row-class-name="tableRowClassName">
              <el-table-column prop="timeSlot" label="时段" width="100" />
              <el-table-column prop="orderCount" label="订单量" width="100" />
              <el-table-column prop="guestCount" label="客流人数" />
              <el-table-column label="分析" width="150">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.isPeak" type="danger" size="small">高峰期</el-tag>
                  <el-tag v-else-if="scope.row.isHigh" type="warning" size="small">热销期</el-tag>
                  <el-tag v-else type="info" size="small">正常</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div slot="header" class="card-title-icon">
            <i class="el-icon-pie-chart" style="color: #E6A23C; font-size: 18px; margin-right: 8px;"></i>
            <span>订单来源/类型占比分析</span>
          </div>
          <div class="progress-list-box">
            <div v-for="item in orderSourceAnalysis" :key="item.name" class="progress-item">
              <div class="progress-label">
                <span>{{ item.name }} (¥{{ item.value.toLocaleString() }})</span>
                <span>{{ item.percentage }}%</span>
              </div>
              <el-progress :percentage="item.percentage" :stroke-width="12" :color="item.color" :show-text="false" />
            </div>
            <div class="total-revenue-sum">总营收贡献：¥{{ totalOrderRevenue.toLocaleString() }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div slot="header" class="card-title-icon">
            <i class="el-icon-trophy" style="color: #409EFF; font-size: 18px; margin-right: 8px;"></i>
            <span>🔥 TOP 5 热销饮品/套餐</span>
          </div>
          <div class="chart-box-small">
            <el-table :data="topSellingList" style="width: 100%" max-height="250" size="small" stripe>
              <el-table-column prop="rank" label="排名" width="80" />
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="sales" label="销量" width="100" />
              <el-table-column prop="revenue" label="贡献营收(¥)" />
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <div slot="header" class="card-title-icon">
            <i class="el-icon-user" style="color: #67C23A; font-size: 18px; margin-right: 8px;"></i>
            <span>会员营销效果追踪 (新增/复购率)</span>
          </div>
          <div class="table-analysis-box">
            <el-table :data="memberRoiData" max-height="300" border size="small">
              <el-table-column prop="month" label="月份" width="100" />
              <el-table-column prop="newMembers" label="新增会员 (人)" />
              <el-table-column prop="retentionRate" label="复购率" width="120">
                <template slot-scope="scope">
                  <span :style="{ color: scope.row.retentionRateValue > 20 ? '#67C23A' : '#E6A23C' }">{{ scope.row.retentionRate }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="yoyChange" label="环比变化" width="150">
                <template slot-scope="scope">
                  <i v-if="scope.row.yoyChange > 0" class="el-icon-top" style="color: #F56C6C;"></i>
                  <i v-else-if="scope.row.yoyChange < 0" class="el-icon-bottom" style="color: #67C23A;"></i>
                  <span :style="{ color: scope.row.yoyChange !== 0 ? (scope.row.yoyChange > 0 ? '#F56C6C' : '#67C23A') : '#909399' }">
                            {{ Math.abs(scope.row.yoyChange) }}%
                        </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script>
export default {
  name: 'DashboardIndex',
  data() {

    // 1. 原始客流高峰数据
    const trafficPeakRaw = {
      timeSlots: ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'],
      orderCount: [5, 12, 35, 80, 110, 150, 130, 85, 40],
      guestCount: [10, 25, 60, 150, 220, 300, 250, 180, 90],
    };

    // 计算峰值
    const maxOrder = Math.max(...trafficPeakRaw.orderCount);
    const maxGuest = Math.max(...trafficPeakRaw.guestCount);

    // 格式化为客流高峰表格数据
    const trafficPeakTableData = trafficPeakRaw.timeSlots.map((time, index) => {
      const order = trafficPeakRaw.orderCount[index];
      const guest = trafficPeakRaw.guestCount[index];
      const isPeak = order === maxOrder || guest === maxGuest;
      const isHigh = order > (maxOrder * 0.7) || guest > (maxGuest * 0.7); // 70%以上算热销

      return {
        timeSlot: time,
        orderCount: order,
        guestCount: guest,
        isPeak: isPeak,
        isHigh: isHigh && !isPeak
      };
    });

    // 2. 订单类型占比数据
    const orderSourceData = [
      { value: 550000, name: '门店订单', color: '#409EFF' },
      { value: 320000, name: '预订订单', color: '#67C23A' },
      { value: 180000, name: '调酒订单', color: '#E6A23C' },
      { value: 50000, name: '外卖平台订单', color: '#F56C6C' },
    ];
    const totalOrderRevenue = orderSourceData.reduce((sum, item) => sum + item.value, 0);

    // 计算占比
    const orderSourceAnalysis = orderSourceData.map(item => {
      const percentage = parseFloat(((item.value / totalOrderRevenue) * 100).toFixed(1));
      return {
        ...item,
        percentage: percentage
      };
    }).sort((a, b) => b.value - a.value);

    // 3. 会员营销效果数据
    const memberRoiData = [
      { month: '7月', newMembers: 500, retentionRateValue: 15, yoyChange: 0 },
      { month: '8月', newMembers: 750, retentionRateValue: 18, yoyChange: 20.0 },
      { month: '9月', newMembers: 620, retentionRateValue: 17, yoyChange: -10.0 },
      { month: '10月', newMembers: 880, retentionRateValue: 20, yoyChange: 17.6 },
      { month: '11月', newMembers: 950, retentionRateValue: 22, yoyChange: 10.0 },
    ].map(item => ({
      ...item,
      retentionRate: `${item.retentionRateValue}%`
    }));


    return {
      // 关键指标
      totalUsers: 128500,
      totalRevenue: 25321000,
      newUserCount: 350,
      todayRevenue: 22800,

      // 待处理订单数量
      pendingOrders: {
        store: 5,
        reservation: 12,
        cocktail: 8
      },

      // 列表数据 (TOP 5)
      topSellingList: [
        { rank: 1, name: '招牌特调鸡尾酒', sales: 1280, revenue: 120000 },
        { rank: 2, name: 'VIP尊享套餐A', sales: 950, revenue: 95000 },
        { rank: 3, name: '经典威士忌 (单杯)', sales: 780, revenue: 65000 },
        { rank: 4, name: '果味精酿啤酒', sales: 620, revenue: 45000 },
        { rank: 5, name: '烤肉拼盘', sales: 510, revenue: 38000 },
      ],

      // 分析数据
      trafficPeakData: { tableData: trafficPeakTableData },
      orderSourceAnalysis,
      totalOrderRevenue,
      memberRoiData,
    };
  },
  methods: {
    goToOrderList(type) {
      this.$modal.msg(`正在跳转到 ${type} 订单列表...`);
    },
    // 客流高峰表格行高亮样式
    tableRowClassName({row}) {
      if (row.isPeak) {
        return 'peak-row';
      } else if (row.isHigh) {
        return 'high-row';
      }
      return '';
    }
  }
};
</script>

<style lang="scss" scoped>
/* ======================== 核心布局样式 ======================== */
.dashboard-page {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px - 20px);
}
.page-title {
  font-size: 26px; font-weight: bold; color: #303133; margin-bottom: 25px; padding-bottom: 5px; border-bottom: 2px solid #EBEEF5;
}

.metric-row, .pending-row, .chart-row {
  margin-bottom: 30px;
}
.chart-card { min-height: 400px; }
.card-title-icon { display: flex; align-items: center; font-size: 16px; font-weight: 500; color: #303133; }
.table-analysis-box { max-height: 300px; overflow-y: auto; }

/* 关键指标卡片样式 */
.metric-card {
  padding: 10px 20px;
  border-radius: 8px;
  background: white;
  height: 150px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  border-left: 5px solid transparent;
}
.metric-card:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1); }
.metric-revenue { border-left-color: #67C23A; }
.metric-users { border-left-color: #409EFF; }
.metric-card .card-header { display: flex; align-items: center; font-size: 14px; color: #909399; }
.metric-value { font-size: 44px; font-weight: bold; margin: 15px 0 10px 0; letter-spacing: 1px; }
.metric-desc { font-size: 14px; }

/* 待处理订单卡片样式 */
.pending-card {
  text-align: center;
  padding: 15px 0;
  border-radius: 8px;
  background-color: #ffffff;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.pending-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transform: scale(1.02); }
.pending-label { font-size: 14px; color: #606266; margin-bottom: 5px; }
.pending-count { font-size: 36px; font-weight: bold; margin-bottom: 10px; }
.card-store .pending-count { color: #F56C6C; }
.card-reservation .pending-count { color: #E6A23C; }
.card-cocktail .pending-count { color: #409EFF; }


/* ======================== 分析组件样式 ======================== */

/* 客流高峰表格自定义行样式 */
::v-deep .el-table {
  .peak-row {
    background: #fef0f0 !important; /* 红色系高亮 */
    font-weight: bold;
  }
  .high-row {
    background: #fdf5e6 !important; /* 黄色系高亮 */
  }
}

/* 订单来源进度条列表样式 */
.progress-list-box {
  padding: 10px 20px;
}
.progress-item {
  margin-bottom: 20px;
}
.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}
.total-revenue-sum {
  text-align: right;
  margin-top: 15px;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
</style>
