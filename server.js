const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse URL-encoded bodies and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Main route
app.get('/', (req, res) => {
    res.render('index', { title: 'OS Page Replacement Simulator' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
