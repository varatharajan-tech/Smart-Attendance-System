const express = require('express');
const app = express();

app.use(express.json());

const router = express.Router();

router.post('/login-test', (req, res) => {
  console.log('[TEST] Route hit!');
  res.json({ success: true, message: 'Test works!' });
});

app.use('/api', router);

app.get('/', (req, res) => {
  res.json({ message: 'Test server running' });
});

app.listen(5001, () => {
  console.log('Test server on port 5001');
});
