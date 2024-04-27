import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';

const UserController = {
  async checkPhoneNumber(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.body;
      const user = await UserModel.findByPhoneNumber(phoneNumber);
      if (user) {
        return res
          .status(200)
          .json({ message: 'Phone number is already registered', success: true });
      }
      // If not registered, insert into the database
      await UserModel.createUser(phoneNumber, ''); // Pass appropriate password
      return res.status(200).json({ message: 'User registered successfully', success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export { UserController };
