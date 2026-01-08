<template>
  <div class="app-container dashboard-page">
    <h2 class="page-title">📊 实时运营大数据看板</h2>

    <el-row :gutter="20" class="metric-row">
      <el-col :span="6" v-for="(item, index) in metrics" :key="index">
        <el-card shadow="hover" :class="['metric-card', item.type]">
          <div class="metric-info">
            <div class="label">{{ item.label }}</div>
            <div class="value">{{ item.value }}<span class="unit">{{ item.unit }}</span></div>
            <div class="trend">
              环比上月 <i :class="item.trend > 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
              {{ Math.abs(item.trend) }}%
            </div>
          </div>
          <i :class="[item.icon, 'card-icon']"></i>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card shadow="hover" class="chart-box">
          <div slot="header" class="header">
            <span>📈 年度销售趋势分析 (吨/万元)</span>
          </div>
          <div ref="lineChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="chart-box">
          <div slot="header" class="header">
            <span>🍕 纸张品类出货占比</span>
          </div>
          <div ref="pieChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-box">
          <div slot="header" class="header">
            <span>📊 核心大客户采购排名 (TOP 7)</span>
          </div>
          <div ref="barChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-box">
          <div slot="header" class="header">
            <span>⏱️ 仓库实时待出库清单</span>
          </div>
          <el-table :data="orderData" height="350" size="small" stripe>
            <el-table-column prop="time" label="下单时间" width="100" />
            <el-table-column prop="customer" label="客户" show-overflow-tooltip />
            <el-table-column prop="product" label="规格" />
            <el-table-column prop="weight" label="重量(T)" width="80" />
            <el-table-column label="状态" width="90">
              <template slot-scope="scope">
                <el-tag :type="scope.row.status === '紧急' ? 'danger' : 'primary'" size="mini">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'PaperIndustryDashboard',
  data() {
    return {
      metrics: [
        { label: '本月营收额', value: '1,284.5', unit: '万', trend: 12.5, type: 'revenue', icon: 'el-icon-money' },
        { label: '累计销量', value: '8,420', unit: '吨', trend: 8.2, type: 'sales', icon: 'el-icon-truck' },
        { label: '新增订单', value: '156', unit: '笔', trend: -2.1, type: 'orders', icon: 'el-icon-s-order' },
        { label: '库存余量', value: '3,200', unit: '吨', trend: 5.4, type: 'stock', icon: 'el-icon-box' }
      ],
      orderData: [
        { time: '14:20', customer: '晨鸣出版集团', product: '80g 双胶纸卷筒', weight: '32.5', status: '紧急' },
        { time: '14:35', customer: '得力办公供应站', product: 'A4 复印纸(白)', weight: '12.0', status: '正常' },
        { time: '15:10', customer: '顺丰包装部', product: '250g 灰底白板纸', weight: '55.0', status: '待排期' },
        { time: '15:45', customer: '上海华印包装', product: '120g 牛皮纸', weight: '8.4', status: '紧急' },
        { time: '16:00', customer: '天猫超市供应商', product: '提纸/卷纸', weight: '22.1', status: '正常' }
      ]
    };
  },
  mounted() {
    this.initCharts();
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    initCharts() {
      // 1. 曲线图 - 销售趋势分析
      const lineChart = echarts.init(this.$refs.lineChart);
      lineChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['销量(吨)', '营收(万元)'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'] },
        yAxis: { type: 'value' },
        series: [
          { name: '销量(吨)', type: 'line', smooth: true, data: [800, 1200, 950, 1500, 1800, 2100, 1900], color: '#409EFF', areaStyle: { opacity: 0.1 } },
          { name: '营收(万元)', type: 'line', smooth: true, data: [450, 680, 520, 890, 1100, 1300, 1200], color: '#67C23A', areaStyle: { opacity: 0.1 } }
        ]
      });

      // 2. 饼图 - 品类分布
      const pieChart = echarts.init(this.$refs.pieChart);
      pieChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [{
          name: '出货品类',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: [
            { value: 1048, name: '双胶纸', itemStyle: { color: '#409EFF' } },
            { value: 735, name: '白卡纸', itemStyle: { color: '#67C23A' } },
            { value: 580, name: '铜版纸', itemStyle: { color: '#E6A23C' } },
            { value: 484, name: '包装纸', itemStyle: { color: '#F56C6C' } },
            { value: 300, name: '特种纸', itemStyle: { color: '#909399' } }
          ]
        }]
      });

      // 3. 柱状图 - 大客户排名
      const barChart = echarts.init(this.$refs.barChart);
      barChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: ['客户A', '客户B', '客户C', '客户D', '客户E', '客户F', '客户G'] },
        series: [{
          name: '采购金额(万)',
          type: 'bar',
          data: [120, 200, 150, 80, 70, 110, 130],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          emphasis: { itemStyle: { color: '#2f89cf' } }
        }]
      });
    },
    handleResize() {
      const charts = [this.$refs.lineChart, this.$refs.pieChart, this.$refs.barChart];
      charts.forEach(ref => {
        const chart = echarts.getInstanceByDom(ref);
        if (chart) chart.resize();
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.dashboard-page {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;

  .page-title { margin-bottom: 20px; font-weight: bold; color: #333; }

  // 指标卡片
  .metric-card {
    height: 110px;
    border: none;
    border-radius: 8px;
    position: relative;
    display: flex;
    align-items: center;
    .metric-info {
      .label { font-size: 14px; color: #909399; margin-bottom: 8px; }
      .value { font-size: 28px; font-weight: bold; color: #303133; .unit { font-size: 14px; margin-left: 4px; } }
      .trend { font-size: 12px; margin-top: 5px; color: #606266; i { font-weight: bold; } .el-icon-top { color: #f56c6c; } .el-icon-bottom { color: #67c23a; } }
    }
    .card-icon { position: absolute; right: 20px; top: 30px; font-size: 40px; opacity: 0.1; }
  }

  // 不同指标的侧边条颜色
  .revenue { border-left: 5px solid #67C23A; }
  .sales { border-left: 5px solid #409EFF; }
  .orders { border-left: 5px solid #E6A23C; }
  .stock { border-left: 5px solid #F56C6C; }

  .chart-row { margin-top: 20px; }
  .chart-box { border-radius: 8px; .header { font-weight: bold; display: flex; align-items: center; } }
}
</style>
