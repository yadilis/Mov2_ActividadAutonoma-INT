// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyCLh7tkLMbh3loaWk6oOD2lH-uhQoXkRSE',
  authDomain: 'proyecto1-9780f.firebaseapp.com',
  databaseURL: 'https://proyecto1-9780f-default-rtdb.firebaseio.com',
  projectId: 'proyecto1-9780f',
  storageBucket: 'proyecto1-9780f.appspot.com',
  messagingSenderId: '269289670194',
  appId: '1:269289670194:web:fd57c490bac5301c9b5e2b',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
