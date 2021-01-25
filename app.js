const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const multer = require("multer");
const gtts = require("gtts");
const extract = require("pdf-text-extract");


const app = express();

var dir = "public";
var subDir = "public/uploads";

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(morgan('dev'));

if(!fs.existsSync(dir)){
  fs.mkdirSync(dir)
  fs.mkdirSync(subDir)
}


const pdfFilter = function (req, file, callback) {
  var ext = path.extname(file.originalname);
  if (ext !== ".pdf") {
    return callback("This Extension is not supported");
  }
  callback(null, true);
};

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var pdftoaudioupload = multer({
  storage: storage,
  fileFilter: pdfFilter,
}).single("file");

app.get('/',(req,res)=>{
  res.render('index',{
    title:'PDF-AUDIO-APP'
  })
});

app.post("/uploadpdf", (req, res) => {
  pdftoaudioupload(req, res, function (err) {
    if (err) {
      return res.end("Error uploading file.");
    }
    res.json({
      path: req.file.path,
    });
  });
});

app.post("/converttoaudio", (req, res) => {
  outputfile = Date.now() + "output.txt"
  extract(req.body.path, { splitPages: false }, function (err, text) {
    if (err) {
      console.dir(err);
      return;
    }
    console.log(text);
    fs.writeFileSync(outputfile, text);

    console.log(fs.readFileSync(outputfile,'utf-8'))

    var gttsVoice = new gtts(fs.readFileSync(outputfile,'utf-8'), req.body.language);

    outputFilePath = Date.now() + "output.mp3";


    gttsVoice.save(outputFilePath, function (err, result) {
      if (err) {
        fs.unlinkSync(outputFilePath);
        res.send("An error takes place in generating the audio");
      }
      res.json({
        path: outputFilePath,
      });
    });
  });
});

app.get("/download", (req, res) => {
  var pathoutput = req.query.path;
  console.log(pathoutput);
  var fullpath = path.join(__dirname, pathoutput);
  res.download(fullpath, (err) => {
    if (err) {
      fs.unlinkSync(fullpath);
      res.send(err);
    }
    fs.unlinkSync(fullpath);
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
  console.log(`App listining to port ${PORT}`)
})



