import cors from "cors";
import multer from "multer";
import fs from "fs";
import express from "express";


const app = express();

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

let port = 8080;

app.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});
