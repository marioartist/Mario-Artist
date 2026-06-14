const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static("public"));

const allowedMain = ["ma2d1","ma3d1","tstlt","psprm","tsbgl"];
const allowedThumb = ["png","jpg","jpeg","bmp"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// validate file types
function checkExt(file, allowed) {
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  return allowed.includes(ext);
}

app.post("/upload", upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "file", maxCount: 1 }
]), (req, res) => {

  const title = req.body.title;
  const thumb = req.files.thumbnail?.[0];
  const main = req.files.file?.[0];

  if (!title || !thumb || !main) {
    return res.send("Missing data");
  }

  if (!checkExt(thumb, allowedThumb)) {
    return res.send("Invalid thumbnail type");
  }

  if (!checkExt(main, allowedMain)) {
    return res.send("Invalid main file type");
  }

  const entry = {
    title,
    thumbnail: thumb.filename,
    file: main.filename,
    time: Date.now()
  };

  const dbFile = "uploads/data.json";
  let db = [];

  if (fs.existsSync(dbFile)) {
    db = JSON.parse(fs.readFileSync(dbFile));
  }

  db.push(entry);
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

  res.send("Upload successful!");
});

app.listen(3000, () => {
  console.log("Running on http://localhost:3000");
});