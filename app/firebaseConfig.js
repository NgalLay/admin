import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCt5pZUtIZck1svvLhqh4e12n0HxspkIgQ",
  authDomain: "smart-restaurant-a59e4.firebaseapp.com",
  projectId: "smart-restaurant-a59e4",
  storageBucket: "smart-restaurant-a59e4.appspot.com",
  messagingSenderId: "894886791397",
  appId: "1:894886791397:web:630fc03296ef5ac209ec0c",
  measurementId: "G-HTYSGRT3D4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };