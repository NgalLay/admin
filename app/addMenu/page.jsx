"use client";
import React, { useState } from "react";
import { db, storage } from "../firebaseConfig";
import { collection, addDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

async function addDataToFireStore(name, price, imageUrl, category, stock) {
  try {
    const parentDocRef = doc(db, "1", "products");

    const docRef = await addDoc(collection(parentDocRef, "items"), {
      name: name,
      price: price,
      imageUrl: imageUrl,
      category: category,
      stock: stock, 
      count: 0,  
      createdAt: serverTimestamp(),
    });
    console.log("Document written with ID: ", docRef.id);
    return true;
  } catch (error) {
    console.error("Error adding document: ", error);
    return false;
  }
}

const Home = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Food");
  const [stock, setStock] = useState("On");  // Default to "On"
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = "";
    if (image) {
      const storageRef = ref(storage, `images/${image.name}`);
      const snapshot = await uploadBytes(storageRef, image);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const added = await addDataToFireStore(name, price, imageUrl, category, stock);

    if (added) {
      setName("");
      setPrice("");
      setCategory("Food");
      setImage(null);
      alert("Data added successfully");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product Name"
          style={styles.input}
          required
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          style={styles.input}
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.select}
        >
          <option value="Food">Food</option>
          <option value="Drink">Drink</option>
        </select>
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          style={styles.fileInput}
          required
        />
        <button type="submit" style={styles.button}>Add Product</button>
      </form>
    </div>
  );
};

// Styles for the component
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f0f0f0',
    fontFamily: 'Arial, sans-serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  input: {
    width: '300px',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  select: {
    width: '300px',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  fileInput: {
    margin: '10px 0',
    fontSize: '1rem',
  },
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    color: '#fff',
    backgroundColor: '#007BFF',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px',
  },
};

export default Home;
