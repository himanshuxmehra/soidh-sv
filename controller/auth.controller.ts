import { Request, Response } from 'express';
import * as userModel from '../models/user.model';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import Joi from 'joi';

const jwtSecret = process.env.JWT_SECRET || 'null';

export const checkPhoneNumberRegistered = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    // Validate input
    const schema = Joi.object({
      phoneNumber: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      logger.error(error);
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Check if the phone number is already registered
    const isRegistered = await userModel.getUserByPhoneNumber(phoneNumber);

    if (isRegistered) {
      return res.status(200).json({ message: 'Phone number is already registered', success: true });
    } else {
      // If not registered, insert into the database
      await userModel.registerUser(phoneNumber);
      return res.status(200).json({ message: 'User registered successfully', success: true });
    }
  } catch (error) {
    logger.error({ error }, 'Error checking phone number registration');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const generateOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    // Validate input
    const schema = Joi.object({
      phoneNumber: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    // In a real scenario, you might call a service to generate OTP
    // For now, let's generate a random 6-digit OTP
    const otp = await Math.floor(100000 + Math.random() * 900000);
    logger.info(`OTP generated: ${otp}`);
    return res.status(200).json({ data: { otp }, success: true });
  } catch (error) {
    logger.error({ error }, 'Error generating OTP');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Validate input
    const schema = Joi.object({
      phoneNumber: Joi.string().required(),
      otp: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      logger.error(error);

      return res.status(400).json({ error: 'Invalid input data' });
    }

    // In a real scenario, you would verify the OTP with a service
    // For now, let's assume the OTP is correct
    const isValidOTP = await userModel.verifyOTP(phoneNumber, otp);

    if (!isValidOTP) {
      logger.info(`Invalid OTP: ${req.body.otp}`);
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    const user = await userModel.getUserByPhoneNumber(phoneNumber);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = jwt.sign({ accountId: user.account_id, phoneNumber }, jwtSecret, {
      expiresIn: '72h',
    });
    return res
      .status(200)
      .json({ data: { token, accountId: user.account_id, phoneNumber }, success: true });
  } catch (error) {
    logger.error({ error }, 'Error verifying OTP');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
