import express from 'express';
import { createFolder, getFoldersByAccountId, getFolderById, updateFolderName, deleteFolder, sharedFolders } from '../controller/folder.controller';
import { asyncMiddleware } from '../middleware/asyncMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';
import { shareFolder } from '../models/folder.model';

const folderRoutes = express.Router();

folderRoutes.post('/create-folder', authenticateToken, asyncMiddleware(createFolder));
folderRoutes.get('/get-folders', authenticateToken, asyncMiddleware(getFoldersByAccountId));
folderRoutes.get('/get-folder-details', authenticateToken, asyncMiddleware(getFolderById));
folderRoutes.put('/update-folder-name', authenticateToken , asyncMiddleware(updateFolderName));
folderRoutes.post('/delete-folder', authenticateToken, asyncMiddleware(deleteFolder));
folderRoutes.post('/share-folder', authenticateToken, asyncMiddleware(shareFolder));
folderRoutes.post('/get-shared-folders', authenticateToken, asyncMiddleware(sharedFolders));

export default folderRoutes;
