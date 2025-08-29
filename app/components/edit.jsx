"use client";
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import styles from '../../EditItem.module.css'; // Import CSS module

export default function EditItem() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');
    const itemName = params.get('name');
    const itemPrice = params.get('price');

    if (itemId) {
      setId(itemId);
      setName(itemName);
      setPrice(itemPrice);
    }
  }, []);

  const handleSave = async () => {
    if (id) {
      const itemRef = doc(db, "1", "products", "items", id);
      await updateDoc(itemRef, { name, price: Number(price) });
      setNotification("Item updated successfully!");
      setTimeout(() => {
        setNotification('');
        router.push('/'); // Redirect back to the main page
      }, 2000);
    }
  };

  if (!id) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Edit Item</h1>
      {notification && <div className={styles.notification}>{notification}</div>}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item Name"
        className={styles.input}
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Item Price"
        className={styles.input}
      />
      <button onClick={handleSave} className={styles.button}>Save</button>
    </div>
  );
}