<template>
    <div class="container p-4">
        <div v-show="isLoading" class="flex justify-center items-center h-96">
            <div
                class="w-12 h-12 border-4 border-dotted border-gray-900 rounded-full inline-block relative animate-spin">
            </div>
        </div>
        <div v-show="!isLoading">
            <div class="header flex justify-end items-center mb-4">
                <select v-model="selectedRange" @change="fetchChartData"
                    class="border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring focus:ring-blue-300">
                    <option value="30">Last 30 Days</option>
                    <option value="60">Last 60 Days</option>
                    <option value="14">Last 14 Days</option>
                    <option value="7">Last 7 Days</option>
                </select>
            </div>

            <div ref="chartContainer" class="chart-container mb-8"></div>
        </div>
        <div v-if="isLoadingTable" class="flex justify-center items-center h-96">
            <div
                class="w-12 h-12 border-4 border-dotted border-gray-900 rounded-full inline-block relative animate-spin">
            </div>
        </div>
        <div v-if="tableData.length && !isLoadingTable" class="table-container">
            <div class="mb-4 max-w-lg">
                <input type="text" v-model="searchQuery" placeholder="Search by SKU or Product Name"
                    class="border border-gray-300 rounded-md px-3 py-2 text-gray-700 w-full" />
            </div>
            <table class="table-auto w-full border border-gray-300 shadow-sm">
                <thead>
                    <tr class="bg-gray-100 p-4">
                        <th class="px-4 py-2 text-left text-sm font-medium text-gray-600">
                            SKU
                        </th>
                        <th class="px-4 py-2 text-left text-sm font-medium text-gray-600">
                            Product Name
                        </th>
                        <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">
                            {{ selectedColumns[0] }} Sales / Units
                        </th>
                        <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">
                            Refund Rate
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in paginatedData" :key="item.sku" class="hover:bg-gray-50 p-4">
                        <td class="border px-4 py-2 text-sm text-gray-700">
                            {{ item.sku }}
                        </td>
                        <td class="border px-4 py-2 text-sm text-gray-700">
                            {{ item.productName }}
                        </td>
                        <td class="border px-4 py-2 text-sm text-gray-700 text-right">
                            {{ item.sales }} / {{ item.units }}
                        </td>
                        <td class="border px-4 py-2 text-sm text-gray-700 text-right">
                            {{ item.refundRate }}%
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="pagination mt-4 flex justify-end items-center gap-3">
                <button :disabled="currentPage === 1" @click="prevPage"
                    class="px-4 py-2 bg-gray-200 rounded-full text-gray-700 shadow-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold">
                    &lt;
                </button>
                <span
                    class="text-sm bg-blue-600  rounded-full w-[40px] h-[40px] text-white flex justify-center items-center">{{
                        currentPage }}</span>
                <button :disabled="currentPage === maxPage" @click="nextPage"
                    class="px-4 py-2 bg-gray-200 rounded-full text-gray-700 shadow-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold">
                    &gt;
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import Highcharts from "highcharts";

const store = useStore();

const chartContainer = ref(null);
const selectedRange = ref("30");
const isLoading = ref(false);
const isLoadingTable = ref(false);
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
const rowsPerPage = 10;
const currentPage = ref(1);
const searchQuery = ref("");
const runtimeConfig = useRuntimeConfig();
const apiBase = runtimeConfig.public.apiBase;

const userEmail = computed(() => store.getters.getEmail);
const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    console.log('filteredData.value', filteredData.value)

    return filteredData.value.slice(start, end);
});
const maxPage = computed(() => Math.ceil(filteredData.value.length / rowsPerPage));
const filteredData = computed(() => {
    if (!searchQuery.value) return tableData.value;
    return tableData.value.filter(
        (item) =>
            item.sku.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            item.productName.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const formatDateWithDay = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long', // Gün adı
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
};

function formatDate(dateString) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};


const fetchUserInformation = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("Bearer token bulunamadı!");
            return;
        }
        const email = localStorage.getItem("email");
        const response = await $fetch(`${apiBase}/user/user-information`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: {
                email: userEmail.value || email,
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
    isLoading.value = true;
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
                categories: items.map((item) => formatDateWithDay(item.date)),
                profit: items.map((item) => item.profit),
                fbaSales: items.map((item) => item.fbaAmount),
                fbmSales: items.map((item) => item.fbmAmount),
            };

            renderChart(chartData.value);
        } else {
            console.error("Daily Sales API Hatası:", response?.ApiStatusMessage);
        }
    } catch (error) {
        console.error("Chart Veri Çekme Hatası:", error);
    } finally {
        isLoading.value = false;
    }
};

const fetchRefundRates = async (skuList) => {
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
                requestedDay: 0,
            },
        });
        return response?.Data || [];
    } catch (error) {
        console.error("Refund rates fetch error:", error);
        return [];
    }
};

const fetchTableData = async () => {
    console.log("selectedColumns.value", selectedColumns.value);
    if (!selectedColumns.value.length) return;
    const isDaysCompare = selectedColumns.value.length === 2 ? 1 : 0;
    console.log("selectedColumns.value1", selectedColumns.value);
    const [salesDate, salesDate2] = selectedColumns.value;
    console.log("selectedColumns.value2", salesDate);
    isLoadingTable.value = true;
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
                salesDate: formatDate(salesDate),
                salesDate2: formatDate(salesDate2) || null,
                sellerId: sellerId.value,
            },
        });

        if (response?.ApiStatus) {
            const skuList = response.Data.item.skuList || [];
            selectedColumns.value.length === 2 && (selectedColumns.value = []);
            const refundData = await fetchRefundRates(skuList);
            tableData.value = skuList.map((item, index) => ({
                ...item,
                refundRate: refundData[index]?.refundRate || 0,
            }));
        }
    } catch (error) {
        console.error("Table data fetch error:", error);
    } finally {
        isLoadingTable.value = false;
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
        credits: {
            enabled: false,
        },
        xAxis: {
            categories: data.categories,
            crosshair: true,
            labels: {
                rotation: -45,
                style: {
                    fontSize: "10px",
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
                            selectedColumns.value = selectedColumns.value.filter(
                                (d) => d !== date
                            );
                        } else if (selectedColumns.value.length < 2) {
                            selectedColumns.value.push(date);
                        }

                        fetchTableData();
                    },
                },
                stacking: "normal",
                dataLabels: {
                    rotation: -90,
                    enabled: false,
                    align: "center",
                    verticalAlign: "middle",
                    inside: true,
                },
            },
        },
        series: [
            {
                name: "Profit",
                data: data.profit,
                color: "#2dd4bf",
            },
            {
                name: "FBA Sales",
                data: data.fbaSales,
                color: "#6366f1",
            },
            {
                name: "FBM Sales",
                data: data.fbmSales,
                color: "#4f46e5",
            },
        ],
    });
};

const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
    if (currentPage.value < maxPage.value) currentPage.value++;
};

onMounted(async () => {
    await fetchUserInformation();
    await fetchChartData();
});
</script>
