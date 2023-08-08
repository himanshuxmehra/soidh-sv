import {uploadFile} from "../middleware/upload";
import fs from "fs";

export const upload = async (req:any, res:any) => {
  try {
    uploadFile(req,res,next);
    console.log(req)
    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    res.status(200).send({
      message: "Uploaded the file successfully: " + req?.file?.originalname,
    });
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req?.file?.originalname}. ${err}`,
    });
  }
};

export const getListFiles = (req:any, res:any)=> {
  const directoryPath = __basedir + "/uploads/";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos:any = [];

    files.forEach((file: any) => {
      fileInfos.push({
        name: file,
        url: directoryPath + file,
      });
    });

    res.status(200).send(fileInfos);
  });
};

export const download = (req:any, res:any) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  res.download(directoryPath + fileName, fileName, (err:any) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }
  });
};

