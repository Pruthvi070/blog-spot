const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../model/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("./mail");
const getCookieValue = require("../helper/cookieHandler");

exports.signup = (req, res, next) => {
  const error = validationResult(req);

  if (!error.isEmpty()) {
    const err = new Error("Validation Error");
    err.statusCode = 403;
    const errArray = error.array();
    err.data = errArray[0].msg;
    throw err;
  }

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const min = 12456;
  const max = 98985;
  const randomOTP = Math.floor(Math.random() * (max - min + 1)) + min;

  let userId;
  let encryptPassword;

  bcrypt
    .hash(password, 12)
    .then((hashPassword) => {
      encryptPassword = hashPassword;

      return User.findOne({ email: email });
    })
    .then((user) => {
      const ip = req.clientIp;
      const resetTime = Date.now() + 900000;
      if (user) {
        user.email = email;
        user.password = encryptPassword;
        user.name = name;
        user.otp = randomOTP;
        user.ip = ip;
        user.resetTokenExp = resetTime;

        return user.save();
      }

      const newUser = new User({
        name: name,
        email: email,
        password: encryptPassword,
        otp: randomOTP,
        ip: req.clientIp,
        resetTokenExp: resetTime,
      });

      return newUser.save();
    })
    .then((response) => {
      userId = response._id;
      let message = `Thank you for signing up with BlogSopt!. To ensure the security of
              your account, we require you to verify your email address. Please
              use the following one-time password (OTP) to complete the
              verification process.This OTP is valid for <span style="font-weight: 600; color: #1f1f1f">15 minutes</span>.
              Do not share this with others.`;

      let action = `   <p
              style="
                margin: 0;
                margin-top: 60px;
                font-size: 30px;
                font-weight: 600;
                letter-spacing: 15px;
                color: #ba3d4f;
              "
            >
              ${randomOTP}
            </p>`;

      let title = "OTP";

      return sendEmail(title, email, name, message, action);
    })
    .then((response) => {
      res.status(201).json({
        message: "otp send successfully",
        userId: userId,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.verifyOtp = (req, res, next) => {
  const error = validationResult(req);

  if (!error.isEmpty()) {
    const err = new Error("Validation Error");
    err.statusCode = 422;
    err.data = error.array();
    throw err;
  }
  const otp = req.body.otp;
  const userId = req.body.userId;

  User.findOne({ _id: userId, resetTokenExp: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        const error = new Error("user not found");
        error.statusCode = 404;
        throw error;
      }

      if (Number(otp) === user.otp) {
        user.valid = "yes";
        return user.save();
      }
    })
    .then((result) => {
      if (!result) {
        return res.status(403).json({ message: "notverified" });
      }
      res.status(201).json({ message: "verified" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = async (req, res, next) => {
  try {
    console.log('Login request received:', {
      email: req.body.email,
      hasPassword: !!req.body.password,
      headers: req.headers
    });

    // Validate request body
    const error = validationResult(req);
    if (!error.isEmpty()) {
      console.log('Validation errors:', error.array());
      return res.status(422).json({
        error: 'yes',
        errors: {
          message: "Validation failed",
          details: error.array()
        }
      });
    }

    const { email, password } = req.body;

    // Check if SECRET is configured
    const secret = process.env.SECRET;
    if (!secret) {
      console.error('Server configuration error: Missing SECRET');
      return res.status(500).json({
        error: 'yes',
        errors: {
          message: "Server configuration error: Missing SECRET"
        }
      });
    }

    // Check MongoDB connection
    if (!User) {
      console.error('Database connection error: User model not found');
      return res.status(500).json({
        error: 'yes',
        errors: {
          message: "Database connection error"
        }
      });
    }

    // Find user
    let user;
    try {
      console.log('Attempting to find user in database...');
      user = await User.findOne({ email: email });
      console.log('User found:', user ? {
        id: user._id,
        email: user.email,
        isVerified: user.valid === "yes"
      } : 'No user found');
    } catch (dbError) {
      console.error('Database error:', {
        message: dbError.message,
        stack: dbError.stack
      });
      return res.status(500).json({
        error: 'yes',
        errors: {
          message: "Database error occurred",
          details: dbError.message
        }
      });
    }
    
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        error: 'yes',
        errors: {
          message: "Invalid email or password"
        }
      });
    }

    // Check if email is verified
    if (user.valid !== "yes") {
      console.log('User email not verified:', email);
      return res.status(401).json({
        error: 'yes',
        errors: {
          message: "Please verify your email before logging in"
        }
      });
    }

    // Compare passwords
    let match;
    try {
      console.log('Comparing passwords...');
      match = await bcrypt.compare(password, user.password);
      console.log('Password match:', match);
    } catch (bcryptError) {
      console.error('Password comparison error:', {
        message: bcryptError.message,
        stack: bcryptError.stack
      });
      return res.status(500).json({
        error: 'yes',
        errors: {
          message: "Error comparing passwords",
          details: bcryptError.message
        }
      });
    }

    if (!match) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({
        error: 'yes',
        errors: {
          message: "Invalid email or password"
        }
      });
    }

    // Generate JWT token
    let token;
    try {
      console.log('Generating JWT token...');
      const expireTime = process.env.LOGIN_EXPIRES || 3600; // Default to 1 hour in seconds
      const tokenExpiry = Date.now() + (expireTime * 1000); // Convert to milliseconds for storage
      token = jwt.sign(
        {
          email: user.email,
          userId: user._id.toString(),
          ip: req.clientIp,
          userAgent: req.headers["user-agent"],
          expireTime: tokenExpiry
        },
        secret,
        { expiresIn: expireTime } // Pass as seconds
      );
      console.log('JWT token generated successfully');

      // Set cookies
      const options = {
        maxAge: expireTime * 1000, // Convert to milliseconds for cookie
        httpOnly: true,
        path: '/',
        sameSite: 'lax'
      };

      if (process.env.APPLICATION_START_MODE === "production") {
        options.secure = true;
        options.sameSite = "None";
        options.domain = process.env.DOMAIN || "localhost";
      }

      console.log('Setting cookies for user:', user.email);
      res.cookie("user_token", token, options);
      res.cookie("isLogin", "yes", options);
    } catch (jwtError) {
      console.error('JWT signing error:', {
        message: jwtError.message,
        stack: jwtError.stack
      });
      return res.status(500).json({
        error: 'yes',
        errors: {
          message: "Error creating authentication token",
          details: jwtError.message
        }
      });
    }

    // Send success response
    console.log('Login successful for:', user.email);
    return res.status(200).json({
      message: "login done",
      user: {
        email: user.email,
        name: user.name
      }
    });

  } catch (err) {
    console.error('Login error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return res.status(500).json({
      error: 'yes',
      errors: {
        message: "An error occurred during login",
        details: err.message || "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }
};

exports.tokenVerify = (req, res, next) => {
  res.status(200).json({
    message: "valid auth",
  });
};

exports.sendResetLink = (req, res, next) => {
  const error = validationResult(req);

  if (!error.isEmpty()) {
    const err = new Error("Validation Error");
    err.statusCode = 403;
    const errArray = error.array();
    err.data = errArray[0].msg;
    throw err;
  }

  crypto.randomBytes(32, (err, bytes) => {
    if (err) {
      const error = new Error("Validation Error");
      error.statusCode = 500;
      throw error;
    }

    const token = bytes.toString("hex");
    const email = req.body.email;
    let name;

    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          const err = new Error("email is not registered");
          err.statusCode = 403;
          err.data = "email is not registered";
          throw err;
        }
        name = user.name;
        user.resetToken = token;
        user.resetTokenExp = Date.now() + 900000;
        user.isTokenExp = "no";
        return user.save();
      })
      .then((result) => {
        let message = `We received a request to reset the password for your BlogSpot account. 
        To proceed with the password reset, please click on the link below. 
        This link is valid for <span style="font-weight: 600; color: #1f1f1f">15 minutes</span>. Do not share this with others.`;

        let domain = process.env.RESET_URL || "http://localhost:3000";
        let resetUrl = `${domain}/resetpassword?token=${token}`;

        let action = `<a
              style="
                width: 95%;
                margin: auto;
                text-decoration: none;
                color: white;
                text-align: center;
              "
              href="${resetUrl}"
              target="_blank"
              ><p
                style="
                  max-width: 150px;
                  margin: 20px auto;
                  padding: 15px 0px;
                  font-size: 1.2rem;
                  font-weight: 500;
                  background-color: rgb(3, 30, 56);
                  border: 0px;
                  border-radius: 8px;
                "
              >
                Click Here
              </p></a>`;

        let title = "Password Reset Link";

        return sendEmail(title, email, name, message, action);
      })
      .then(() => {
        res.status(200).json({ message: "reset link send" });
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  });
};

exports.getNewResetToken = (req, res, next) => {
  const token = req.query.token;
  User.findOne({
    resetToken: token,
    resetTokenExp: { $gt: Date.now() },
    isTokenExp: "no",
  })
    .then((user) => {
      if (!user) {
        const error = new Error("no user found");
        error.statusCode = 404;
        error.data = "no user found";
        throw error;
      }

      res.status(200).json({
        message: "token verified",
        userId: user._id.toString(),
        token: token,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const error = validationResult(req);

  if (!error.isEmpty()) {
    const err = new Error("Validation Error");
    err.statusCode = 403;
    const errArray = error.array();
    err.data = errArray[0].msg;
    throw err;
  }

  const userId = req.body.userId;
  const password = req.body.password;
  const token = req.body.token;

  bcrypt
    .hash(password, 12)
    .then((hashPassword) => {
      User.findOne({
        _id: userId,
        resetToken: token,
        resetTokenExp: { $gt: Date.now() },
        isTokenExp: "no",
      })
        .then((user) => {
          if (!user) {
            const error = new Error("no user found");
            error.statusCode = 404;
            error.data = "no user found";
            throw error;
          }

          user.password = hashPassword;
          user.isTokenExp = "yes";
          return user.save();
        })
        .then((result) => {
          res.status(201).json({ message: "password reset done" });
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }

          next(err);
        });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.getLogout = (req, res, next) => {
  const cookieSting = req.headers.cookie;
  const cookieName = "user_token";
  const token = getCookieValue.getCookieValue(cookieSting, cookieName);
  const domain = process.env.DOMAIN || "localhost";
  const option = {
    domain: domain,
    sameSite: "None",
    secure: true,
  };
  res.clearCookie("user_token", option);
  res.clearCookie("isLogin", option);
  res.status(200).json({ messgae: "logout done" });

  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("no user found");
        error.statusCode = 403;
        throw error;
      }
      user.blockedToken.push({ type: token });
      return user.save();
    })
    .then((result) => {
      console.log("logout");
    })
    .catch((err) => {
      next(err);
    });
};
