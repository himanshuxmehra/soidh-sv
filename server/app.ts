import cors from 'cors';
import multer from 'multer';
import express from 'express';

const app = express();

declare global {
  var __basedir: string;
}
global.__basedir = __dirname;

const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb (null, './uploads');
  },
  filename: function(req, file, cb){
    cb (null, `${Date.now()}-${file.originalname}`);
  }
})

const upload = multer({storage: storage});

// app.use(cors());
// app.use(express.json);
app.use(express.urlencoded({ extended: false }));



app.post("/upload", upload.single('images'), (req,res)=>{
  console.log(req.body);
  console.log(req.file);

  return res.status(200).send({
    message: 'File uploaded!'
 });;
});

let port = 8080;

app.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});
