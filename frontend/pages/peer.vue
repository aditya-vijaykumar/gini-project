<template>
  <div>
    <v-row>
      <v-col class="text-center">
        <div class="mt-15" v-if="!walletConnected">
          <v-btn class="mt-15" @click="checkForWhitelistOnly" color="primary">
            Connect Wallet
          </v-btn>
        </div>
        <div class="mt-5" v-else>
          <h3>You are now connected with {{ address }}</h3>

          <div class="mt-2">
            <h4 v-if="!isWhitelisted"> The peer is not registered and may register now.
            </h4>
            <div v-else>
              <h4>The peer is already whitelisted on the master contract</h4>
              <div class="mt-12">
                <template>
                  <v-card color="basil">
                    <v-card-title class="text-center justify-center py-6">
                      <h1 class="font-weight-bold text-h2 basil--text">
                        GiNi
                      </h1>
                    </v-card-title>

                    <v-tabs v-model="tab" background-color="transparent" color="basil" grow>
                      <v-tab class="basil--text" v-for="item in items" :key="item.i">
                        {{ item.title }}
                      </v-tab>
                    </v-tabs>

                    <v-tabs-items v-model="tab">
                      <v-tab-item v-for="item in items" :key="item.i">
                        <v-card color="basil" flat>
                          <div v-if="item.i == 0" class="black--text text-center pt-8">
                            <h2 class="pb-6"> {{ profile.name }}</h2>
                            <h4 class="text-decoration-underline">Wallet: {{ profile.address }}</h4>
                            <h4>Email: {{ profile.email }}</h4>
                            <h4>Semester: {{ profile.semester }} '{{ profile.section }}'</h4>
                            <div class="mt-4">
                              <v-chip class="ma-2" color="primary" label>
                                <v-icon left>
                                  mdi-star-four-points-outline
                                </v-icon>
                                {{ profileGXP }} GXP
                              </v-chip>
                              <v-chip class="ma-2" color="primary" label>
                                <v-icon left>
                                  mdi-hand-coin-outline
                                </v-icon>
                                {{ profileGAT }} GAT
                              </v-chip>
                            </div>
                          </div>
                          <div v-else-if="item.i == 1" class="black--text text-center pt-8 pb-10">
                            <v-row>
                              <v-col offset="3" cols="6">
                                <h2 class="mb-8"> THE LEADERBOARD </h2>
                                <v-data-table :headers="headers" :items="leaderBoard" :items-per-page="15"
                                  class="elevation-1">
                                  <template v-slot:item.gxp="{ item }">
                                    <v-chip color="primary" dark>
                                      {{ item.gxp }}
                                    </v-chip>
                                  </template>
                                </v-data-table>
                              </v-col>
                            </v-row>
                          </div>
                          <div v-else class="white--text black text-center pt-8 pb-10 " background-color="black">
                            <v-row>
                              <v-col offset="3" cols="6">
                                <h2 class="mb-10"> Appreciate your Peers </h2>
                                <template>
                                  <v-form ref="formTwo" v-model="valid">
                                    <v-autocomplete rounded solo :items="onlyNames"
                                      v-model="selectedPeer"></v-autocomplete>
                                    <v-text-field color="blue darken-2" v-model="appreciationAddress"
                                      label="Wallet Address" readonly required filled></v-text-field>
                                    <v-text-field v-model="amt" :rules="amtRules" label="Amount of GAT tokens" required
                                      dark filled></v-text-field>
                                    <v-text-field v-model="message" :rules="messageRules" label="Message" required dark
                                      filled></v-text-field>
                                    <v-btn :loading="loading" :disabled="!valid" color="success" class="mr-4"
                                      @click="validateAndSubmit">
                                      Submit
                                    </v-btn>
                                  </v-form>
                                </template>
                              </v-col>
                            </v-row>

                          </div>
                        </v-card>
                      </v-tab-item>
                    </v-tabs-items>
                  </v-card>
                </template>
              </div>
            </div>
          </div>
        </div>

      </v-col>
    </v-row>
    <template class="pb-15">
      <v-snackbar v-model="snackbar" :timeout="timeout" shaped color="yellow lighten-5" content-class="black--text"
        bottom>
        {{ snackbarText }}

        <template v-slot:action="{ attrs }">
          <v-btn color="blue" text v-bind="attrs" @click="snackbar = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'PeerPage',
   computed: {
    ...mapState(['address', 'isWhitelisted', 'profile', 'profileGAT', 'profileGXP', 'leaderBoard']),
    onlyNames() {
      const modArray =  this.leaderBoard.filter( v=> v.address != this.address)
      return modArray.map(z => z.name)
    },
    appreciationAddress() {
      if(this.selectedPeer != "") {
        const i = this.leaderBoard.findIndex(v => v.name == this.selectedPeer)
        return this.leaderBoard[i].address
      } else {
        return "0x00"
      }
    }
  },
    data() {
    return {
      walletConnected: false,
       tab: null,
       selectedPeer: '',
       valid: false,
        items: [
          {
            title: "Profile",
            i: 0
          },
          {
            title: "Leaderboard",
            i: 1
          },
          {
            title: "Appreciate",
            i: 2
          }
        ],
        headers: [
          {
            text: 'Name of Peer',
            sortable: false,
            value: 'name',
            align: 'center'
          },
          { text: 'Address', value: 'truncAddress', sortable: false,align: 'center' },
          { text: 'GAT tokens', value: 'gat', align: 'center' },
          { text: 'GXP tokens', value: 'gxp', align: 'center' }
        ],
        message: '',
      messageRules: [
        v => !!v || 'Message is required',
        v => (v && v.length >= 5) || 'Message must be at least 3 characters',
      ],
      amt: 0,
      amtRules: [
        v => !!v || 'Amount is required',
        v => (v && v<= this.profileGAT) || 'Amount must be less than available balance',
      ],
      loading: false,
      snackbarText: "",
      snackbar: false,
      timeout: 4000,
    }
  },
  methods: {
    async checkForWhitelistOnly() {
      await this.$store.dispatch('checkForWhitelistOnly')
      if(this.$store.state.address !== "") {
        this.walletConnected = true
      }
    },
    validate () {
      console.log(this.$refs)
        return this.$refs.formTwo.validate()
      },
    async validateAndSubmit() {
      
        const payload = {
          receiverAddress: this.appreciationAddress,
          amt: this.amt,
          message: this.message
        }
        console.log(payload)
        if(payload.receiverAddress == this.address ) {
          this.snackbarText = "You cannot appreciate yourself"
          this.snackbar = true
        } else if(payload.amt > this.profileGAT) {
          this.snackbarText = "You don't have enough GAT coins"
          this.snackbar = true
        } else {
          this.loading = true
          const success = await this.$store.dispatch('sendAppreciation', payload)
          this.loading = false
          if(success) {
          this.snackbarText = "Successfully appreciated the peer"
          this.snackbar = true
          } else {
            this.snackbarText = "Could not appreciate, something went wrong"
            this.snackbar = true
          }
        }
    }
  }
}
</script>

<style>
/* Helper classes */
.basil {
  background-color: #FFFBE6 !important;
}

.basil--text {
  color: #356859 !important;
}
</style>