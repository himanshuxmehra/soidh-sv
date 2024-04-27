import express from 'express';
import { checkPhoneNumberRegistered, generateOTP, verifyOTP } from '../controller/auth.controller';

const authRoutes = express.Router();

authRoutes.post('/check', checkPhoneNumberRegistered);
authRoutes.post('/generate-otp', generateOTP);
authRoutes.post('/verify-otp', verifyOTP);

export default authRoutes;
