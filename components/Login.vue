<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
            <form @submit.prevent="handleLogin" class="space-y-4">
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input id="email" type="text" v-model="email" placeholder="Email"
                        class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required />
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input id="password" type="password" v-model="password" placeholder="Password"
                        class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required />
                </div>
                <button type="submit"
                    class="w-full py-2 px-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Login
                </button>
            </form>
            <div v-if="error" class="mt-4 text-red-500 text-sm">
                <p>{{ error }}</p>
            </div>
            <div v-if="response" class="mt-4 text-green-500 text-sm">
                <p>Login successful!</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { checkLogout, setLogoutTimer } from '~/utils/logout';

const store = useStore();
const router = useRouter();

const runtimeConfig = useRuntimeConfig();
const apiBase = runtimeConfig.public.apiBase;

const email = ref(""); 
const password = ref(""); 
const accessToken = ref(""); 
const error = ref(""); 

const handleLogin = async () => {
    try {
        store.dispatch("saveCredentials", {
            email: email.value,
            password: password.value,
        });
        const result = await $fetch(`${apiBase}/oauth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: {
                Email: email.value,
                Password: password.value,
                GrantType: "password",
                Scope: "amazon_data",
                ClientId: "C0001",
                ClientSecret: "SECRET0001",
                RedirectUri: "https://api.eva.guru",
            },
        });

        if (result?.ApiStatusCode === 200 && result?.Data?.AccessToken) {
            accessToken.value = result.Data.AccessToken;
            localStorage.setItem("accessToken", accessToken.value);
            localStorage.setItem("email", email.value);
            checkLogout();
            setLogoutTimer();
            await router.push("/dashboard");

        } else {
            error.value = result?.ApiStatusMessage || "Login failed. Please try again.";
        }
    } catch (err) {
        error.value = "Login failed. Please check your credentials.";
    }
};
</script>
