import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoComments, addComment, updateComment } from "../controllers/comment.controller.js";

const router = Router();

router.route('/get-video-comments/:videoId').get(verifyJWT, getVideoComments)

router.route('/add-comment/:videoId').post(verifyJWT, addComment)

router.route('/update-comment/:commentId').patch(verifyJWT, updateComment)


export default router;