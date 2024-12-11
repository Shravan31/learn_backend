import { Router } from "express";
import { getUserChannelSubscribers, toggleSubscription, getSubscribedChannels } from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/toggle-subscription/').post(verifyJWT, toggleSubscription)

router.route('/get-user-channel-subscribers').get(verifyJWT, getUserChannelSubscribers)

router.route('/get-subscribed-channels').get(verifyJWT, getSubscribedChannels)

export default router;