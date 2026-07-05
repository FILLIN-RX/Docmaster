import { SmsService } from '../services/sms.service.ts';
import dotenv from 'dotenv';
dotenv.config();

const smsService = new SmsService();

async function testBoth() {
  const phone = '682125565'; // Example phone
  
  console.log('Testing Normal SMS...');
  await smsService.sendSms(phone, 'Test Normal SMS');
  
  console.log('Testing OTP SMS...');
  await smsService.sendOtp(phone, '123456');
}

testBoth().catch(console.error);
