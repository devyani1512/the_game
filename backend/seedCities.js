require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Place = require('./models/Place');
const connectDB = require('./db');

const cities = [];

fs.createReadStream('/Users/suryanshsharmaa/Desktop/fold/chatsystem/backend/CITY.CSV')
  .pipe(csv())
  .on('data', (row) => {
    const cityName = row.city || row.city_ascii || row.nativeName;
    if (cityName && row.country) {
      cities.push({
        name: cityName.trim(),
        type: 'city',
        country: row.country.trim()
      });
    }
  })
  .on('end', async () => {
    try {
      await connectDB();
      await Place.deleteMany({ type: 'city' });

      // Preview what you're inserting
      console.log("Sample city:", cities[0]);

      await Place.insertMany(cities);
      console.log(`✅ ${cities.length} cities seeded successfully`);
    } catch (err) {
      console.error('❌ Seeding failed:', err);
    } finally {
      mongoose.connection.close();
    }
  })
  .on('error', (err) => {
    console.error('❌ CSV parsing failed:', err);
  });
