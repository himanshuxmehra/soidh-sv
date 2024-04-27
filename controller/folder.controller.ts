import { Request, Response } from 'express';
import * as folderModel from '../models/folder.model';
import logger from '../config/logger';
import Joi from 'joi';

export const createFolder = async (req: Request, res: Response) => {
  try {
    const { accountId, folderName, privacy } = req.body;
    // Validate input
    const schema = Joi.object({
      accountId: Joi.string().required(),
      folderName: Joi.string().required(),
      privacy: Joi.boolean().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const folder = await folderModel.createFolder(accountId, folderName, privacy);
    res.status(200).json({ message: 'Folder created successfully', folder });
  } catch (error) {
    logger.error({ error }, 'Error creating folder');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getFoldersByAccountId = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.body;

    // Validate input
    const schema = Joi.object({
      accountId: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      logger.error(error);
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const folders = await folderModel.getFolders(accountId);
    res.status(200).json({ data: folders, success: true });
  } catch (error) {
    logger.error({ error }, 'Error getting folders');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getFolderById = async (req: Request, res: Response) => {
  try {
    const { folderId } = req.body;

    // Validate input
    const schema = Joi.object({
      folderId: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      logger.error(error);
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Retrieve folders for the specified user from the database
    const folder = await folderModel.getFolderDetails(folderId);
    res.status(200).json({ data: folder, success: true });
  } catch (error) {
    logger.error({ error }, 'Error getting folder details');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const updateFolderName = async (req: Request, res: Response) => {
  try {

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Error getting folder details');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const deleteFolder = async (req: Request, res: Response) => {
  try {

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Error getting folder details');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const shareFolder = async (req: Request, res: Response) => {
  try {
    const { folderId, phoneNumber, canEdit } = req.body;
    // Validate input
    const schema = Joi.object({
      phoneNumber: Joi.number().required(),
      folderId: Joi.string().guid(),
      canEdit: Joi.boolean().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      logger.error(error);

      return res.status(400).json({ error: 'Invalid input data' });
    }
    const shareFolder = folderModel.shareFolder(folderId, phoneNumber, canEdit);

    res.status(200).json({ data: shareFolder, success: true });
  } catch (error) {
    logger.error({ error }, 'Error getting folder details');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const sharedFolders = async (req: Request, res: Response) => {
  try {
    let phoneNumber = req.body.phone_number;
    // Validate input
    const schema = Joi.object({
      phoneNumber: Joi.number().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      logger.error(error);

      return res.status(400).json({ error: 'Invalid input data' });
    }
    phoneNumber = String(phoneNumber);
    const sharedFolders = folderModel.getSharedFolders(phoneNumber);
    res.status(200).json({ data: sharedFolders, success: true });
  } catch (error) {
    logger.error({ error }, 'Error getting folder details');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}