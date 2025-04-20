require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Place = require('./models/Place');
require('../db'); // ✅ Reuses your existing db connection

const cities = [];

fs.createReadStream('/Users/suryanshsharmaa/Desktop/fold/chatsystem/backend/worldcities(1).csv')
  .pipe(csv())
  .on('data', (row) => {
    if (row.city && row.country) {
      cities.push({
        name: row.city,
        type: 'city',
        country: row.country,
      });
    }
  })
  .on('end', async () => {
    try {
      await Place.deleteMany({ type: 'city' });
      await Place.insertMany(cities);
      console.log('✅ Cities seeded successfully');
      mongoose.connection.close(); // ✅ Close cleanly
    } catch (err) {
      console.error('❌ Seeding failed:', err);
      mongoose.connection.close();
      process.exit(1);
    }
  });
