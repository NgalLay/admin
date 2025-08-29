"use client";
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, doc, onSnapshot, query, orderBy, deleteDoc, updateDoc, setDoc, where, Timestamp ,getDocs } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { FaClipboardList, FaUtensils, FaChartBar } from 'react-icons/fa';
import table from '../img/table.png';
import DatePicker from "react-datepicker";
import Submenu from '../components/Submenu';
import "react-datepicker/dist/react-datepicker.css";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


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
function useFirestoreSubcollectionDaily(parentCollection, parentId, subcollectionName,selectedDate) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const parentDocRef = doc(db, parentCollection, parentId);
    const subcollectionRef = collection(parentDocRef, subcollectionName);

    const q = query(subcollectionRef, where("createdAt" ,'==',selectedDate));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Aggregate items by id
      const aggregatedData = fetchedData.reduce((acc, item) => {
        item.orderlist.forEach((order) => {
          const existingItem = acc.find((i) => i.id === order.id);
          if (existingItem) {
            existingItem.count += order.quantity;
            existingItem.totalPrice += order.price;
          } else {
            acc.push({
              id: order.id,
              name: order.name,
              count: order.quantity,
              totalPrice: order.price,
            });
          }
        });
        return acc;
      }, []);

      setData(aggregatedData);
    });

    return () => unsubscribe();
  }, [parentCollection, parentId, subcollectionName,selectedDate]);

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
  { latitude: 20.1351079, longitude: 94.9464720 }, // Point 1
  { latitude: 20.1351117, longitude: 94.9465038 }, // Point 2
  { latitude: 20.135016, longitude:  94.946477 }, // Point 3
  { latitude: 20.135023, longitude: 94.946522}, // Point 4
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

 

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });

  const [selectedDate, setSelectedDate] = useState(formattedDate);
  const daliyItemsByCount = useFirestoreSubcollectionDaily("1", "daily", "items", selectedDate);
  // alert(selectedDate)
  const data = {
    labels: daliyItemsByCount.map(item => item.name),
    datasets: [
      {
        label: 'Total Price',
        data: daliyItemsByCount.map(item => item.totalPrice),
        backgroundColor: '#3B82F6',
        borderColor: '#1E40AF',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
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
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
  const [bookedTables, setBookedTables] = useState([]);
  const [tableAttributes, setTableAttributes] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(null); // To store booking details

  useEffect(() => {
      const fetchBookedTables = async () => {
          const orderSnapshot = await getDocs(collection(db, '1/order/items'));
          const deliveredSnapshot = await getDocs(collection(db, '1/delivered/items'));
          
          const booked = orderSnapshot.docs.map(doc => doc.data().table);
          const attributes = deliveredSnapshot.docs.map(doc => doc.data());

          setBookedTables(booked);
          setTableAttributes(attributes);
      };
      fetchBookedTables();
  }, []);

  
  const handleTimeChange = (event) => {
      const time = event.target.value;
      const [hours, minutes] = time.split(':');
      const newStartDate = new Date(startDate);
      newStartDate.setHours(hours);
      newStartDate.setMinutes(minutes);
      setStartDate(newStartDate);
      setEndDate(new Date(newStartDate.getTime() + 2 * 60 * 60 * 1000));
  };

  const timestampToDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Invalid Date';
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  };


  //table book

  const [selectedTable, setSelectedTable] = useState(null);
  const [bookings, setBookings] = useState([]);
  
  const handleTableClick = async (index) => {
    const tableNumber = index + 1;
    setSelectedTable(tableNumber);
  };
  
  useEffect(() => {
    const fetchData = async () => {
      if (selectedTable !== null) {
        try {
          // Define the collection path
          const bookingCollection = collection(db, '1', 'booking', 'items');
          
          // Create a query to filter by table == selectedTable
          const q = query(bookingCollection, where('table', '==', selectedTable));
  
          // Get the documents that match the query
          const querySnapshot = await getDocs(q);
  
          // Map the documents into an array
          const bookingData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
  
          setBookings(bookingData);
        } catch (error) {
          console.error("Error fetching booking data: ", error);
        }
      }
    };
  
    fetchData();
  }, [selectedTable]);  // Add selectedTable as a dependency to re-run useEffect when it changes
  
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);

  const uniqueSubcategories = [...new Set(itemsData.map(item => item.subcategory))];

  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
  };
  
  const handleShowAll = () => {
    setSelectedSubcategory(null); // Reset to show all items
  };


  const filteredItems = selectedSubcategory
    ? itemsData.filter(item => item.subcategory === selectedSubcategory)
    : itemsData;

  const renderContent = () => {
    switch (selectedTab) {
      case "anotherTab":
        return (
          <div style={{ padding: "20px", display: "flex", justifyContent: "center", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
            {/* Table Rows */}
            <div style={{ width: "100%", maxWidth: "800px" }}> {/* Flex container for proper centering */}
              {anotherData.map((item, itemIndex) => (
                <div
                  key={item.id}
                  style={{
                    border: "2px solid #007BFF", // Blue border similar to the screenshot
                    borderRadius: "10px",
                    padding: "10px 20px", // Adjusted padding for a cleaner look
                    backgroundColor: "#FFFFFF", // White background for a clean look
                    width: "100%", // Take full width inside max container
                    fontFamily: "'Arial', sans-serif",
                    marginBottom: "20px", // Add spacing between blocks
                  }}
                >
                  <div>
                    {/* Section Title */}
                    <h3 style={{
                      color: "#007BFF", // Blue text
                      borderBottom: "1px dashed #007BFF", // Dashed line separator under title
                      paddingBottom: "10px",
                      marginBottom: "15px",
                      fontSize: "20px", // Adjust font size
                      textAlign: "left" // Align text to the left for a standard heading look
                    }}>
                      
                      {item.table ==0 ?  <span style={{textAlign: "left" }}>Online</span>:  <span style={{textAlign: "left" }}>Table {item.table}</span>}
                     
                       <span style={{float: "right" }}>count</span>
                    </h3>
                   
        
                    {/* Orders */}
                    {item.orderlist.map((orderItem, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "5px 0", // Smaller padding for tighter spacing
                          borderBottom: index !== item.orderlist.length - 1 ? "1px dashed #007BFF" : "none", // Dashed line between items, none for the last item
                          marginBottom: "5px",
                        }}
                      >
                        <span style={{ fontWeight: "bold", color: "#007BFF", minWidth: "30px", textAlign: "right" }}>{index + 1}.</span>
                        <span style={{ fontWeight: "bold", paddingLeft: "10px", flex: "1" }}>{orderItem.name}</span>
                        {orderItem.takeAway === 1 && <span style={{ paddingLeft: "10px", color: "#555", fontStyle: "italic" }}>(Take Away)</span>}
                        <span style={{ fontWeight: "bold", paddingLeft: "10px", flex: "none" }}>{orderItem.quantity}</span>
                      </div>
                    ))}
                  {item.table ==0 &&  item.phone}<br></br>
                   {item.table ==0 && item.address}<br></br>
                  {item.table ==0 &&  item.pickupTime}<br></br>
                   {item.table == 0 && (
                        <>
                            {item.deliveryOption === 0 ? 'လာယူမည်' : 'Delivery အပ်ရန်'}
                        </>
                    )}
        
                    {/* Deliver Button */}
                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end", // Align button to the right
                      paddingTop: "10px",
                      marginTop: "10px",
                      borderTop: "1px dashed #007BFF", // Dashed line above the button
                    }}>
                      <button
                        onClick={() => handleDeliver(item)}
                        style={{
                          padding: "8px 20px",
                          backgroundColor: "#007BFF", // Blue button
                          color: "#fff",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "14px",
                          transition: "background-color 0.3s ease",
                        }}
                      >
                        Deliver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
        
      case "items":
        
  return (
    <div style={{ padding: "15px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3>Select Category:</h3>
        <button
          onClick={handleShowAll}
          style={{
            margin: "5px",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Show All
        </button>
        {uniqueSubcategories.map((subcategory) => (
          <button
            key={subcategory}
            onClick={() => handleSubcategorySelect(subcategory)}
            style={{
              margin: "5px",
              padding: "10px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {subcategory}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {filteredItems.map((item) => (
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: "bold", margin: "10px 0" }}>{item.name}</p>
              <p style={{ fontSize: "16px", color: "#888", marginBottom: "10px" }}>{item.price}Kyats</p>
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
                  marginTop: "10px",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

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

        case "billing":
          return (
            <div style={{ padding: "15px" }}>
              {paybill.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    border: "2px dashed #ccc", // Dashed border to resemble a tearable voucher
                    borderRadius: "10px",
                    padding: "20px",
                    backgroundColor: "#fefefe",
                    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
                    marginBottom: "20px",
                    maxWidth: "30%",
                    margin: "auto",
                    marginTop: "20px",
                    float:"center",
                    fontFamily: "'Courier New', Courier, monospace", // Classic typewriter font
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",// Adds a subtle paper texture
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "10px" }}>
                    Table {item.table}
                  </div>
                              
                  <button
                    onClick={() => router.push(`/billcheck?id=${item.table}`)} // Assuming `item.table` holds the `id`
                    style={{
                      padding: "10px",
                      backgroundColor: "gray",
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

      case "chart":
       return (
  <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
    {/* Table Rows */}
    <div style={{ width: "100%", maxWidth: "800px" }}> {/* Flex container for proper centering */}
      {delivered.map((item, itemIndex) => (
        <div
          key={item.id}
          style={{
            border: "2px solid green", // Blue border similar to the screenshot
            borderRadius: "10px",
            padding: "20px",
            backgroundColor: "#FFFFFF", // White background for a clean look
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Slight shadow for separation
            width: "100%", // Take full width inside max container
            fontFamily: "'Arial', sans-serif",
            marginBottom: "20px", // Add spacing between blocks
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            {/* Section Title */}
            <h3 style={{
              color: 'green', // Blue text
              borderBottom: "1px dashed green", // Dashed line separator under title
              paddingBottom: "5px",
              marginBottom: "10px",
            }}>
              Table {item.table}
            </h3>

            {/* Orders */}
            {item.orderlist.map((orderItem, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px dashed green", // Dashed line between items
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontWeight: "bold", color: "green", minWidth: "30px", textAlign: "right" }}>{index + 1}.</span>
                <span style={{ fontWeight: "bold", paddingLeft: "10px" }}>{orderItem.name}</span>
                {orderItem.takeAway === 1 && <span style={{ paddingLeft: "10px", color: "#555" }}>(Take Away)</span>}
                <span style={{ fontWeight: "bold", paddingLeft: "10px" }}>{orderItem.quantity}</span>
              </div>
            ))}

          
          </div>
        </div>
      ))}
    </div>
  </div>
);

          case "DaliyproductsByCount":
            return (
              <div style={{ padding: '15px', wid: '60%', margin: 'auto' }}>
                <h2 style={{ color: '#1E3A8A', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                  Select Date:
                </h2>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => {
                    const formattedDate = date.toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                    });
                    setSelectedDate(formattedDate);
                  }}
                  style={{
                    border: '1px solid #3B82F6',
                    borderRadius: '5px',
                    padding: '5px',
                    fontSize: '16px',
                    color: '#1E3A8A',
                  }}
                />
            
                <div style={{ display: 'flex', marginTop: '20px' }}>
                  <div style={{ flex: '1', overflowX: 'auto', marginRight: '20px' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                        backgroundColor: '#E0F2FE',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        minWidth: '600px', // Ensures table takes minimum width to scroll horizontally
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: '#3B82F6', color: '#ffffff' }}>
                          <th
                            style={{
                              border: '1px solid #1E40AF',
                              padding: '10px',
                              textAlign: 'left',
                              fontWeight: 'bold',
                              fontSize: '18px',
                            }}
                          >
                            Item Name
                          </th>
                          <th
                            style={{
                              border: '1px solid #1E40AF',
                              padding: '10px',
                              textAlign: 'right',
                              fontWeight: 'bold',
                              fontSize: '18px',
                            }}
                          >
                            Count
                          </th>
                          <th
                            style={{
                              border: '1px solid #1E40AF',
                              padding: '10px',
                              textAlign: 'right',
                              fontWeight: 'bold',
                              fontSize: '18px',
                            }}
                          >
                            Total Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {daliyItemsByCount.map((item) => (
                          <tr key={item.id} style={{ backgroundColor: '#EFF6FF' }}>
                            <td
                              style={{
                                border: '1px solid #93C5FD',
                                padding: '10px',
                                color: '#1E3A8A',
                                fontSize: '16px',
                              }}
                            >
                              {item.name}
                            </td>
                            <td
                              style={{
                                border: '1px solid #93C5FD',
                                padding: '10px',
                                textAlign: 'right',
                                color: '#2563EB',
                                fontSize: '16px',
                              }}
                            >
                              {item.count}
                            </td>
                            <td
                              style={{
                                border: '1px solid #93C5FD',
                                padding: '10px',
                                textAlign: 'right',
                                color: '#1E3A8A',
                                fontSize: '16px',
                              }}
                            >
                              {item.totalPrice}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#3B82F6', color: '#ffffff' }}>
                          <td
                            colSpan="2"
                            style={{
                              border: '1px solid #1E40AF',
                              padding: '10px',
                              fontWeight: 'bold',
                              textAlign: 'right',
                              fontSize: '18px',
                            }}
                          >
                            Final Total Price:
                          </td>
                          <td
                            style={{
                              border: '1px solid #1E40AF',
                              padding: '10px',
                              textAlign: 'right',
                              fontSize: '18px',
                            }}
                          >
                            {daliyItemsByCount.reduce((acc, item) => acc + item.totalPrice, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
            
                  <div style={{ flex: '1' }}>
                    <h3 style={{ color: '#1E3A8A', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                      Total Price Bar Chart
                    </h3>
                    <Bar data={data} options={options} />
                  </div>
                </div>
              </div>
            );
            
            

          case "productsByCount":
            // Sort products by count in ascending order
           
            return (
              <table style={{ width: '60%', borderCollapse: 'collapse',  margin: 'auto' }}>
                <thead>
                  <tr style={{ backgroundColor: '#007BFF', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '10px', border: '1px solid #0056b3' }}>အမည်</th>
                    <th style={{ padding: '10px', border: '1px solid #0056b3' }}>‌ရောင်းရသည့်အရေတွက်</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItemsByCount.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        textAlign: 'left',
                        transition: 'background-color 0.3s',
                        backgroundColor: '#E3F2FD', // Light blue background
                      }}
                    >
                      <td style={{ padding: '10px', border: '1px solid #0056b3' }}>{item.name}</td>
                      <td style={{ padding: '10px', border: '1px solid #0056b3' }}>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
            case "booking":
              return (
                <div style={{ padding: '20px', minHeight: '100vh', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '20px', width: '50%' }}>
                    {Array.from({ length: 10 }, (_, index) => (
                      <div
                        key={index}
                        onClick={() => handleTableClick(index)}
                        style={{
                          width: '120px',
                          height: '120px',
                          border: '2px solid #01579b',
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000000',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                          cursor: bookedTables.includes(index + 1) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                          <img src={table.src} alt="" style={{ width: '60px', height: '60px' }} />
                        </div>
                        Table {index + 1}
                      </div>
                    ))}
                  </div>
              
                  {/* Booking Data Section */}
                  <div
                    style={{
                      width: '45%',
                      padding: '20px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      maxHeight: '80vh',
                      overflowY: 'auto',
                    }}
                  >
                    <h1 style={{ fontSize: '24px', color: '#333', textAlign: 'center', marginBottom: '20px' }}>Booking Data</h1>
                    {bookings.length > 0 ? (
                      bookings.map((booking) => (
                        <div
                          key={booking.id}
                          style={{
                            backgroundColor: '#ffffff',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            marginBottom: '15px',
                          }}
                        >
                          <p style={{ marginBottom: '8px', color: '#01579b', fontWeight: 'bold' }}>
                            Start Date: {new Date(booking.startDate.seconds * 1000).toLocaleString()}
                          </p>
                          <p style={{ marginBottom: '8px', color: '#01579b', fontWeight: 'bold' }}>
                            End Date: {new Date(booking.endDate.seconds * 1000).toLocaleString()}
                          </p>
                          <p style={{ marginBottom: '8px', color: '#333' }}>Phone Number: {booking.phoneNumber}</p>
                          {/* <p style={{ marginBottom: '8px', color: '#333' }}>Table: {booking.table}</p> */}
                        </div>
                      ))
                    ) : (
                      <p style={{ textAlign: 'center', color: '#777' }}>No bookings for Table {selectedTable}</p>
                    )}
                  </div>
                </div>
              );
              ;
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
          မီနူး
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
          အမှာ
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
          ပို့ဆောင်ပြီးသော ၀ိုင်းများ
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
          ဘေရှင်းမည့် ၀ိုင်းများ
        </button>
        
 
        <button
          onClick={() => setSelectedTab("DaliyproductsByCount")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor: selectedTab === "DaliyproductsByCount" ? "#007bff" : "#fff",
            color: selectedTab === "DaliyproductsByCount" ? "#fff" : "#007bff",
            cursor: "pointer",
            borderRadius: "5px",
            margin: "0 5px",
            boxShadow: selectedTab === "DaliyproductsByCount" ? "0 4px 8px rgba(0, 0, 0, 0.2)" : "none",
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          နေ့စဥ်ရောင်းအား
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
          Sales Analytics
        </button>

        {/* <button
          onClick={() => setSelectedTab("booking")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor: selectedTab === "booking" ? "#007bff" : "#fff",
            color: selectedTab === "booking" ? "#fff" : "#007bff",
            cursor: "pointer",
            borderRadius: "5px",
            margin: "0 5px",
            boxShadow: selectedTab === "booking" ? "0 4px 8px rgba(0, 0, 0, 0.2)" : "none",
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          Booking
        </button> */}
        
      </div>
      <div style={{ padding: "20px" }}>
        {renderContent()}
      </div>
    </div>
  );
}
