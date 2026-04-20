const twilio = require('twilio');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Validate Twilio credentials
const isConfigured = process.env.TWILIO_ACCOUNT_SID 
  && process.env.TWILIO_AUTH_TOKEN 
  && !process.env.TWILIO_ACCOUNT_SID.includes('PLACEHOLDER')
  && !process.env.TWILIO_AUTH_TOKEN.includes('PLACEHOLDER');

const client = isConfigured 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const sendAlertMSG = async (to, body) => {
  if (!client) {
    console.warn(`[TWILIO WARNING] Not configured. Mock sending to ${to}: ${body}`);
    console.warn(`[TWILIO] To enable real SMS, set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env`);
    return { sid: 'MOCK_' + Date.now(), status: 'queued' };
  }
  
  try {
    if (!to || !body) {
      throw new Error('Phone number and message body are required');
    }

    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    
    console.log(`✓ [TWILIO] Message sent to ${to}, SID: ${message.sid}`);
    return message;
  } catch (err) {
    console.error(`✗ [TWILIO ERROR] Failed to send message to ${to}:`, err.message);
    throw err;
  }
};

module.exports = {
  sendAlertMSG,
  isConfigured
};
