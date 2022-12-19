import axios from 'axios'

export const state = () => ({
  address: '',
})

export const mutations = {
  setPeerAddress(state, payload) {
    state.address = payload.address
  },
}

export const actions = {
  async refreshClientDetails({ rootState, commit }) {
    // code
  },
}
