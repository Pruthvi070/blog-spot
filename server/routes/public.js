const express = require("express");

const rourte = express.Router();
const publicController = require("../controller/public");
const auth = require("../middleware/auth");
const profileController = require("../controller/Profile");

rourte.get("/", (req, res, next) => {
  res.status(200).json({
    message: "Hi Wecome to BlogSpot API",
  });
});

rourte.get("/getpost", publicController.getPublishPost);
rourte.post("/getsinglepost", auth, publicController.postPublishPost);
rourte.get("/getcategory", profileController.getCategory);

module.exports = rourte;
