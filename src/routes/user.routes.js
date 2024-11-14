import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, updateAvatarImage, updateCoverImage, changeCurrentPassword, getCurrentUser, updateAccountDetails, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

router.route('/login').post(loginUser);

// secured routes
router.route('/logout').post(verifyJWT, logoutUser)

router.route('/refresh-token').post(refreshAccessToken)

router.route("/update-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)


router.route('/update-avatar').patch(verifyJWT, upload.single("avatar") ,updateAvatarImage)

router.route('/update-cover-image').patch(verifyJWT, upload.single("coverImage"), updateCoverImage)

router.route("/get-user-channel-info/:username").get(verifyJWT, getUserChannelProfile)

router.route('/watch-history').get(verifyJWT, getWatchHistory)

export default router;