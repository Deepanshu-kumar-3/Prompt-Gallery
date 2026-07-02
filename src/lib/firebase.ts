import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, OAuthProvider, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAvY88iEf_x6gV7UuAQZe-KjMH-aXcT4bA",
  authDomain: "premium-prompt-gallery.firebaseapp.com",
  projectId: "premium-prompt-gallery",
  storageBucket: "premium-prompt-gallery.firebasestorage.app",
  messagingSenderId: "783286308472",
  appId: "1:783286308472:web:3ae730cfdaddc1f7c2a78d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const twitterProvider = new TwitterAuthProvider();
// Instagram login is not a standard built-in provider, but we can use OAuthProvider or Facebook
export const instagramProvider = new OAuthProvider('instagram.com');
