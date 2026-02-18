import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDir = path.join(process.cwd(), "src", "image");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

// Immediately delete a single file after you're done processing it
export function deleteFile(filePath: string) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Failed to delete file:", filePath, err);
    } else {
      console.log("Deleted file:", filePath);
    }
  });
}

// Safety net: delete any files older than maxAgeMs (default: 1 hour)
export function startCleanupScheduler(
  intervalMs: number = 30 * 60 * 1000, // run every 30 minutes
  maxAgeMs: number = 60 * 60 * 1000, // delete files older than 1 hour
) {
  setInterval(() => {
    fs.readdir(uploadDir, (err, files) => {
      if (err) return console.error("Cleanup error:", err);

      const now = Date.now();
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          const fileAge = now - stats.mtimeMs;
          if (fileAge > maxAgeMs) {
            deleteFile(filePath);
          }
        });
      }
    });
  }, intervalMs);
  console.log(
    `[Cleanup] Scheduler started — deleting files older than ${maxAgeMs / 60000} min`,
  );
}

export default upload;
