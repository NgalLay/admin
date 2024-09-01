"use client";
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig'; // Adjust the import path as necessary
import { collection, query, where, getDocs,getDoc, deleteDoc, doc, writeBatch, updateDoc } from 'firebase/firestore';
import '../../BillVoucher.css'; // Import the CSS file for styling

export default function NextPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id'); // Retrieve the `id` from the URL parameters

  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const orderRef = collection(db, "1", "order", "items");
        const deliveredRef = collection(db, "1", "delivered", "items");
        const billingRef = collection(db, "1", "billing", "items");

        const orderQuery = query(orderRef, where("table", "==", id));
        const deliveredQuery = query(deliveredRef, where("table", "==", id));
        const billingQuery = query(billingRef, where("table", "==", id));

        const [orderSnapshot, deliveredSnapshot, billingSnapshot] = await Promise.all([
          getDocs(orderQuery),
          getDocs(deliveredQuery),
          getDocs(billingQuery),
        ]);

        let combinedItems = [];
        let combinedTotalPrice = 0;

        const processSnapshot = (snapshot) => {
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.orderlist && Array.isArray(data.orderlist)) {
              data.orderlist.forEach(orderItem => {
                combinedItems.push(orderItem);
                combinedTotalPrice += orderItem.price || 0; // Sum the prices of all items
              });
            }
          });
        };

        processSnapshot(orderSnapshot);
        processSnapshot(deliveredSnapshot);
        processSnapshot(billingSnapshot);

        setItems(combinedItems);
        setTotalPrice(combinedTotalPrice);

      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, [id]);

  const handlePrint = async () => {
    window.print();

    try {
      const batch = writeBatch(db);

      const orderRef = collection(db, "1", "order", "items");
      const deliveredRef = collection(db, "1", "delivered", "items");
      const billingRef = collection(db, "1", "billing", "items");

      const orderQuery = query(orderRef, where("table", "==", id));
      const deliveredQuery = query(deliveredRef, where("table", "==", id));
      const billingQuery = query(billingRef, where("table", "==", id));

      const [orderSnapshot, deliveredSnapshot, billingSnapshot] = await Promise.all([
        getDocs(orderQuery),
        getDocs(deliveredQuery),
        getDocs(billingQuery),
      ]);

      const processSnapshotForDeletion = (snapshot) => {
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
      };

      processSnapshotForDeletion(orderSnapshot);
      processSnapshotForDeletion(deliveredSnapshot);
      processSnapshotForDeletion(billingSnapshot);

      await batch.commit();

      console.log("Data deleted successfully");

      // After successful print and deletion, update the count value for each item
      await updateItemCounts();

    } catch (error) {
      console.error("Error deleting data: ", error);
    }
  };

  const updateItemCounts = async () => {
    try {
      for (const item of items) {
        const itemRef = doc(db, "1", "products", "items", item.id);
  
        // Fetch the document snapshot
        const itemSnap = await getDoc(itemRef);
  
        if (itemSnap.exists()) {
          // Get the current count
          const currentCount = itemSnap.data().count;
  
          // Update the count field, incrementing it by 1
          await updateDoc(itemRef, {
            count: currentCount + 1
          });
  
          alert(`Item ${item.id} count updated to ${currentCount + 1}`);
        } else {
          alert(`Item ${item.id} does not exist`);
        }
      }
  
      console.log("Item counts updated successfully");
  
    } catch (error) {
      console.error("Error updating item counts: ", error);
    }
  };
  return (
    <div className="bill-voucher">
      <div className="bill-header">
        <h2>Restaurant Name</h2>
        <p>123 Main Street, City</p>
        <p>Phone: (123) 456-7890</p>
      </div>
      <div className="bill-info">
        <p><strong>Table:</strong> {id}</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
        <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
      </div>
      <div className="bill-items">
        <ul>
          {items.map((item, index) => (
            <li key={index} className="bill-item">
              <span>{item.name}</span>
              <span>{item.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bill-total">
        <p>Total: <strong>{totalPrice.toFixed(2)}</strong></p>
      </div>
      <div className="bill-footer">
        <p>Thank you for dining with us!</p>
      </div>
      <button className="print-button" onClick={handlePrint}>Print</button>
    </div>
  );
}