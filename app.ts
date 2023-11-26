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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(req.body);
    const { userId, folderId } = req.body;
    const path = `./uploads/${userId}/${folderId}`;
    fs.mkdirSync(path, { recursive: true });
    cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage }).single("image");
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
app.post("/upload", upload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image provided" });
  }

  // Process the image (e.g., save it to a database or storage service)
  // Here, we'll just send back a success response with the image details
  // console.log(req)
  const image = req.file;
  // console.log(req.body)

  res.status(200).json({
    message: "Image uploaded successfully",
    originalname: image.originalname,
    mimetype: image.mimetype,
    size: image.size,
  });
});

app.get("/isUploaded", async (req, res) => {
  try {
    const rawData = await fs.readFile('data.json', 'utf-8');
    const jsonData = JSON.parse(rawData);

    // Get the value from the query parameter
    const searchValue = req.body.parameter as string;

    // Filter the data based on the searchValue
    const filteredData = jsonData.filter((item: any) =>
      item.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    if (filteredData.length > 0) {
      res.status(200).json({ message: 'Value found', data: filteredData });
    } else {
      res.status(404).json({ message: 'Value not found' });
    }
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post("/isUploaded", async (req, res) => {
  const { filename, value } = req.body;

  if (!filename || !value) {
    return res.status(400).json({ error: "Both key and value are required" });
  }

  try {
    const rawData = await fs.readFile("data.json", "utf-8");
    const jsonData = JSON.parse(rawData);

    // Add the new key-value pair to the data
    jsonData.push({ [filename]: value });

    // Write the updated data back to the file
    await fs.writeFile("data.json", JSON.stringify(jsonData, null, 2));

    res.json({ message: "added successfully" });
  } catch (error) {
    console.error("Error adding key-value pair:", error);
    res.status(500).json({ error: "Failed to add key-value pair" });
  }
});

app.post("/createFolder", (req, res) => {
  console.log(req.body);
  const { userId, folderId } = req.body;
  const path = `./uploads/${userId}/${folderId}`;
  fs.mkdirSync(path, { recursive: true });
  return res.status(200).send({
    message: "File uploaded!",
  });
});

app.post("/getFolders", (req, res) => {
  console.log(req.body);
  const { userId } = req.body;
  return res.status(200).send({
    message: "File uploaded!",
  });
});



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
        return res.status(400).json({ error: 'Phone number is already registered' });
      }

      // If not registered, insert into the database
      const hashedPassword = await bcrypt.hash(phoneNumber, 10);
      await pool.query('INSERT INTO users (phone_number, password) VALUES ($1, $2)', [phoneNumber, hashedPassword]);

      return res.status(200).json({ message: 'User registered successfully', success:true });
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
      return res.status(200).json({ data:{otp:otp} , success:true});
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
      const accountId = uuidv4();
      const token = jwt.sign({ accountId, phoneNumber }, jwtSecret, { expiresIn: '72h' });

      return res.status(200).json({ data:{token, accountId}, success:true });
    } catch (error) {
      logger.error(error);

      handleDatabaseError(error, res);
    }
  })
);


// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
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
      const folderPath = `uploads/${accountId}/${folderId}_${folderName}`;

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


// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Error occurred');
  res.status(500).json({ error: 'Internal Server Error' });
});
app.get(
  '/',(req: Request, res: Response)=>{
    return res.sendStatus(200);
  } 
)
app.listen(port, () => {
  console.log("dfsdfsdfsdfsd")
  logger.info({ port }, 'Server is running');
});
