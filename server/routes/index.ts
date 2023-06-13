import express from 'express';
import path from 'path';

const app = express();
const port = 8080;

app.use(express.json);

app.get("/", (req,res)=>{
  
});

app.listen(port, () => console.log(`Server started at localhost:8080`));