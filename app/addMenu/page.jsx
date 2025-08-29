"use client";
import React, { useState, useEffect } from "react";
import { db, storage } from "../firebaseConfig";
import { collection, addDoc, doc, serverTimestamp, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

async function addDataToFireStore(name, price, imageUrl, category,searchTerm, stock) {
  try {
    const parentDocRef = doc(db, "1", "products");

    const docRef = await addDoc(collection(parentDocRef, "items"), {
      name: name,
      price: price,
      imageUrl: imageUrl,
      category: category,
      subcategory: searchTerm,
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
  const [stock, setStock] = useState("On");
  const [image, setImage] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [items, setItems] = useState([]); // State to store Firestore items

  useEffect(() => {
    // Fetch items from Firestore on component mount
    const fetchItems = async () => {
      try {
        const parentDocRef = doc(db, "1", "products");
        const itemsCollection = collection(parentDocRef, "items");
        const querySnapshot = await getDocs(itemsCollection);
        const itemsSet = new Set();
  
        const fetchedItems = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, name: data.subcategory, category: data.category };
        });
  
        // Filter duplicates and check if category is "Food"
        const uniqueItems = fetchedItems.filter((item) => {
          const isDuplicate = itemsSet.has(item.name.toLowerCase());
          itemsSet.add(item.name.toLowerCase());
          return !isDuplicate && item.category === category; // Ensure category is "Food"
        });
  
        setItems(uniqueItems);
      } catch (error) {
        console.error("Error fetching items: ", error);
      }
    };
  
    fetchItems();
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = "";
    if (image) {
      const storageRef = ref(storage, `images/${image.name}`);
      const snapshot = await uploadBytes(storageRef, image);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const added = await addDataToFireStore(name, price, imageUrl,category, searchTerm, stock);

    if (added) {
      setName("");
      setPrice("");
      setCategory("Food");
      setSearchTerm("");
      setImage(null);
      alert("Data added successfully");
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() !== "") {
      const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  };

  // Handle item click
  const handleItemClick = (item) => {
    setSearchTerm(item.name);
    setFilteredItems([]);
  };

  return (
    <div style={styles.container}>
      <h1>Add Menu Form</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Menu Name"
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
        <div style={{ padding: "20px" }}>
          <input
            type="text"
            placeholder="Category..."
            value={searchTerm}
            onChange={handleSearch}
            style={{ padding: "10px", fontSize: "16px", width: "300px" }}
          />

          {searchTerm && filteredItems.length > 0 && (
            <ul style={{ marginTop: "20px" }}>
              {filteredItems.map((item) => (
                <li
                  key={item.id}
                  style={{ padding: "5px 0", cursor: "pointer" }}
                  onClick={() => handleItemClick(item)}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}

          {/* {searchTerm && filteredItems.length === 0 && (
            <p style={{ marginTop: "20px" }}>No items found</p>
          )} */}
        </div>

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
