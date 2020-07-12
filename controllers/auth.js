const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cryptoRandomString = require("crypto-random-string");

exports.postSignUp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //console.log(errors);
    var err = new Error("error occurd in backend validation");
    err.statusCode = 401;
    throw err;
  }
  //check if user with that email already exists
  User.find({ email: req.body.email })
    .then((user) => {
      if (user.length > 0) {
        return res.status(422).json({
          message: "User with this Email already exists",
        });
      }

      const unHashedpassword = req.body.password;
      bcrypt
        .hash(unHashedpassword, 12)
        .then((hashedPassword) => {
          const user = new User({
            name: req.body.name,
            email: req.body.email,
            //Set verification flag to false when creating users
            emailVerified: false,
            password: hashedPassword,
            imageUrl: "images\\default.jpeg",
            posts: [],
            likedPosts:[]
          });

          let verificationToken = cryptoRandomString({
            length: 10,
            type: "url-safe",
          });
          user.verificationToken = verificationToken;

          return user.save();
        })
        .then((result) => {
          //Send email to the user for verification
          //////////////////////////////////////////

          let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              //Author email needs less secure apps switch to be off
              user: "naemaaerp@gmail.com",
              pass: "nuwakot123",
            },
          });
          let verificationLink = `http://localhost:8080/auth/verify?id=${result._id}&token=${result.verificationToken}`;
          var mailOptions = {
            from: "noreply@doodle.com",
            to: result.email,
            subject: "Sending Email using Node.js",
            text:
              "Click the following link to verify your email. \n" +
              verificationLink,
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              //console.log(error);
              return res.json({
                message: "Something went wrong.",
              });
            } else {
              //console.log("Email sent: " + info.response);
              return res.json({
                message: "User creation sucessfull. Email sent!",
              });
            }
          });
        })
        .catch((err) => {
          throw err;
        });
    })
    .catch((err) => {
      err.statusCode = 500;
      next(err);
    });
};

exports.postLogIn = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var err = new Error("error occurd in backend validation");
    err.statusCode = 401;
    throw err;
  }
  //check if user with that email already exists
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(422).json({
          message: "User with this email doesn't exist.",
        });
      }
      //If user is not verified do not let login
      if (!user.emailVerified) {
        let message =
          "User is not verified. Please verify before logging in. Check email " +
          user.email;
        return res.status(406).json({
          message,
        });
      }
      const storedUserId = user._id;
      const storedEmail = user.email;
      const storedName = user.name;
      const inputPassword = req.body.password;
      bcrypt
        .compare(inputPassword, user.password)
        .then((isEqual) => {
          if (!isEqual) {
            return res.status(401).json({
              message: "Incorrect password",
            });
          }
          return jwt.sign(
            {
              userId: storedUserId,
              userEmail: storedEmail,
              username: storedName,
              emailVerified:true
            },
            "thisissexretkey",
            { expiresIn: "1h" }
          );
        })
        .then((token) => {
          //console.log("user signed in sucessfully");
          res.status(201).json({
            token: token,
            userId: storedUserId,
            username: storedName,
            messege: "user creation sucessfull",
          });
        })
        .catch((err) => {
          throw err;
        });
    })
    .catch((err) => {
      err.statusCode = 500;
      next(err);
    });
};

exports.verifyUser = (req, res) => {
  //console.log(req.query.id + " " + req.query.token);
  User.findById(req.query.id)
    .then((user) => {
      if (user === null) {
        return res.json({
          message: "No user with that id registered. Try again.",
        });
      }
      if (user.verificationToken === req.query.token) {
        user
          .update({ emailVerified: true })
          .then((user) => res.json({ message: "Email Verification complete." }))
          .catch((err) => res.json("Token validation failed. Try again."));
      } else {
        return res.json({ message: "Token not valid. Try again." });
      }
    })
    .catch((e) => {
      //console.log(e);
      return res.json({ message: "Something went wrong." });
    });
};

exports.confirmUser = (req, res) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      //Author email needs less secure apps switch to be off
      user: "naemaaerp@gmail.com",
      pass: "nuwakot123",
    },
  });

  let verificationToken = cryptoRandomString({ length: 10, type: "url-safe" });

  User.findById(req.userId).then((user) => {
    user.verificationToken = verificationToken;
    user.save();
  });
  let verificationLink = `http://localhost:8080/verify?id=${req.userId}&token=${verificationToken}`;
  var mailOptions = {
    from: "noreply@doodle.com",
    to: req.userEmail,
    subject: "Sending Email using Node.js",
    text:
      "Click the following link to verify your email. \n" + verificationLink,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      //console.log(error);
      return res.json({ message: "Something went wrong." });
    } else {
      //console.log("Email sent: " + info.response);
      return res.json({ message: "Email sent!" });
    }
  });
};
