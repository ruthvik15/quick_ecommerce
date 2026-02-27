const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "quick_ecommerce_products",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: "limit"
      }
    ],
    public_id: (req, file) => {
      return Date.now() + "-" + file.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
    }
  },
});

// FIXED: Add file size limits (5MB) and server-side file type validation
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // FIXED: Validate file type on server side as backup security measure
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: jpg, png, webp`));
    }
  }
});
console.log("Cloudinary Storage Configured");

// Fallback to local storage - disabled for now 
//  else {
//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'public/uploads/');
//     },
//     filename: (req, file, cb) => {
//       cb(null, Date.now() + '-' + file.originalname);
//     }
//   });
//   upload = multer({ storage: storage });
//   console.log("No Cloud keys found - Using Local Storage");
// }

module.exports = upload;
