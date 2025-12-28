const mongoose = require('mongoose');
require('dotenv').config();

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codehub');
        console.log("Connected to MongoDB");

        const collection = mongoose.connection.collection('commits');

        // List indexes to confirm name
        const indexes = await collection.indexes();
        console.log("Current indexes:", indexes);

        const indexName = 'hash_1';
        const indexExists = indexes.some(idx => idx.name === indexName);

        if (indexExists) {
            await collection.dropIndex(indexName);
            console.log(`Index ${indexName} dropped successfully.`);
        } else {
            console.log(`Index ${indexName} not found (maybe already dropped).`);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

dropIndex();
