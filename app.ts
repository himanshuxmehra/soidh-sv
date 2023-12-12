import cors from "cors";
import multer from "multer";
import fs from "fs";
import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import helmet from 'helmet';
import Joi from 'joi';
import pino from 'pino';
import { AuthJwtToken } from "./models/global";
import path from "path";

dotenv.config();

const app = express();
const port = 3333;

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
};

const jwtSecret = process.env.JWT_SECRET || 'your_default_jwt_secret';

const pool = new Pool(dbConfig);

const logger = pino();

const corsOptions = {
  origin: '*', // Replace with the IP or domain of your React Native app
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

//app.use(cors(corsOptions));
// app.use(helmet());

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({ method: req.method, path: req.path, query: req.query, body: req.body }, 'Request received');
  next();
});

declare global {
  var __basedir: string;
}
global.__basedir = __dirname;

// const upload = multer({ storage });
// app.use(cors());
// app.use(express.json);
app.use(express.urlencoded({ extended: false }));


// app.post("/upload", (req,res)=>{
//   //console.log(req.body);
//   upload(req, res, function (err) {
//     if (err instanceof multer.MulterError) {
//       // A Multer error occurred when uploading.
//       console.log("A Multer error occurred when uploading: ", err)
//       return res.status(400).send({
//         message: 'A Multer error occurred when uploading'
//      });
//     } else if (err) {
//       // An unknown error occurred when uploading.
//       console.log("An unknown error occurred when uploading: ", err);
//       return res.status(400).send({
//         message: 'An unknown error occurred when uploading'
//      });
//     }
//   });
//   //console.log(req.file);

//   return res.status(200).send({
//     message: 'File uploaded!'
//  });
// });
// app.post("/upload", upload, (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: "No image provided" });
//   }

//   // Process the image (e.g., save it to a database or storage service)
//   // Here, we'll just send back a success response with the image details
//   // console.log(req)
//   const image = req.file;
//   // console.log(req.body)

//   res.status(200).json({
//     message: "Image uploaded successfully",
//     originalname: image.originalname,
//     mimetype: image.mimetype,
//     size: image.size,
//   });
// });

// app.get("/isUploaded", async (req, res) => {
//   try {
//     const rawData = await fs.readFile('data.json', 'utf-8');
//     const jsonData = JSON.parse(rawData);

//     // Get the value from the query parameter
//     const searchValue = req.body.parameter as string;

//     // Filter the data based on the searchValue
//     const filteredData = jsonData.filter((item: any) =>
//       item.name.toLowerCase().includes(searchValue.toLowerCase())
//     );

//     if (filteredData.length > 0) {
//       res.status(200).json({ message: 'Value found', data: filteredData });
//     } else {
//       res.status(404).json({ message: 'Value not found' });
//     }
//   } catch (error) {
//     console.error('Error reading data:', error);
//     res.status(500).json({ error: 'Failed to read data' });
//   }
// });

// app.post("/isUploaded", async (req, res) => {
//   const { filename, value } = req.body;

//   if (!filename || !value) {
//     return res.status(400).json({ error: "Both key and value are required" });
//   }

//   try {
//     const rawData = await fs.readFile("data.json", "utf-8");
//     const jsonData = JSON.parse(rawData);

//     // Add the new key-value pair to the data
//     jsonData.push({ [filename]: value });

//     // Write the updated data back to the file
//     await fs.writeFile("data.json", JSON.stringify(jsonData, null, 2));

//     res.json({ message: "added successfully" });
//   } catch (error) {
//     console.error("Error adding key-value pair:", error);
//     res.status(500).json({ error: "Failed to add key-value pair" });
//   }
// });



const asyncMiddleware = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Database error handling middleware
const handleDatabaseError = (error: any, res: Response) => {
  console.error('Database error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
};

// Check if phone number is registered, register if not
app.post(
  '/check',
  asyncMiddleware(async (req: Request, res: Response) => {
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
      const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);

      if (result.rows.length > 0) {
        logger.error("error: 'Phone number is already registered'");
        return res.status(200).json({ message: 'Phone number is already registered', success: true });
      }

      // If not registered, insert into the database
      const hashedPassword = await bcrypt.hash(phoneNumber, 10);
      await pool.query('INSERT INTO users (phone_number, password) VALUES ($1, $2)', [phoneNumber, hashedPassword]);

      return res.status(200).json({ message: 'User registered successfully', success: true });
    } catch (error) {
      logger.error(error);
      handleDatabaseError(error, res);
    }
  })
);

// Generate OTP endpoint
app.post(
  '/generate-otp',
  asyncMiddleware(async (req: Request, res: Response) => {
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
      logger.info("OTP generated: ", otp)
      return res.status(200).json({ data: { otp: otp }, success: true });
    } catch (error) {
      logger.error(error);

      handleDatabaseError(error, res);
    }
  })
);

// Verify OTP endpoint and generate JWT token
app.post(
  '/verify-otp',
  asyncMiddleware(async (req: Request, res: Response) => {
    try {
      const { phoneNumber, otp } = req.body;

      // Validate input
      const schema = Joi.object({
        phoneNumber: Joi.string().required(),
        otp: Joi.string().required(),
      });

      const { error } = schema.validate(req.body);
      if (error) {
        logger.error(error)

        return res.status(400).json({ error: 'Invalid input data' });
      }

      // In a real scenario, you would verify the OTP with a service
      // For now, let's assume the OTP is correct
      if (otp !== '123456') {
        logger.info("Invalid input data ", req.body.otp)
        return res.status(401).json({ error: 'Invalid OTP' });
      }

      // Generate JWT token
      const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);
      const accountId = result.rows[0].account_id;
      const token = jwt.sign({ accountId, phoneNumber }, jwtSecret, { expiresIn: '72h' });
      return res.status(200).json({ data: { token, accountId, phoneNumber }, success: true });
    } catch (error) {
      logger.error(error);
      handleDatabaseError(error, res);
    }
  })
);


// Authentication middleware
const authenticateToken = (req: AuthJwtToken, res: Response, next: NextFunction) => {
  const token: string = req.headers['authorization']!.split(' ')[1];

  console.log("Token from the call::::: ", req.headers['authorization'])
  if (!token) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) {
      logger.error(err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Create folder endpoint
app.post(
  '/create-folder',
  authenticateToken,
  asyncMiddleware(async (req: Request, res: Response) => {
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

      // Generate a UUID for the folder
      const folderId = uuidv4();

      // Assuming you want to create a folder in the 'uploads' directory
      const folderPath = `uploads/${accountId}/${folderId}`;

      // Check if the folder already exists
      if (fs.existsSync(folderPath)) {
        return res.status(400).json({ error: 'Folder already exists' });
      }

      // Create the folder
      fs.mkdirSync(folderPath, { recursive: true });



      // Add an entry to the database
      const result = await pool.query(
        'INSERT INTO folders (folder_id, account_id, folder_name, privacy) VALUES ($1, $2, $3, $4) RETURNING *',
        [folderId, accountId, folderName, privacy]
      );

      return res.status(200).json({ message: 'Folder created successfully', folderPath, databaseEntry: result.rows[0] });
    } catch (error) {
      handleDatabaseError(error, res);
    }
  })
);

// Get folders for an account endpoint
app.post(
  '/get-folders',
  authenticateToken,
  asyncMiddleware(async (req: Request, res: Response) => {
    try {
      const { accountId } = req.body;

      // Validate input
      const schema = Joi.object({
        accountId: Joi.string().required(),
      });

      const { error } = schema.validate(req.body);
      if (error) {
        logger.error(error)
        return res.status(400).json({ error: 'Invalid input data' });
      }
      // Retrieve folders for the specified user from the database
      const result = await pool.query('SELECT * FROM folders WHERE account_id = $1', [accountId]);
      console.log(result.rows)
      const responseObj = {
        success: true,
        message: 'Folders retrieved successfully',
        data: { folders: result.rows },
      };
      // Send the list of folders in the response
      res.status(200).json(responseObj);
    } catch (error) {
      logger.error(error)
      handleDatabaseError(error, res);
    }
  })
);

// Get folder details
app.post(
  '/get-folder-details',
  authenticateToken,
  asyncMiddleware(async (req: Request, res: Response) => {
    try {
      const { folderId } = req.body;
      // Validate input
      const schema = Joi.object({
        folderId: Joi.string().required()
      });

      const { error } = schema.validate(req.body);
      if (error) {
        logger.error(error);
        return res.status(400).json({ error: 'Invalid input data' });
      }
      // Retrieve folders for the specified user from the database
      const result = await pool.query('SELECT * FROM folders WHERE folder_id = $1', [folderId]);
      console.log(result.rows)
      const responseObj = {
        success: true,
        message: 'Folders retrieved successfully',
        data: { folder: result.rows },
      };

      // Send the list of folders in the response
      res.status(200).json(responseObj);
    } catch (error) {
      logger.error(error)
      handleDatabaseError(error, res);
    }
  })
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("this is the upload: ", req.body);
    const { accountId, folderId } = req.body;
    const path = `./uploads/${accountId}/${folderId}`;
    fs.mkdirSync(path, { recursive: true });
    cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.imageId}.png`);
  },
});

const upload = multer({ storage: storage }).single("image");

//Upload Media
app.post(
  '/upload-media',
  authenticateToken,
  upload,
  asyncMiddleware(async (req: Request, res: Response) => {
    try {
      const { accountId, folderId, imageId } = req.body;

      // Validate input
      const schema = Joi.object({
        accountId: Joi.string().required(),
        folderId: Joi.string().required(),
        imageId: Joi.string().guid()
      });

      console.log("Body:--- ", req.body)

      const { error } = schema.validate(req.body);
      if (error) {
        logger.error(error)
        return res.status(400).json({ error: 'Invalid input data' });
      }

      if (!req.file) {
        logger.error(error)
        return res.status(400).json({ error: "No image provided" });
      }

      // Process the image (e.g., save it to a database or storage service)
      // Here, we'll just send back a success response with the image details
      // console.log(req)
      const image = req.file;
      // console.log(req.body)

      // Assuming you want to create a folder in the 'uploads' directory
      const folderPath = `uploads/${accountId}/${folderId}`;

      // Check if the folder exists
      if (!fs.existsSync(folderPath)) {
        return res.status(400).json({ error: 'Folder doesn\'t exists' });
      }

      // Add an entry to the database
      const result = await pool.query(
        'INSERT INTO media (folder_id, account_id, image_id) VALUES ($1, $2, $3) RETURNING *',
        [folderId, accountId, imageId]
      );

      return res.status(200).json({ message: 'Imaged Uploaded successfully', data: { media: result.rows }, success: true });
    } catch (error) {
      logger.error(error)
      handleDatabaseError(error, res);
    }
  })
);


// Get media for an folder endpoint
app.post(
  '/get-media',
  authenticateToken,
  asyncMiddleware(async (req: Request, res: Response) => {
    try {
      const { accountId, folderId } = req.body;

      // Validate input
      const schema = Joi.object({
        accountId: Joi.string().required(),
        folderId: Joi.string().guid()
      });

      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: 'Invalid input data' });
      }
      // Retrieve folders for the specified user from the database
      const result = await pool.query('SELECT * FROM media WHERE folder_id = $2', [accountId, folderId]);
      console.log(result.rows)
      const responseObj = {
        success: true,
        message: 'Images retrieved successfully',
        data: { media: result.rows },
      };

      logger.info(req.body)
      // Send the list of folders in the response
      res.status(200).json(responseObj);
    } catch (error) {
      logger.error(error)
      handleDatabaseError(error, res);
    }
  })
);

// Endpoint to insert a record into the sharing_folder table
app.post('/share-folder',
  authenticateToken,
  asyncMiddleware(async (req: Request, res: Response) => {
    try {
      // Extract data from the form
      const { folderId, phoneNumber, canEdit } = req.body;

      // Validate form data (you might want to add more validation)
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

      // Insert record into the sharing_folder table
      const result = await pool.query(
        'INSERT INTO sharing_folder (folder_id, shared_with, can_edit) VALUES ($1, $2, $3) RETURNING *',
        [folderId, phoneNumber, canEdit]
      );

      // Send the inserted record in the response
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      logger.error(error);
      logger.error({ error: error.message, stack: error.stack }, 'Error sharing folder');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  })
);

// Get shared folders for an account endpoint
app.post(
  '/get-shared-folders',
  authenticateToken,
  asyncMiddleware(async (req: Request, res: Response) => {
    try {
      let { phone_number } = req.body;
      // Validate input
      const schema = Joi.object({
        phone_number: Joi.number().required(),
      });

      const { error } = schema.validate(req.body);
      if (error) {
      logger.error(error)

        return res.status(400).json({ error: 'Invalid input data' });
      }
      phone_number = String(phone_number)
      // Retrieve folders for the specified user from the database
      const result = await pool.query('SELECT * FROM sharing_folder sf INNER JOIN folders f on f.folder_id = sf.folder_id WHERE sf.shared_with = $1', [phone_number]);
      console.log(result.rows)
      const responseObj = {
        success: true,
        message: 'Folders retrieved successfully',
        data: { folders: result.rows },
      };

      logger.info(responseObj);
      // Send the list of folders in the response
      res.status(200).json(responseObj);
    } catch (error) {
      logger.error(error)
      handleDatabaseError(error, res);
    }
  })
);

// Serve static files from the 'uploads' folder, including subdirectories
app.use('/uploads', express.static(path.resolve('./uploads')));

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Error occurred');
  res.status(500).json({ error: 'Internal Server Error' });
});
app.get(
  '/', (req: Request, res: Response) => {
    logger.info(req)
    return res.sendStatus(200);
  }
)
app.listen(port, () => {
  logger.info({ port }, 'Server is running');
});
