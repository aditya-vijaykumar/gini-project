import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'
import { BigNumber, ethers } from 'ethers'
import firebasejs from '~/plugins/firebase'
const { db, doc, setDoc, collection, getDoc } = firebasejs
import { giniToken, contract } from '../store/config/abi.json'

const NETWORK = 5

export const truncateAddress = (address) => {
  if (!address) return 'No Account'
  const match = address.match(
    /^(0x[a-zA-Z0-9]{2})[a-zA-Z0-9]+([a-zA-Z0-9]{2})$/
  )
  if (!match) return address
  return `${match[1]}…${match[2]}`
}

export const toHex = (num) => {
  const val = Number(num)
  return '0x' + val.toString(16)
}

export const getRegistrationDoc = async (address) => {
  try {
    const docRef = doc(db, 'registrations', address)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      console.log('Document exists, data: ', docSnap.data())
      return {
        exists: docSnap.exists(),
        data: docSnap.data(),
      }
    } else {
      console.log('Document does not exist, new peer')
      return {
        exists: docSnap.exists(),
        data: null,
      }
    }
  } catch (error) {
    console.error(error)
    return {
      exists: false,
      data: null,
    }
  }
}
export const setRegistrationDoc = async (address, document) => {
  try {
    await setDoc(doc(db, 'registrations', address), document)
    console.log('Updated doc')
    return {
      success: true,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
    }
  }
}

export const getEthersProvider = async () => {
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
      cacheProvider: false, // optional
      providerOptions, // required
    })
    const ethereumProvider = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(ethereumProvider)
    const accounts = await provider.listAccounts()
    const chainId = (await provider.getNetwork()).chainId
    console.log('chainId ', chainId)
    if (chainId != 5) {
      try {
        await provider.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: toHex(NETWORK) }],
        })
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await provider.provider.request({
              method: 'wallet_addEthereumChain',
              params: [networkParams[toHex(NETWORK)]],
            })
          } catch (error) {
            console.error(error)
          }
        }
      }
    }

    return {
      success: true,
      address: accounts[0],
      provider,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      address: '',
      provider: null,
    }
  }
}

export const getBothTokenBalancesForAddress = async (provider, address) => {
  try {
    const giniGAT = new ethers.Contract(
      giniToken.addressGAT,
      giniToken.abi,
      provider
    )
    const giniGXP = new ethers.Contract(
      giniToken.addressGXP,
      giniToken.abi,
      provider
    )

    const gatBalance = await giniGAT.balanceOf(address)
    const gxpBalance = await giniGXP.balanceOf(address)

    const gat = gatBalance.div(ethers.constants.WeiPerEther).toNumber()
    console.log(gatBalance)
    console.log(gat)

    const gxp = gxpBalance.div(ethers.constants.WeiPerEther).toNumber()
    console.log(gxpBalance)
    console.log(gxp)

    return {
      success: true,
      gat: gat,
      gxp: gxp,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      gat: 0,
      gxp: 0,
    }
  }
}

export const getLeaderBoard = async () => {
  try {
    const { provider, success } = await getEthersProvider()

    if (provider == null || !success) {
      throw new Error('Could not get the provider ')
    }

    const giniMaster = new ethers.Contract(
      contract.address,
      contract.abi,
      provider
    )
    const allPeers = await giniMaster.getAllPeers()
    console.log('allPeers')
    console.log(allPeers)

    const dataForTable = []
    for (let i = 0; i < allPeers.length; i++) {
      const peerAddress = allPeers[i]
      const tokens = await getBothTokenBalancesForAddress(provider, peerAddress)
      if (tokens.success) {
        const regDoc = await getRegistrationDoc(peerAddress)
        if (regDoc.exists) {
          dataForTable.push({
            address: peerAddress,
            truncAddress: truncateAddress(peerAddress),
            name: regDoc.data.name,
            gat: tokens.gat,
            gxp: tokens.gxp,
          })
          continue
        }
      }
      console.log(
        'Something went wrong when fetching data for address ',
        peerAddress
      )
    }

    dataForTable.sort((a, b) => a.gxp - b.gxp)
    console.log('\n\ndataForTable')
    console.log(dataForTable)
    return {
      success: true,
      table: dataForTable,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      table: null,
    }
  }
}

export const appreciatePeerBySender = async (
  receiverAddress,
  amtInEth,
  message
) => {
  try {
    const { success, provider, address } = await getEthersProvider()

    if (!success || !provider) {
      throw new Error('Could not get the provider')
    }

    if (address.toLowerCase() == receiverAddress.toLowerCase()) {
      throw new Error('Cannot appreciate oneself')
    }

    const senderBalances = await getBothTokenBalancesForAddress(
      provider,
      address
    )
    const amtInWei = BigNumber.from(amtInEth).mul(ethers.constants.WeiPerEther)
    if (senderBalances.success) {
      if (amtInEth > senderBalances.gat) {
        throw new Error('Sender does not have sufficient balances')
      } else {
        const signer = provider.getSigner(0)
        const giniMaster = new ethers.Contract(
          contract.address,
          contract.abi,
          signer
        )
        const tx = await giniMaster.appreciatePeer(
          receiverAddress,
          amtInWei,
          message
        )
        console.log(tx)
        return true
      }
    }
  } catch (error) {
    console.error(error)
    return false
  }
}

export const getEventLogs = async () => {
  try {
    const eventData = []
    console.log(`Getting the GiniToken events...`)

    const giniContractAddress = contract.address

    const eventSignature = 'NewAppreciation(address,address,uint256,string)'
    const eventTopic = ethers.utils.id(eventSignature) // Get the data hex string

    const provider = new ethers.providers.InfuraProvider(
      { chainId: 5, name: 'goerli' },
      'aba673f5f7e84583b4179c3ca6a08e26'
    )

    const latestBlock = provider.blockNumber

    const rawLogs = await provider.getLogs({
      address: giniContractAddress,
      topics: [eventTopic],
      fromBlock: 8163832,
      toBlock: latestBlock,
    })

    const abi = contract.abi
    const intrfc = new ethers.utils.Interface(abi)

    for (let i = 0; i < rawLogs.length; i++) {
      const log = rawLogs[i]
      let parsedLog = intrfc.parseLog(log)
      const dataObj = {
        appreciator: parsedLog.args[0],
        appreciationReceiver: parsedLog.args[1],
        amount: parsedLog.args[2].div(ethers.constants.WeiPerEther).toNumber(),
        reason: parsedLog.args[3],
      }
      console.debug(dataObj)
      eventData.push(dataObj)
    }
    return {
      success: true,
      tableData: eventData,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      tableData: null,
    }
  }
}
