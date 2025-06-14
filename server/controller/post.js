const User = require("../model/user");
const Post = require("../model/Post");
const PostCategory = require("../model/PostCategory");
const { Readable } = require("nodemailer/lib/xoauth2");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: "de3eykptz",
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.addPost = (req, res, next) => {
  const { title, category, content, desc, imageSource, status, tag } = req.body;
  const imageBuffer = req.file.buffer;
  const imageName = req.file.originalname;
  const uniqueFileName =
    imageName + "-" + Date.now() + "-" + Math.round(Math.random() * 1e9);

  let imageUrl;
  const options = {
    unique_filename: false,
    overwrite: true,
    public_id: "Blog/image" + uniqueFileName,
  };

  const uploadImage = async (imageBuffer) => {
    try {
      const writeBufferFile = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            const err = new Error(error);
            err.statusCode = 403;
            throw err;
          }
          imageUrl = result.secure_url;
          const post = new Post({
            title: title,
            content: content,
            desc: desc,
            category: category,
            image: imageUrl,
            imgSource: imageSource,
            imageName: imageName,
            tag: tag,
            status: status,
            user: req.userId,
          });

          let postId;

          post
            .save()
            .then((result) => {
              if (!result) {
                const error = new Error("server error");
                error.statusCode = 404;
                throw error;
              }

              postId = result._id;

              return PostCategory.findById(category);
            })
            .then((category) => {
              if (!category) {
                const error = new Error("server error");
                error.statusCode = 404;
                throw error;
              }

              category.posts.push(postId);

              return category.save();
            })
            .then((result) => {
              if (!result) {
                const error = new Error("server error");
                error.statusCode = 404;
                throw error;
              }
              return User.findById(req.userId);
            })
            .then((user) => {
              if (!user) {
                const error = new Error("server error");
                error.statusCode = 404;
                throw error;
              }

              user.posts.push(postId);
              return user.save();
            })
            .then((result) => {
              if (!result) {
                const error = new Error("server error");
                error.statusCode = 404;
                throw error;
              }

              res.status(201).json({ message: "post add done" });
            })
            .catch((err) => {
              if (!err.statusCode) {
                err.statusCode = 500;
              }

              next(err);
            });
        }
      );
      const readableStream = Readable.from(imageBuffer);
      readableStream.pipe(writeBufferFile);
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
        next(err);
      }
    }
  };

  uploadImage(imageBuffer);
};

exports.getProfilePost = (req, res, next) => {
  const pageNumber = req.query.page || 1;
  const getType = req.query.type || "allpost";
  const postStatus = req.query.postStatus || "publish";

  const perPageItem = 6;

  let totalItem;
  let totalPage;

  let type = postStatus === "draft" ? "draft" : "publish";

  let option = getType === "recyclebin" ? "Delete" : type;

  Post.find({
    user: req.userId,
    status: option,
  })
    .countDocuments()
    .then((count) => {
      totalItem = count;

      return Post.find({
        user: req.userId,
        status: option,
      })
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * perPageItem)
        .limit(perPageItem);
    })

    .then((post) => {
      if (post.length == 0) {
        const error = new Error("no post available");
        error.statusCode = 401;
        throw error;
      }

      totalPage = Math.ceil(totalItem / perPageItem);

      const postData = post.map((data) => {
        return {
          imageUrl: data.image,
          desc: data.title,
          postId: data._id,
        };
      });

      res.status(200).json({
        message: "post get done",
        postData: postData,
        totalItem: totalItem,
        totalPage: totalPage,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getEditPostData = (req, res, next) => {
  const postId = req.body.postId;

  Post.findOne({ _id: postId, user: req.userId })
    .then((post) => {
      if (!post) {
        const error = new Error("no post available");
        error.statusCode = 401;
        throw error;
      }
      res.status(200).json({ message: "post get done", postData: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postEditData = (req, res, next) => {
  const { title, category, content, desc, imageSource, status, tag, postId } =
    req.body;

  // First, find the post
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const err = new Error("no post available");
        err.statusCode = 404;
        throw err;
      }

      // Update basic fields
      post.title = title;
      post.category = category;
      post.content = content;
      post.desc = desc;
      post.imgSource = imageSource;
      post.status = status;
      post.tag = tag;
      post.updatedAt = Date.now();

      // If there's a new image file, upload it
      if (req.file) {
        const imageBuffer = req.file.buffer;
        const imageName = req.file.originalname;
        const uniqueFileName =
          imageName + "-" + Date.now() + "-" + Math.round(Math.random() * 1e9);

        const options = {
          unique_filename: false,
          overwrite: true,
          public_id: "Blog/image" + uniqueFileName,
        };

        return new Promise((resolve, reject) => {
          const writeBufferFile = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }
              post.image = result.secure_url;
              post.imageName = imageName;
              resolve(post.save());
            }
          );
          const readableStream = Readable.from(imageBuffer);
          readableStream.pipe(writeBufferFile);
        });
      }

      // If no new image, just save the post
      return post.save();
    })
    .then((result) => {
      res.status(200).json({ message: "post edit done", postData: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.body.postId;
  const postStatus = req.body.status;

  const perPage = 6;
  let totalPost;
  let totalPage;

  Post.findOne({ user: req.userId, _id: postId, status: postStatus })
    .then((post) => {
      if (!post) {
        const error = new Error("post not found");
        error.statusCode = 401;
        throw error;
      }

      post.status = "Delete";

      return post.save();
    })
    .then((result) => {
      if (!result) {
        const error = new Error("server error");
        error.statusCode = 401;
        throw error;
      }

      return Post.find({
        user: req.userId,
        status: postStatus,
      }).countDocuments();
    })
    .then((count) => {
      totalPost = count;

      return Post.find({
        user: req.userId,
        status: postStatus,
      })

        .sort({ createdAt: -1 })
        .limit(6);
    })
    .then((posts) => {
      if (!posts) {
        const error = new Error("server error");
        error.statusCode = 401;
        throw error;
      }

      totalPage = Math.ceil(totalPost / perPage);

      const postData = posts.map((data) => {
        return {
          imageUrl: data.image,
          desc: data.title,
          postId: data._id,
        };
      });

      res.status(200).json({
        message: "post get done",
        postData: postData,
        totalPage: totalPage,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.restorePost = (req, res, next) => {
  const postId = req.body.postId;

  let perPage = 6;
  let totalPost;
  let totalPage;

  Post.findOne({ user: req.userId, _id: postId })
    .then((post) => {
      if (!post) {
        const error = new Error("server error");
        error.statusCode = 401;
        throw error;
      }

      post.status = "draft";

      return post.save();
    })
    .then((result) => {
      return Post.find({ user: req.userId, status: "Delete" }).countDocuments();
    })
    .then((count) => {
      totalPost = count;
      return Post.find({ user: req.userId, status: "Delete" })
        .sort({ createdAt: -1 })
        .limit(perPage);
    })
    .then((posts) => {
      totalPage = Math.ceil(totalPost / perPage);

      if (!posts) {
        const error = new Error("server error");
        error.statusCode = 401;
        throw error;
      }
      const postData = posts.map((data) => {
        return {
          imageUrl: data.image,
          desc: data.title,
          postId: data._id,
        };
      });

      res.status(200).json({
        message: "post restore done",
        postData: postData,
        totalPage: totalPage,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletFromRecycleBin = (req, res, next) => {
  const postId = req.body.postId;
  let postData;
  let totalPost;
  let totalPage;
  const postPerPage = 6;

  Post.findOne({ user: req.userId, _id: postId })
    .then((post) => {
      if (!post) {
        const error = new Error("post not found");
        error.statusCode = 401;
        throw error;
      }

      postData = post;

      return User.findById(postData.user);
    })
    .then((user) => {
      if (!user) {
        const error = new Error("user not found");
        error.statusCode = 401;
        throw error;
      }

      user.posts.pop(postId);
      return user.save();
    })
    .then((result) => {
      if (!result) {
        const error = new Error("Not found");
        error.statusCode = 401;
        throw error;
      }

      return PostCategory.findById(postData.category);
    })
    .then((PostCategoryData) => {
      if (!PostCategoryData) {
        const error = new Error("Postcategory Not found");
        error.statusCode = 401;
        throw error;
      }

      PostCategoryData.posts.pop(postId);
      return PostCategoryData.save();
    })
    .then((result) => {
      if (!result) {
        const error = new Error("server error");
        error.statusCode = 401;
        throw error;
      }

      return Post.findByIdAndDelete(postId);
    })
    .then((post) => {
      if (!post) {
        const error = new Error("server error");
        error.statusCode = 401;
        throw error;
      }

      return Post.find({ user: req.userId, status: "Delete" }).countDocuments();
    })
    .then((count) => {
      totalPost = count;
      return Post.find({ user: req.userId, status: "Delete" })
        .sort({ createdAt: -1 })
        .limit(postPerPage);
    })
    .then((posts) => {
      if (!posts) {
        const error = new Error("server error");
        error.statusCode = 401;
        throw error;
      }

      totalPage = Math.ceil(totalPost / postPerPage);

      const postData = posts.map((data) => {
        return {
          imageUrl: data.image,
          desc: data.title,
          postId: data._id,
          totalPage: totalPage,
        };
      });

      res.status(200).json({ message: "post get done", postData: postData });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
