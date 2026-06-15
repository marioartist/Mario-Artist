const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());

// Serve everything from root folder
app.use(express.static(__dirname));

// Serve uploads folder safely
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use("/uploads", express.static(uploadsDir));

// Allowed file types
const allowedMain = ["ma2d1", "ma3d1", "tstlt", "psprm", "tsbgl", "crsd", "card", "tsanm"];
const allowedThumb = ["png", "jpg", "jpeg", "bmp"];

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// Extension check
function checkExt(file, allowed) {
    if (!file) return false;

    const ext = path.extname(file.originalname)
        .slice(1)
        .toLowerCase();

    return allowed.includes(ext);
}

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Upload route
app.post(
    "/upload",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "file", maxCount: 1 }
    ]),
    (req, res) => {

        const title = req.body.title;
        const thumb = req.files?.thumbnail?.[0];
        const main = req.files?.file?.[0];

        if (!title || !main) {
            return res.status(400).send("Missing title or file");
        }

        const mainExt = path.extname(main.originalname).slice(1).toLowerCase();

        if (!allowedMain.includes(mainExt)) {
            return res.status(400).send("Invalid main file type");
        }

        let thumbName = null;

        if (thumb) {
            const thumbExt = path.extname(thumb.originalname)
                .slice(1)
                .toLowerCase();

            if (!allowedThumb.includes(thumbExt)) {
                return res.status(400).send("Invalid thumbnail type");
            }

            thumbName = thumb.filename;
        }

        const entry = {
            title,
            thumbnail: thumbName,
            file: main.filename,
            time: Date.now()
        };

        const dbFile = path.join(uploadsDir, "data.json");

        let db = [];

        if (fs.existsSync(dbFile)) {
            try {
                db = JSON.parse(fs.readFileSync(dbFile, "utf8"));
            } catch {
                db = [];
            }
        }

        db.push(entry);

        fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

        res.send("Upload successful!");
    }
);

// Start server (IMPORTANT for Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
    console.log("Folder:", __dirname);
});
