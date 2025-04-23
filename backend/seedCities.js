require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Place = require('./models/Place');
const connectDB = require('./db');

const cities = [];

fs.createReadStream('/Users/suryanshsharmaa/Desktop/fold/chatsystem/backend/worldcities(1).csv')
  .pipe(csv({
    headers: [
      'asciiName', 'nativeName', 'lat', 'lng', 'country',
      'iso2', 'iso3', 'adminRegion', 'capitalStatus',
      'population', 'id'
    ],
    skipLines: 0,
  }))
  .on('data', (row) => {
    if (row.nativeName && row.country) {
      cities.push({
        name: row.nativeName.trim(), // Use nativeName as the place name
        type: 'city',
        country: row.country.trim(),
      });
    }
  })
  .on('end', async () => {
    try {
      await connectDB();
      await Place.deleteMany({ type: 'city' });
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
