const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
// app.use('/api', require('./routes/pass'));

const gameRoutes = require('./routes/gameRoutes');
app.use('/api', gameRoutes);

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(3000, () => console.log('Server running on port 3000'));
});