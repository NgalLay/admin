// pages/api/addData.js
import { database } from '../../firebase';
import { ref, set } from 'firebase/database';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, name, email } = req.body;

    try {
      // Create a reference in the database
      const userRef = ref(database, `users/${userId}`);

      // Set the data
      await set(userRef, {
        username: name,
        email: email,
      });

      res.status(200).json({ message: 'Data inserted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error inserting data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
