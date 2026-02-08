// utils/s3Uploader.js (Renamed internally, functionality is Cloudinary now)
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

let upload;

// Check for Cloudinary credentials
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "quick_ecommerce_products", // Folder name in Cloudinary
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      // transformation: [{ width: 500, height: 500, crop: "limit" }] // Optional resizing
    },
  });

  upload = multer({ storage: storage });
  console.log("✅ Cloudinary Storage Configured");

} else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET) {
  // Keep S3 backup logic just in case
  const multerS3 = require("multer-s3");
  const { S3Client } = require("@aws-sdk/client-s3");
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const filename = `products/${Date.now()}-${file.originalname}`;
        cb(null, filename);
      }
    })
  });
  console.log("✅ AWS S3 Storage Configured");
} else {
  // Fallback to local storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  upload = multer({ storage: storage });
  console.log("⚠️ No Cloud keys found - Using Local Storage");
}

module.exports = upload;
