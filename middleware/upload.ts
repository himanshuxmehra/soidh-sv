import multer from 'multer';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('this is the upload: ', req.body);
    const { accountId, folderId } = req.body;
    const path = `./uploads/${accountId}/${folderId}`;
    fs.mkdirSync(path, { recursive: true });
    cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.imageId}.png`);
  },
});

const upload = multer({ storage: storage }).single('image');
