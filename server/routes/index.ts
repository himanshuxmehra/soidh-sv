import express, { Router}  from 'express';
import {upload,getListFiles,download} from "../controller/file.controller";

let router: Router = express.Router();

let routes = (app: { use: (arg0: express.Router) => void; }) => {
  router.post("/upload", upload);
  router.get("/files", getListFiles);
  router.get("/files/:name", download);

  app.use(router);
};

module.exports = routes;
