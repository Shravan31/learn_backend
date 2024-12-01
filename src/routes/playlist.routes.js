import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router()

router.route("/create-playlist").post(verifyJWT, createPlaylist);

router.route("/add-video-to-playlist").post(verifyJWT, addVideoToPlaylist);

router.route("/remove-video-from-playlist").post(verifyJWT, removeVideoFromPlaylist);

router.route("/get-user-playlists").get(verifyJWT, getUserPlaylists);

router.route("/get-paylist-by-id/").get(verifyJWT, getPlaylistById);

router.route("/update-playlist-details/").post(verifyJWT, updatePlaylist);

router.route("/delete-playlist").delete(verifyJWT, deletePlaylist);

export default router