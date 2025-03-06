import { initializeApp } from "firebase/app";
import { getStorage ,ref, uploadBytes, getDownloadURL} from "firebase/storage";

import { getFirestore, query, where, getDocs,addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-rIMMz5_Q959BzztvCltRxsUxuKq-aDs",
  authDomain: "nextroom-d3b45.firebaseapp.com",
  databaseURL: "https://nextroom-d3b45-default-rtdb.firebaseio.com",
  projectId: "nextroom-d3b45",
  storageBucket: "nextroom-d3b45.appspot.com",
  messagingSenderId: "160727981153",
  appId: "1:160727981153:web:a09875aa9109d18b625e20",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
export { app, db, query, where, getDocs, storage,addDoc,ref, uploadBytes, getDownloadURL };
