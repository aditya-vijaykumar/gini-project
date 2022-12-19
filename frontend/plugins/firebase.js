// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import {
  doc,
  setDoc,
  collection,
  getDoc,
  getFirestore,
} from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAfOkHBY0-I7AwHp9pvocdB40DDWF9TZu0',
  authDomain: 'gini-project-92260.firebaseapp.com',
  projectId: 'gini-project-92260',
  storageBucket: 'gini-project-92260.appspot.com',
  messagingSenderId: '265060981039',
  appId: '1:265060981039:web:b0175ab4c983a4525429da',
  measurementId: 'G-L3KTE2HYDD',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

const db = getFirestore(app)
const firebasejs = { db, doc, setDoc, collection, getDoc }

export default firebasejs
