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

// Dashboard (Landing Page)
app.get('/', (req, res) => {
    res.render('dashboard', { title: 'Dashboard | OS Memory Simulator', activePage: 'dashboard' });
});

// Simulator route
app.get('/simulator', (req, res) => {
    res.render('simulator', { title: 'OS Page Replacement Simulator', activePage: 'simulator' });
});

// Insights route
app.use('/insights', require('./routes/insights'));

// Stress Test route
app.use('/stress-test', require('./routes/stressTest'));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
