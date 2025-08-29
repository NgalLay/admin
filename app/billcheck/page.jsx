"use client";
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig'; // Adjust the import path as necessary
import { collection, query, where, getDocs, getDoc, deleteDoc, doc, writeBatch, updateDoc, setDoc } from 'firebase/firestore';
import '../../BillVoucher.css'; // Import the CSS file for styling

export default function NextPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id'); // Retrieve the `id` from the URL parameters

  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

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
    setLoading(true);

    try {
      const batch = writeBatch(db);

      const orderRef = collection(db, "1", "order", "items");
      const deliveredRef = collection(db, "1", "delivered", "items");
      const billingRef = collection(db, "1", "billing", "items");
      const dailyRef = collection(db, "1", "daily", "items");

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

      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });

      const dailyDocRef = doc(dailyRef);
      await setDoc(dailyDocRef, {
        createdAt: formattedDate,
        orderlist: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        table: id,
        totalPrice: totalPrice,
      });

      console.log("Data inserted into daily items collection");

      await updateItemCounts();

    } catch (error) {
      console.error("Error handling print: ", error);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const updateItemCounts = async () => {
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemRef = doc(db, "1", "products", "items", item.id);

        const itemSnap = await getDoc(itemRef);

        if (itemSnap.exists()) {
          const currentCount = itemSnap.data().count;

          await updateDoc(itemRef, {
            count: currentCount + item.quantity
          });
        }

        setProgress(((i + 1) / items.length) * 100);
      }

      console.log("Item counts updated successfully");
    } catch (error) {
      console.error("Error updating item counts: ", error);
    }
  };

  return (
    <div className="bill-voucher"
      style={{
        border: "2px dashed #ccc", 
        borderRadius: "10px",
        padding: "20px",
        backgroundColor: "#fefefe",
        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
        marginBottom: "20px",
        maxWidth: "30%",
        margin: "auto",
        marginTop: "20px",
        fontFamily: "'Courier New', Courier, monospace", 
        backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')", 
      }}
    >
      {loading && (
        <div className="loading-overlay">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            {progress.toFixed(0)}%
          </div>
        </div>
      )}
      <div className="bill-header">
        <h2>H2 Restaurant</h2>
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
              <span>{item.quantity}</span>
              <span>{item.price.toFixed(2)} kyats</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bill-total">
        <p>Total: <strong>{totalPrice.toFixed(2)} kyats</strong></p>
      </div>
      <button className="print-button" onClick={handlePrint} disabled={loading}>Print</button>

      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none;
        }
        .progress-bar {
          height: 25px;
          background-color: #4caf50;
          color: white;
          text-align: center;
          line-height: 25px;
          transition: width 0.2s;
        }
        .print-button {
          margin-top: 20px;
          padding: 10px;
          background-color: ${loading ? '#ccc' : '#4caf50'};
          color: white;
          border: none;
          cursor: ${loading ? 'not-allowed' : 'pointer'};
        }
      `}</style>
    </div>
  );
}
