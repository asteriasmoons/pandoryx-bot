const express = require('express');
const cors = require('cors');
const { connectToMongoose } = require('./mongoose');
const UserWarn = require('../../models/UserWarn'); // ✅ CORRECT path

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Pandoryx backend!' });
});

app.get('/api/warnings', async (req, res) => {
  console.log('GET /api/warnings hit!');
  try {
	console.log('Querying collection:', UserWarn.collection.name);
    const warns = await UserWarn.find();
    console.log('Returned documents:', warns);
    res.json({ success: true, data: warns });
  } catch (err) {
    console.error('Error fetching warnings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, async () => {
  await connectToMongoose();
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});