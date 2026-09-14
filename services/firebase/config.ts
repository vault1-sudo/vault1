import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDqBYdAE78_GBlExu-yMYpEb9SxGohab-4",
  authDomain: "vault1-e6af7.firebaseapp.com",
  projectId: "vault1-e6af7",
  storageBucket: "vault1-e6af7.firebasestorage.app",
  messagingSenderId: "950418738922",
  appId: "1:950418738922:web:971c0d574cdab1a17c9193",
  measurementId: "G-4ZG2D8X2GK",
};

export const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();