import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import logger from '../config/logger';

interface Folder {
  folder_id: string;
  account_id: string;
  folder_name: string;
  privacy: boolean;
}

export async function createFolder(
  accountId: string,
  folderName: string,
  privacy: boolean,
): Promise<Folder> {
  try {
    const folderId = uuidv4();
    const folderPath = `uploads/${accountId}/${folderId}`;
    //s3
    if (fs.existsSync(folderPath)) {
      logger.error('Folder Already Exists with userId generated:', folderId, accountId);
      throw new Error('Folder already exists');
    }

    fs.mkdirSync(folderPath, { recursive: true });

    const result = await pool.query(
      'INSERT INTO folders (folder_id, account_id, folder_name, privacy) VALUES ($1, $2, $3, $4) RETURNING *',
      [folderId, accountId, folderName, privacy],
    );

    return result.rows[0];
  } catch (error) {
    logger.error({ error }, 'Error creating folder');
    throw error;
  }
}

export async function getFolders(accountId: string): Promise<Folder[]> {
  try {
    const result = await pool.query(
      'SELECT f.*, (SELECT image_id from media where f.folder_id = media.folder_id limit 1 ) FROM folders f WHERE f.account_id = $1',
      [accountId],
    );
    return result.rows;
  } catch (error) {
    logger.error({ error }, 'Error getting folders');
    throw error;
  }
}

export async function getFolderDetails(folderId: string): Promise<Folder[]> {
  try {
    const result = await pool.query('SELECT * FROM folders WHERE folder_id = $1', [folderId]);
    return result.rows;
  } catch (error) {
    logger.error({ error }, 'Error getting folder details');
    throw error;
  }
}

export const shareFolder = async (folderId: string, phoneNumber: string, canEdit: boolean) => {
  try {
    const result = await pool.query(
      'INSERT INTO sharing_folder (folder_id, shared_with, can_edit) VALUES ($1, $2, $3) RETURNING *',
      [folderId, phoneNumber, canEdit],
    );
    return result.rows[0];
  } catch (error) {
    logger.error({ error }, 'Error sharing folder');
    throw error;
  }
};

export const getSharedFolders = async (phoneNumber: string) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sharing_folder sf INNER JOIN folders f on f.folder_id = sf.folder_id WHERE sf.shared_with = $1',
      [phoneNumber],
    );
    return result.rows;
  } catch (error) {
    logger.error({ error }, 'Error getting shared folders');
    throw error;
  }
};
