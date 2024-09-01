"use client";
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, doc, onSnapshot, query, orderBy, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { FaClipboardList, FaUtensils, FaChartBar } from 'react-icons/fa';

function useFirestoreSubcollection(parentCollection, parentId, subcollectionName) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const parentDocRef = doc(db, parentCollection, parentId);
    const subcollectionRef = collection(parentDocRef, subcollectionName);

    const q = query(subcollectionRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(fetchedData);
    });

    return () => unsubscribe();
  }, [parentCollection, parentId, subcollectionName]);

  return data;
}

function useFirestoreSubcollectionDec(parentCollection, parentId, subcollectionName) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const parentDocRef = doc(db, parentCollection, parentId);
    const subcollectionRef = collection(parentDocRef, subcollectionName);

    const q = query(subcollectionRef, orderBy("count", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(fetchedData);
    });

    return () => unsubscribe();
  }, [parentCollection, parentId, subcollectionName]);

  return data;
}
function getDeviceLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }, reject);
    } else {
      reject(new Error('Geolocation not supported'));
    }
  });
}

function isPointInPolygon(point, polygon) {
  let isInside = false;
  let minX = polygon[0].latitude,
    maxX = polygon[0].latitude;
  let minY = polygon[0].longitude,
    maxY = polygon[0].longitude;

  for (let i = 1; i < polygon.length; i++) {
    const p = polygon[i];
    minX = Math.min(p.latitude, minX);
    maxX = Math.max(p.latitude, maxX);
    minY = Math.min(p.longitude, minY);
    maxY = Math.max(p.longitude, maxY);
  }

  if (
    point.latitude < minX ||
    point.latitude > maxX ||
    point.longitude < minY ||
    point.longitude > maxY
  ) {
    return false;
  }

  let i = 0,
    j = polygon.length - 1;
  for (i, j; i < polygon.length; j = i++) {
    if (
      polygon[i].longitude > point.longitude !==
        polygon[j].longitude > point.longitude &&
      point.latitude <
        ((polygon[j].latitude - polygon[i].latitude) *
          (point.longitude - polygon[i].longitude)) /
          (polygon[j].longitude - polygon[i].longitude) +
          polygon[i].latitude
    ) {
      isInside = !isInside;
    }
  }

  return isInside;
}

const specialLocationPolygon = [
  { latitude: 20.1350924, longitude: 94.9464115 }, // Point 1
  { latitude: 20.1351044, longitude: 94.9464676 }, // Point 2
  { latitude: 20.1350089, longitude: 94.9464276 }, // Point 3
  { latitude: 20.1350157, longitude: 94.9464871 }, // Point 4
];

export default function Home() {
  const [location, setLocation] = useState(null);
  const [isInsideSpecialLocation, setIsInsideSpecialLocation] = useState(false);
  const [selectedTab, setSelectedTab] = useState("items");
  const itemsData = useFirestoreSubcollection("1", "products", "items");
  const anotherData = useFirestoreSubcollection("1", "order", "items");
  const delivered = useFirestoreSubcollection("1", "delivered", "items");
  const paybill = useFirestoreSubcollection("1", "billing", "items");
  const sortedItemsByCount = useFirestoreSubcollectionDec("1", "products", "items",);


  const router = useRouter();

  const handleAddProduct = () => {
    router.push('/addMenu');
  };

  const deleteItem = async (itemId) => {
    try {
      const itemRef = doc(db, "1", "products", "items", itemId);
      await deleteDoc(itemRef);
      alert("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item: ", error);
    }
  };

  const toggleStock = async (itemId, currentStockStatus) => {
    try {
      const itemRef = doc(db, "1", "products", "items", itemId);
      await updateDoc(itemRef, {
        stock: currentStockStatus === "On" ? "Off" : "On"
      });
      alert("Stock status updated successfully");
    } catch (error) {
      console.error("Error updating stock status: ", error);
    }
  };

  const checkLocation = (itemLocation) => {
    return isPointInPolygon(itemLocation, specialLocationPolygon);
  };

  const handleDeliver = async (item) => {
    try {
      const deliveredRef = doc(db, "1", "delivered", "items", item.id);
      await setDoc(deliveredRef, item); // Insert data into delivered/items
      const orderItemRef = doc(db, "1", "order", "items", item.id);
      await deleteDoc(orderItemRef); // Delete data from order/items
      alert("Order delivered successfully");
    } catch (error) {
      console.error("Error delivering item: ", error);
    }
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "anotherTab":
        return (
          <div style={{ padding: "15px" }}>
            {anotherData.map((item, index) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "15px",
                  backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#e0e0e0",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  marginBottom: "10px",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "10px" }}>
                  Table {item.table}
                </div>
                <div style={{ marginLeft: "10px" }}>
                  {item.orderlist.map((orderItem, index) => (
                    <div key={index} style={{ marginBottom: "5px" }}>
                      <span style={{ fontWeight: "bold" }}>{index + 1}. </span>
                      <span>{orderItem.name} - </span>
                      <span>{orderItem.price}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontWeight: "bold", marginTop: "10px" }}>
                  Total Price: <span style={{ color: "#28a745" }}>{item.totalPrice}</span>
                </div>
                <div style={{ marginTop: "5px", color: "#555" }}>
                  {checkLocation(item.location) ? "Inside Special Location" : "Outside Special Location"}
                </div>
                <button
                  onClick={() => handleDeliver(item)}
                  style={{
                    padding: "10px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    marginTop: "10px",
                  }}
                >
                  Deliver
                </button>
              </div>
            ))}
          </div>
        );
      case "items":
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", padding: "15px" }}>
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
                  transition: "transform 0.3s, box-shadow 0.3s",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                }}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width: "200px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      transition: "transform 0.3s",
                    }}
                  />
                )}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    transition: "color 0.3s",
                  }}
                >
                  <p style={{ fontSize: "18px", fontWeight: "bold", margin: "10px 0" }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: "16px", color: "#888", marginBottom: "10px" }}>
                    {item.price}
                  </p>
                  <button
                    onClick={() => toggleStock(item.id, item.stock)}
                    style={{
                      padding: "10px",
                      backgroundColor: "#007bff",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginBottom: "10px",
                    }}
                  >
                    {item.stock === "On" ? "Turn Off Stock" : "Turn On Stock"}
                  </button>
                  <button
                    onClick={() => router.push(`/editItem?id=${item.id}&name=${item.name}&price=${item.price}`)}
                    style={{
                      padding: "10px",
                      backgroundColor: "#007bff",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{
                      padding: "10px",
                      backgroundColor: "#dc3545",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
               <button
              onClick={handleAddProduct}
              style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                width: "60px",
                height: "60px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
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
      case "chart":
        return (
          <div style={{ padding: "15px" }}>
            {delivered.map((item, index) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "15px",
                  backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#e0e0e0",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  marginBottom: "10px",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "10px" }}>
                  Table {item.table}
                </div>
                <div style={{ marginLeft: "10px" }}>
                  {item.orderlist.map((orderItem, index) => (
                    <div key={index} style={{ marginBottom: "5px" }}>
                      <span style={{ fontWeight: "bold" }}>{index + 1}. </span>
                      <span>{orderItem.name} - </span>
                      <span>{orderItem.price}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontWeight: "bold", marginTop: "10px" }}>
                  Total Price: <span style={{ color: "#28a745" }}>{item.totalPrice}</span>
                </div>
                <button
                  onClick={() => handleDeliver(item)}
                  style={{
                    padding: "10px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    marginTop: "10px",
                  }}
                >
                  Print
                </button>
              </div>
            ))}
          </div>
        );
        case "billing":
          return (
            <div style={{ padding: "15px" }}>
              {paybill.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "15px",
                    backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#e0e0e0",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "10px" }}>
                    Table {item.table}
                  </div>
                              
                  <button
                    onClick={() => router.push(`/billcheck?id=${item.table}`)} // Assuming `item.table` holds the `id`
                    style={{
                      padding: "10px",
                      backgroundColor: "#28a745",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginTop: "10px",
                    }}
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          );
          case "productsByCount":
            // Sort products by count in ascending order
            return (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", padding: "15px" }}>
                {sortedItemsByCount.map((item) => (
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
                      transition: "transform 0.3s, box-shadow 0.3s",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                    }}
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                          width: "200px",
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "10px",
                          transition: "transform 0.3s",
                        }}
                      />
                    )}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        transition: "color 0.3s",
                      }}
                    >
                      <p style={{ fontSize: "18px", fontWeight: "bold", margin: "10px 0" }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: "16px", color: "#888", marginBottom: "10px" }}>
                        {item.price}
                      </p>
                      <p style={{ fontSize: "16px", color: "#555", marginBottom: "10px" }}>
                        Count: {item.count}
                      </p>
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
    <div>
      <div
        style={{
          display: "flex",
          backgroundColor: "#f8f9fa",
          padding: "10px",
          borderBottom: "1px solid #ddd",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <button
          onClick={() => setSelectedTab("items")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor: selectedTab === "items" ? "#007bff" : "#fff",
            color: selectedTab === "items" ? "#fff" : "#007bff",
            cursor: "pointer",
            borderRadius: "5px",
            margin: "0 5px",
            boxShadow: selectedTab === "items" ? "0 4px 8px rgba(0, 0, 0, 0.2)" : "none",
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          <FaUtensils style={{ marginRight: "5px" }} />
          Menu
        </button>
        <button
          onClick={() => setSelectedTab("anotherTab")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor: selectedTab === "anotherTab" ? "#007bff" : "#fff",
            color: selectedTab === "anotherTab" ? "#fff" : "#007bff",
            cursor: "pointer",
            borderRadius: "5px",
            margin: "0 5px",
            boxShadow: selectedTab === "anotherTab" ? "0 4px 8px rgba(0, 0, 0, 0.2)" : "none",
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          <FaClipboardList style={{ marginRight: "5px" }} />
          Orders
        </button>
        <button
          onClick={() => setSelectedTab("chart")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor: selectedTab === "chart" ? "#007bff" : "#fff",
            color: selectedTab === "chart" ? "#fff" : "#007bff",
            cursor: "pointer",
            borderRadius: "5px",
            margin: "0 5px",
            boxShadow: selectedTab === "chart" ? "0 4px 8px rgba(0, 0, 0, 0.2)" : "none",
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          <FaChartBar style={{ marginRight: "5px" }} />
          Delivered
        </button>
        <button
          onClick={() => setSelectedTab("billing")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor: selectedTab === "billing" ? "#007bff" : "#fff",
            color: selectedTab === "billing" ? "#fff" : "#007bff",
            cursor: "pointer",
            borderRadius: "5px",
            margin: "0 5px",
            boxShadow: selectedTab === "billing" ? "0 4px 8px rgba(0, 0, 0, 0.2)" : "none",
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          <FaChartBar style={{ marginRight: "5px" }} />
          Billing
        </button>
        
        <button
          onClick={() => setSelectedTab("productsByCount")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor: selectedTab === "productsByCount" ? "#007bff" : "#fff",
            color: selectedTab === "productsByCount" ? "#fff" : "#007bff",
            cursor: "pointer",
            borderRadius: "5px",
            margin: "0 5px",
            boxShadow: selectedTab === "productsByCount" ? "0 4px 8px rgba(0, 0, 0, 0.2)" : "none",
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          Sale Rating
        </button>
      </div>
      <div style={{ padding: "20px" }}>
        {renderContent()}
      </div>
    </div>
  );
}
