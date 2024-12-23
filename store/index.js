import { createStore } from "vuex";

export const store = createStore({
  state: {
    email: "",
    password: "",
  },
  mutations: {
    setEmail(state, email) {
      state.email = email;
    },
    setPassword(state, password) {
      state.password = password;
    },
    clearCredentials(state) {
      state.email = "";
      state.password = "";
    },
  },
  actions: {
    saveCredentials({ commit }, { email, password }) {
      commit("setEmail", email);
      commit("setPassword", password);
    },
    clearCredentials({ commit }) {
      commit("clearCredentials");
    },
  },
  getters: {
    getEmail: (state) => state.email,
    getPassword: (state) => state.password,
  },
});
