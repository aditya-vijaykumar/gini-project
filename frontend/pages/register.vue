<template>
  <v-row>
    <v-col class="text-center">
      <div class="mt-15" v-if="!walletConnected">
        <v-btn class="mt-15" @click="connectWallet" color="primary">
          Connect Wallet
        </v-btn>
      </div>
      <div class="mt-5" v-else>
        <h3>You are now connected with {{ address }}</h3>

        <div class="mt-2">
          <h4 v-if="isWhitelisted || isRegistrationCompleted"> The peer is already whitelisted on the master contract
          </h4>
          <h4 v-else-if="isRegistrationPending && !isRegistrationCompleted">The peer registration is under review by the
            admin</h4>
          <div v-else>
            <h4>The peer is not registered and may register now.</h4>

            <template>
              <v-form ref="form" v-model="valid" lazy-validation>
                <v-text-field v-model="name" :rules="nameRules" label="Full Name" required></v-text-field>
                <v-text-field v-model="address" label="Wallet Address" readonly required></v-text-field>
                <v-text-field v-model="email" :rules="emailRules" label="E-mail" required></v-text-field>
                <v-text-field v-model="usn" :counter="10" :rules="usnRules" label="USN" required></v-text-field>
                <v-select v-model="semester" :items="items" :rules="[v => !!v || 'Semester is required']"
                  label="Semester" required></v-select>
                <v-text-field v-model="section" :counter="1" :rules="sectionRules" label="Section"
                  required></v-text-field>

                <v-btn :loading="loading" :disabled="!valid" color="success" class="mr-4" @click="validateAndSubmit">
                  Submit
                </v-btn>

              </v-form>
            </template>
          </div>
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'RegisterPage',
  components: {
  },
    computed: {
    ...mapState(['address', 'isWhitelisted', 'isRegistrationPending', 'isRegistrationCompleted'])
  },
  data() {
    return {
      walletConnected: false,
       valid: true,
      name: '',
      nameRules: [
        v => !!v || 'Name is required',
        v => (v && v.length >= 3) || 'Name must be at least 3 characters',
      ],
      usn: '',
      usnRules: [
        v => !!v || 'USN is required',
        v => (v && v.length == 10) || 'USN must be exactly 10 characters',
      ],
      section: '',
      sectionRules: [
        v => !!v || 'section is required',
        v => (v && v.length == 1) || 'Section must be exactly 1 character',
      ],
      email: '',
      emailRules: [
        v => !!v || 'E-mail is required',
        v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
      ],
      semester: null,
      items: [
        3, 4, 5, 6, 7
      ],
      loading: false,
    }
  },
  methods: {
    validate () {
        return this.$refs.form.validate()
      },
    async connectWallet() {
      await this.$store.dispatch('connectWallet')
      if(this.$store.state.address !== "") {
        this.walletConnected = true
        this.checkForRegistration()
      }
    },
    async checkForRegistration() {
      await this.$store.dispatch('checkForRegistrations')
    },
    async validateAndSubmit() {
      const valid = this.validate()
      console.log(valid)
      if(valid) {
        const doc = {
          name: this.name,
          address: this.address,
          email: this.email,
          semester: this.semester,
          section: this.section,
          registered: false
        }
        console.log(doc);
        this.loading = true;
        await this.$store.dispatch('completeRegistration', doc)
        this.loading = false;

      }
    }
  }

}
</script>