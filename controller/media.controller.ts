import { Request, Response } from 'express';
import { getMediaForFolder, getRecentMedia, uploadMediaRec } from '../models/media.model';
import Joi from 'joi';
import logger from '../config/logger';

export const uploadMedia = async (req: Request, res: Response) => {
  try {
    // Extract necessary data from the request body
    const { accountId, folderId, imageId } = req.body;

     // Validate input
     const schema = Joi.object({
      accountId: Joi.string().required(),
      folderId: Joi.string().required(),
      imageId: Joi.string().guid(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      logger.error(error);
      return res.status(400).json({ error: 'Invalid input data' });
    }

    if (!req.file) {
      logger.error(error, 'No media was attached to the endpoint');
      return res.status(400).json({ error: 'No media provided' });
    }

    // Call the appropriate model method to upload media
    const media = await uploadMediaRec(accountId, folderId, imageId);

    // Return success response
    return res.status(200).json({ message: 'Media uploaded successfully', data: media, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
export const getMediaByFolderId = async (req: Request, res: Response) => {
  try {
    const { accountId, folderId } = req.body;

    // Validate input
    const schema = Joi.object({
      accountId: Joi.string().required(),
      folderId: Joi.string().guid(),
    });
    const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: 'Invalid input data' });
      }
    // Call the appropriate model method to upload media
    // todo: add pagination 
    const media = await getMediaForFolder(folderId);

    // Return success response
    return res.status(200).json({ message: 'Media retrieved successfully', data: media, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getRecent = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.body;

      // Validate input
      const schema = Joi.object({
        accountId: Joi.string().required(),
      });
    const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: 'Invalid input data' });
      }
    // Call the appropriate model method to upload media
    // todo: add pagination 
    const media = await getRecentMedia(accountId);

    // Return success response
    return res.status(200).json({ message: 'Recent Media retrieved successfully', data: media, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}