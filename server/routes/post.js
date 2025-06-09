const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");

const routes = express.Router();
const postController = require("../controller/post");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed."));
    }
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'yes', message: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: 'yes', message: err.message });
  }
  next(err);
};

// Apply multer middleware only to the addpost route
routes.post("/addpost", auth, upload.single("image"), handleMulterError, postController.addPost);
routes.get("/getpost", auth, postController.getProfilePost);
routes.post("/getpostdata", auth, postController.getEditPostData);
routes.put("/editpostdata", auth, upload.single("image"), handleMulterError, postController.postEditData);
routes.delete("/postdelete", auth, postController.deletePost);
routes.put("/restorePost", auth, postController.restorePost);
routes.delete("/reccyclePostdelete", auth, postController.deletFromRecycleBin);

module.exports = routes;
