const express = require('express');
const apiRoutes = require('./routes/api');

const app = express();

app.use(express.json());

console.log('Importing routes...');
console.log('apiRoutes type:', typeof apiRoutes);
console.log('apiRoutes stack length:', apiRoutes.stack ? apiRoutes.stack.length : 0);

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Test server with api.js' });
});

app.listen(5002, () => {
  console.log('Test server 2 on port 5002');
});
