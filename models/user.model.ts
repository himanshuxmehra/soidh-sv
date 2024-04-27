import pool from '../config/database';
import bcrypt from 'bcrypt';
import logger from '../config/logger';

interface User {
  account_id: string;
  phone_number: string;
  password: string;
  // Add any other user properties
}

export async function registerUser(phoneNumber: string): Promise<void> {
  try {
    const hashedPassword = await bcrypt.hash(phoneNumber, 10);
    await pool.query('INSERT INTO users (phone_number, password) VALUES ($1, $2)', [
      phoneNumber,
      hashedPassword,
    ]);
  } catch (error) {
    logger.error({ error }, 'Error registering user');
    throw error;
  }
}

export async function verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
  try {
    // In a real scenario, you would verify the OTP with a service
    // For now, let's assume the OTP is correct
    return otp === '123456';
  } catch (error) {
    logger.error({ error }, 'Error verifying OTP');
    throw error;
  }
}

export async function getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
  try {
    const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error({ error }, 'Error getting user by phone number');
    throw error;
  }
}
