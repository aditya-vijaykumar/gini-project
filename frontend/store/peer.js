import axios from 'axios'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'

export const state = () => ({
  address: '',
})

export const mutations = {
  setPeerAddress(state, payload) {
    state.address = payload.address
  },
}

export const actions = {
  async connectWeb3Modal({ rootState, commit }) {
    try {
      const providerOptions = {
        walletconnect: {
          package: WalletConnectProvider, // required
          options: {
            infuraId: 'e455e5fdffb8463295a0f641346994d8', // required
          },
        },
      }
      const web3Modal = new Web3Modal({
        network: 'mainnet', // optional
        cacheProvider: true, // optional
        providerOptions, // required
      })
      const ethereumProvider = await web3Modal.connect()
      const accounts = await ethereumProvider.request({
        method: 'eth_requestAccounts',
      })
      const address = accounts[0]
      commit('setPeerAddress', { address })
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  },
}
