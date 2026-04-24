import multer from "multer";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

/**
 * TODO: Configure multer for image uploads
 *
 * 1. Define __dirname and UPLOAD_DIR (path to uploads folder in project root)
 * 2. Create diskStorage with:
 *    - destination: UPLOAD_DIR
 *    - filename: Generate unique name using Date.now() and crypto.randomBytes(4).toString('hex')
 *      Format: {timestamp}-{random}{extension}
 * 3. Add fileFilter to validate:
 *    - Only allow image/jpeg, image/png, image/gif
 *    - Reject others with: cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false)
 * 4. Set limits:
 *    - fileSize: 5MB (5 * 1024 * 1024)
 * 5. Export upload middleware
 *
 * Example structure:
 * const __dirname = path.dirname(fileURLToPath(import.meta.url));
 * const UPLOAD_DIR = path.join(__dirname, '../../uploads');
 *
 * const storage = multer.diskStorage({
 *   destination: (req, file, cb) => { ... },
 *   filename: (req, file, cb) => { ... }
 * });
 *
 * const fileFilter = (req, file, cb) => { ... };
 *
 * export const upload = multer({ storage, fileFilter, limits: { ... } });
 */

// Your code here

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// import.meta.url → gives file URL
// fileURLToPath() → converts to file path
// path.dirname() → gives folder path

const UPLOAD_DIR = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${path.extname(file.originalname)}`,
    );
  },
});


//  const fileFilter = (req, file, cb) => {
//   const validTypes = ["image/jpeg", "image/png", "image/gif"];

//   if (!validTypes.includes(file.mimetype)) {
//     cb(
//       new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."),
//       false,
//     );
//   } else {
//     cb(null, true);
//   }
// };

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/gif"
  ) {
    cb(null, true);
  } else {
    req.fileValidationError =
      "Invalid file type. Only JPEG, PNG, and GIF are allowed.";
    cb(null, false);
  }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {fileSize: 5 * 1024 * 1024,}
})
