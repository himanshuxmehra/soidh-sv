import pool from '../config/database';
import fs from 'fs';
import logger from '../config/logger';

interface Media {
  media_id: string;
  folder_id: string;
  account_id: string;
  image_id: string;
  created_at: Date;
  // Add any other media properties
}

export async function uploadMediaRec(
  accountId: string,
  folderId: string,
  imageId: string,
): Promise<Media> {
  try {
    const folderPath = `uploads/${accountId}/${folderId}`;

    if (!fs.existsSync(folderPath)) {
      throw new Error("Folder doesn't exist");
    }

    const result = await pool.query(
      'INSERT INTO media (folder_id, account_id, image_id) VALUES ($1, $2, $3) RETURNING *',
      [folderId, accountId, imageId],
    );

    return result.rows[0];
  } catch (error) {
    logger.error({ error }, 'Error uploading media');
    throw error;
  }
}

export async function getMediaForFolder(folderId: string): Promise<Media[]> {
  try {
    const result = await pool.query('SELECT * FROM media WHERE folder_id = $1', [folderId]);
    return result.rows;
  } catch (error) {
    logger.error({ error }, 'Error getting media for folder');
    throw error;
  }
}

export async function getRecentMedia(accountId: string): Promise<Media[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM media WHERE account_id = $1 ORDER BY created_at DESC limit 15',
      [accountId],
    );
    return result.rows;
  } catch (error) {
    logger.error({ error }, 'Error getting recent media');
    throw error;
  }
}
