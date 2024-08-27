"use client";
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { useRouter } from 'next/navigation';

// Custom hook to retrieve data from a subcollection, ordered by createdAt
function useFirestoreSubcollection(parentCollection, parentId, subcollectionName) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const parentDocRef = doc(db, parentCollection, parentId); // Reference to the parent document
    const subcollectionRef = collection(parentDocRef, subcollectionName); // Reference to the subcollection

    // Create a query to order by the 'createdAt' field
    const q = query(subcollectionRef, orderBy("createdAt", "asc")); // Order by createdAt descending

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(fetchedData);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [parentCollection, parentId, subcollectionName]);

  return data;
}

export default function Home() {
  const [selectedTab, setSelectedTab] = useState("items"); // State for tabs
  const itemsData = useFirestoreSubcollection("1", "products", "items");
  const anotherData = useFirestoreSubcollection("1", "order", "items");

  const router = useRouter();
  const handleAddProduct = () => {
    router.push('/addMenu');
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "items":
        return (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px" }}>
            {itemsData.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  maxWidth: "250px", 
                  padding: "15px",  
                  textAlign: "center",
                  backgroundColor: "#fff",
                  position: "relative", 
                  transition: "transform 0.3s",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {/* Image at the top */}
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "10px" }} // Adjusted size
                  />
                )}
                {/* Content area */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <h2 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>{item.name}</h2>
                  <p style={{ fontSize: "1rem", marginBottom: "15px" }}>Price: ${item.price}</p>
                </div>
                {/* Button at the bottom */}
                <button
                  onClick={() => alert(`Button clicked for ${item.name}`)} // Replace with desired functionality
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    padding: "10px",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                    zIndex: 1, // Ensure button is above other content
                  }}
                >
                  Action
                </button>
              </div>
            ))}
         {/* add button */}
                <button
          onClick={handleAddProduct}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "60px",  // Adjust width as needed
            height: "60px", // Adjust height as needed
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "50%", // Ensures the button is a perfect circle
            cursor: "pointer",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "background-color 0.3s, box-shadow 0.3s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0056b3"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#007bff"}
        >
          +
        </button>

          </div>
        );
      case "anotherTab":
        return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "15px" }}>
          {anotherData.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              flexDirection: "column",
              borderBottom: "1px solid #ddd",
              padding: "10px 0",
              fontSize: "16px",
            }}
          >
            <div style={{ fontWeight: "bold" }}>Table {item.table}</div>
            <div style={{ marginLeft: "20px" }}>
              {item.orderlist.map((orderItem, index) => (
                <div key={index} style={{ fontWeight: "normal", marginBottom: "5px" }}>
                  {index + 1}. {orderItem.name}
                </div>
              ))}
            </div>
            <div style={{ color: "#555", marginTop: "10px" }}>
              Total Price: {item.totalPrice}
            </div>
          </div>
        ))}


      </div>

        );
      default:
        return null;
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", padding: "20px" }}>
      {/* Tabs */}
      <div style={{ display: "flex", marginBottom: "20px" }}>
        <button
          onClick={() => setSelectedTab("anotherTab")}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: selectedTab === "anotherTab" ? "#007bff" : "#f1f1f1",
            color: selectedTab === "anotherTab" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px 5px 0 0",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
         Order
        </button>
        <button
          onClick={() => setSelectedTab("items")}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: selectedTab === "items" ? "#007bff" : "#f1f1f1",
            color: selectedTab === "items" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px 5px 0 0",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          Menu
        </button>
      </div>

      {renderContent()}
    </div>
  );
}
