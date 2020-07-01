const postController = require("../controllers/posts");
const express = require("express");
const isAuth = require("../middlewares/authorization");
const router = express.Router();

//string validation like email and password requirements
const { check, validationResult } = require("express-validator");

router.post("/", isAuth, postController.createPost);

router.put("/", isAuth, postController.updatePost);

router.post("/getPosts", postController.getPosts);
router.post("/getUsersPost/:userId", isAuth, postController.getUserPosts);
router.post("/like/:postId", isAuth, postController.likePost);
router.post("/comment/:postId", isAuth, postController.commentPost);
router.post("/deletePost/:postId", isAuth, postController.deletePost);
router.post("/getSinglePost/:postId", isAuth, postController.getSinglePost);

module.exports = router;
