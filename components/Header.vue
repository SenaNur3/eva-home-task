<template>
    <div class="flex items-center justify-between w-full p-4">
        <h1 class="text-center text-2xl font-bold mb-4 mt-4">Sales Dashboard</h1>
        <div>
         <button @click="handleLogout" class="w-full py-2 px-4 text-white bg-red-400 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Logout</button>
        </div>
    </div>
</template>

<script setup>
import { logout } from '~/utils/logout';

const handleLogout = () => {
  logout();
};
</script>