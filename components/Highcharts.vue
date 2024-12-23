<template>
    <div class="chart-wrapper">
        <div class="header flex justify-between items-center">
            <h2 class="text-xl font-bold">Daily Sales</h2>
            <select v-model="selectedRange" @change="fetchChartData" class="dropdown">
                <option value="30">Last 30 Days</option>
                <option value="60">Last 60 Days</option>
                <option value="14">Last 14 Days</option>
                <option value="7">Last 7 Days</option>
            </select>
        </div>
        <div ref="chartContainer" class="chart-container"></div>


        <div v-if="tableData.length" class="table-container">
            <table class="table-auto w-full mt-4 border">
                <thead>
                    <tr>
                        <th class="border px-4 py-2">SKU</th>
                        <th class="border px-4 py-2">Product Name</th>
                        <th class="border px-4 py-2">Sales</th>
                        <th class="border px-4 py-2">Units</th>
                        <th class="border px-4 py-2">Refund Rate</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in paginatedData" :key="item.sku">
                        <td class="border px-4 py-2">{{ item.sku }}</td>
                        <td class="border px-4 py-2">{{ item.productName }}</td>
                        <td class="border px-4 py-2">{{ item.sales }}</td>
                        <td class="border px-4 py-2">{{ item.units }}</td>
                        <td class="border px-4 py-2">{{ item.refundRate }}%</td>
                    </tr>
                </tbody>
            </table>
            <div class="pagination mt-4 flex justify-between items-center">
                <button :disabled="currentPage === 1" @click="prevPage" class="btn">Previous</button>
                <span>Page {{ currentPage }}</span>
                <button :disabled="currentPage === maxPage" @click="nextPage" class="btn">Next</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import Highcharts from "highcharts";


const store = useStore();


const userEmail = computed(() => store.getters.getEmail);


const chartContainer = ref(null);
const selectedRange = ref("30");

const runtimeConfig = useRuntimeConfig();
const apiBase = runtimeConfig.public.apiBase;

const chartData = ref({
    categories: [],
    profit: [],
    fbaSales: [],
    fbmSales: [],
});
const tableData = ref([]);

const marketplaceName = ref("");
const sellerId = ref("");
const selectedColumns = ref([]);

const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return tableData.value.slice(start, end);
});

const rowsPerPage = 10; 
const currentPage = ref(1);
const maxPage = computed(() => Math.ceil(tableData.value.length / rowsPerPage));

const fetchUserInformation = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("Bearer token bulunamadı!");
            return;
        }

        const response = await $fetch(`${apiBase}/user/user-information`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: {
                email: userEmail.value, 
            },
        });

        if (response?.ApiStatus) {
            marketplaceName.value = response.Data.user.store[0].marketplaceName;
            sellerId.value = response.Data.user.store[0].storeId;
        } else {
            console.error("User Information API Hatası:", response.ApiStatusMessage);
        }
    } catch (error) {
        console.error("User Information Veri Çekme Hatası:", error);
    }
};


const fetchChartData = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("Bearer token bulunamadı!");
            return;
        }

        const response = await $fetch(`${apiBase}/data/daily-sales-overview`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: {
                marketplace: marketplaceName.value,
                sellerId: sellerId.value,
                requestStatus: 0,
                day: parseInt(selectedRange.value),
                excludeYoData: true,
            },
        });

        if (response?.ApiStatus) {
            const items = response.Data.item || [];

           
            chartData.value = {
                categories: items.map((item) => item.date), 
                profit: items.map((item) => item.profit), 
                fbaSales: items.map((item) => item.fbaAmount),
                fbmSales: items.map((item) => item.fbmAmount), 
            };

            renderChart(chartData.value); // Verileri grafik ile render et
        } else {
            console.error("Daily Sales API Hatası:", response.ApiStatusMessage);
        }
    } catch (error) {
        console.error("Chart Veri Çekme Hatası:", error);
    }
};
const fetchRefundRates = async (skuList) => {
    console.log('3',skuList)
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("Bearer token bulunamadı!");
            return;
        }
        const response = await $fetch(`${apiBase}/data/get-sku-refund-rate`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: {
                skuList,
                marketplace: marketplaceName.value,
                sellerId: sellerId.value,
                requestedDay: 0
            },
        });
        return response.Data || [];
    } catch (error) {
        console.error("Refund rates fetch error:", error);
        return [];
    }
};
const fetchTableData = async () => {
    console.log(selectedColumns.value)
    if (!selectedColumns.value.length) return;

    const isDaysCompare = selectedColumns.value.length === 2 ? 1 : 0;
    const [salesDate, salesDate2] = selectedColumns.value;
    console.log(salesDate)
    console.log(salesDate2)
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("Bearer token bulunamadı!");
            return;
        }
        const response = await $fetch(`${apiBase}/data/daily-sales-sku-list`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: {
                isDaysCompare,
                marketplace: marketplaceName.value,
                pageNumber: Math.ceil(currentPage.value / 3),
                pageSize: 30,
                salesDate,
                salesDate2: salesDate2 || null,
                sellerId: sellerId.value,
            },
        });

        if (response?.ApiStatus) {
            const skuList = response.Data.item.skuList || [];
            console.log('2',skuList)
            console.log('1',response.Data.item.skuList)
            const refundData = await fetchRefundRates(skuList);
            tableData.value = skuList.map((item, index) => ({
                ...item,
                refundRate: refundData[index]?.refundRate || 0,
            }));
        }
    } catch (error) {
        console.error("Table data fetch error:", error);
    }
};


const renderChart = (data) => {
    Highcharts.chart(chartContainer.value, {
        chart: {
            type: "column",
        },
        title: {
            text: "",
        },
        xAxis: {
            categories: data.categories,
            crosshair: true,
            labels: {
                rotation: -45,
                style: {
                    fontSize: "13px",
                    fontFamily: "Verdana, sans-serif",
                },
            },
        },
        yAxis: {
            min: 0,
            labels: {
                formatter() {
                    return `${this.value / 1000}k`;
                },
                style: {
                    fontSize: "12px",
                },
            },
            title: {
                text: "Amount ($)",
            },
            stackLabels: {
                enabled: true,
                rotation: -90,
                style: {
                    fontWeight: "bold",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    textOutline: "0px",
                },
                verticalAlign: "middle",
                align: "center",
                formatter() {
                    return `${this.total}`;
                },
            },
        },
        tooltip: {
            shared: true,
            useHTML: true,
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat:
                '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>${point.y}</b></td></tr>',
            footerFormat: "</table>",
        },
        plotOptions: {
            column: {
                events: {
                    click(e) {
                        const date = e.point.category;

                        if (selectedColumns.value.includes(date)) {
                            selectedColumns.value = selectedColumns.value.filter((d) => d !== date);
                        } else if (selectedColumns.value.length < 2) {
                            selectedColumns.value.push(date);
                        }

                        fetchTableData(); // Fetch table data
                    },
                },
                stacking: "normal",
                dataLabels: {
                    rotation: -90,
                    enabled: false,
                    align: "center", // Ortaya hizala
                    verticalAlign: "middle",
                    inside: true,
                },
            },
        },
        series: [
            {
                name: "Profit",
                data: data.profit,
                color: "#50B432",
            },
            {
                name: "FBA Sales",
                data: data.fbaSales,
                color: "#7CB5EC",
            },
            {
                name: "FBM Sales",
                data: data.fbmSales,
                color: "#434348",
            },
        ],
    });
};
const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value -= 1;
    }
};

const nextPage = () => {
    if (currentPage.value < maxPage.value) {
        currentPage.value += 1;
    }
};

onMounted(async () => {
    await fetchUserInformation();
    await fetchChartData();
});
</script>
