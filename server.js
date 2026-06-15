const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());

// Serve files from project root
app.use(express.static(__dirname));

// Serve uploads folder publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const allowedMain = ["ma2d1", "ma3d1", "tstlt", "psprm", "tsbgl"];
const allowedThumb = ["png", "jpg", "jpeg", "bmp"];

// Create uploads folder if it doesn't exist
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

function checkExt(file, allowed) {
    const ext = path.extname(file.originalname)
        .slice(1)
        .toLowerCase();

    return allowed.includes(ext);
}

app.post("/upload",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "file", maxCount: 1 }
    ]),
    (req, res) => {

        const title = req.body.title;
        const thumb = req.files?.thumbnail?.[0];
        const main = req.files?.file?.[0];

        if (!title || !thumb || !main) {
            return res.status(400).send("Missing data");
        }

        if (!checkExt(thumb, allowedThumb)) {
            return res.status(400).send("Invalid thumbnail type");
        }

        if (!checkExt(main, allowedMain)) {
            return res.status(400).send("Invalid main file type");
        }

        const entry = {
            title,
            thumbnail: thumb.filename,
            file: main.filename,
            time: Date.now()
        };

        const dbFile = path.join(__dirname, "uploads", "data.json");

        let db = [];

        if (fs.existsSync(dbFile)) {
            try {
                db = JSON.parse(fs.readFileSync(dbFile, "utf8"));
            } catch {
                db = [];
            }
        }

        db.push(entry);

        fs.writeFileSync(
            dbFile,
            JSON.stringify(db, null, 2)
        );

        res.send("Upload successful!");
    }
);

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`);
});
