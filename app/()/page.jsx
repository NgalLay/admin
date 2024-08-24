"use client";
import React from 'react';
import {db} from '../firebaseConfig'
import { collection,addDoc } from "firebase/firestore";
import { useState } from "react";

async function addDataToFireStore(name,price) {
  try {
    const docRef=await addDoc(collection(db, "messages"),{
      name:name,
      price: price,
    })
    console.log("messages",docRef.id)
    return true;
  } catch (error) {
    
  }
}

const Home = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    const added=await addDataToFireStore(name,price);

    if(added){
      setName('');
      setPrice('');
      alert("ok");
    }
  };

  return (
    <div>
      <h1>Add User</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Email"
          required
        />
        <button type="submit">Add User</button>
      </form>
    </div>
  );

};

export default Home;
