const twilio = require('twilio');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && !process.env.TWILIO_ACCOUNT_SID.includes('PLACEHOLDER')
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const sendAlertMSG = async (to, body) => {
  if (!client) {
    console.log(`[TWILIO MOCK] Mock send to ${to}: ${body}`);
    return Promise.resolve(); // Simulate success
  }
  
  try {
    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log(`[TWILIO] Message sent to ${to}, SID: ${message.sid}`);
    return message;
  } catch (err) {
    console.error(`[TWILIO ERROR] Failed to send message to ${to}:`, err);
    throw err;
  }
};

module.exports = {
  sendAlertMSG
};
