import { ethers } from 'ethers'
import { contract } from './config/abi.json'
import {
  appreciatePeerBySender,
  getBothTokenBalancesForAddress,
  getEthersProvider,
  getLeaderBoard,
  getRegistrationDoc,
  setRegistrationDoc,
} from '../utils/index'

export const state = () => ({
  address: '',
  walletConnected: false,
  isWhitelisted: false,
  isRegistrationPending: false,
  isRegistrationCompleted: false,
  profile: {},
  profileGAT: 0,
  profileGXP: 0,
  leaderBoard: [],
})

export const mutations = {
  setAddress(state, payload) {
    state.address = payload.address
    state.walletConnected = payload.walletConnected
  },
  setWhitelisted(state, payload) {
    state.isWhitelisted = payload.isWhitelisted
  },
  setProfile(state, payload) {
    state.profile = payload.profile
  },
  setProfileBalances(state, payload) {
    state.profileGAT = payload.profileGAT
    state.profileGXP = payload.profileGXP
  },
  setLeaderBoardTable(state, payload) {
    state.leaderBoard = payload.leaderBoard
  },
  setRegistrationPending(state, payload) {
    state.isRegistrationPending = payload.isRegistrationPending
  },
  setRegistrationCompleted(state, payload) {
    state.isRegistrationCompleted = payload.isRegistrationCompleted
  },
  clearAddress(state) {
    state.address = ''
    state.walletConnected = false
  },
}

export const actions = {
  async connectWallet({ commit }) {
    try {
      const { success, provider, address } = await getEthersProvider()
      if (!success || provider == null) {
        throw new Error('Provider not found')
      }
      commit('setAddress', {
        address,
        walletConnected: true,
      })
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  },
  async checkForWhitelistOnly({ commit, dispatch }) {
    try {
      const { success, provider, address } = await getEthersProvider()

      if (!success || provider == null) {
        throw new Error('Provider not found')
      }
      commit('setAddress', {
        address,
        walletConnected: true,
      })

      const giniMaster = new ethers.Contract(
        contract.address,
        contract.abi,
        provider
      )
      const isWhitelisted = await giniMaster.isAddressAPeer(address)
      console.log('isWhitelisted ', isWhitelisted)
      commit('setWhitelisted', { isWhitelisted })

      if (isWhitelisted) {
        dispatch('fetchAndStoreProfile')
        dispatch('getGiniBalancesForConnectedWallet')
        dispatch('getLeaderBoardForDisplay')
      }
    } catch (error) {
      console.error(error)
    }
  },
  async fetchAndStoreProfile({ commit, state }) {
    try {
      const { exists, data } = await getRegistrationDoc(state.address)
      if (!exists) {
        console.error('Could not get profile details')
        commit('setProfile', { profile: {} })
      } else {
        console.log('Profile')
        console.log(data)
        commit('setProfile', { profile: data })
      }
    } catch (error) {
      console.error(error)
    }
  },
  async checkForRegistrations({ commit }) {
    try {
      const { success, provider, address } = await getEthersProvider()

      if (!success || provider == null) {
        throw new Error('Provider not found')
      }

      const giniMaster = new ethers.Contract(
        contract.address,
        contract.abi,
        provider
      )
      const isWhitelisted = await giniMaster.isAddressAPeer(address)
      console.log('isWhitelisted ', isWhitelisted)
      commit('setWhitelisted', { isWhitelisted })

      if (!isWhitelisted) {
        const registrationDoc = await getRegistrationDoc(address)
        if (!registrationDoc.exists) {
          console.log('Peer is yet to register')
          commit('setRegistrationPending', { isRegistrationPending: false })
        } else {
          if (registrationDoc.data.registered) {
            console.log('Peer is already registered')

            commit('setRegistrationCompleted', {
              isRegistrationCompleted: true,
            })
          } else {
            console.log('Peer is registration is yet to be approved')

            commit('setRegistrationCompleted', {
              isRegistrationCompleted: false,
            })
            commit('setRegistrationPending', { isRegistrationPending: true })
          }
        }
      }
    } catch (error) {
      console.error(error)
    }
  },
  async completeRegistration({ dispatch }, payload) {
    try {
      const address = payload.address
      const { success } = await setRegistrationDoc(address, payload)
      if (success) {
        console.log('Registration done')
        dispatch('checkForRegistrations')
      } else {
        console.error('Could not register now, try again later')
      }
    } catch (error) {
      console.error(error)
    }
  },
  async getGiniBalancesForConnectedWallet({ commit }) {
    try {
      const { success, provider, address } = await getEthersProvider()
      if (!success || provider == null) {
        throw new Error('Provider not found')
      }

      const tokens = await getBothTokenBalancesForAddress(provider, address)
      if (!tokens.success) {
        throw new Error('Could not fetch the balances')
      } else {
        commit('setProfileBalances', {
          profileGAT: tokens.gat,
          profileGXP: tokens.gxp,
        })
      }
    } catch (error) {
      console.error(error)
    }
  },
  async getLeaderBoardForDisplay({ commit }) {
    try {
      const { success, table } = await getLeaderBoard()
      if (!success || !table || table.length <= 0) {
        throw new Error(
          'Something went wrong while trying to build the leaderBoard'
        )
      } else {
        commit('setLeaderBoardTable', { leaderBoard: table })
      }
    } catch (error) {
      console.error(error)
    }
  },
  async sendAppreciation({ dispatch }, payload) {
    try {
      const success = await appreciatePeerBySender(
        payload.receiverAddress,
        payload.amt,
        payload.message
      )
      if (success) {
        dispatch('checkForWhitelistOnly')
      }
      return success
    } catch (error) {
      console.error(error)
      return false
    }
  },
}
