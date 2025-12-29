require('dotenv').config();
const app = require('./app');
const { syncDB } = require('./src/models');

const PORT = process.env.PORT || 5000;

// Connect to Database
syncDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
