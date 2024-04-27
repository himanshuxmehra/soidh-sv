import express from 'express';
import { getMediaByFolderId, uploadMedia } from '../controller/media.controller';
import { authenticateToken } from '../middleware/authMiddleware';
import { asyncMiddleware } from '../middleware/asyncMiddleware';

const mediaRoutes = express.Router();

mediaRoutes.post('/upload', authenticateToken, asyncMiddleware(uploadMedia));
mediaRoutes.post('/get-media', authenticateToken, asyncMiddleware(getMediaByFolderId));
mediaRoutes.get('/details/:mediaId', authenticateToken, asyncMiddleware(getMediaByFolderId));
// mediaRoutes.put('/update/:mediaId', authenticateToken, asyncMiddleware(updateMediaFilePath));
// mediaRoutes.delete('/delete/:mediaId', authenticateToken, asyncMiddleware(deleteMedia));

export default mediaRoutes;
