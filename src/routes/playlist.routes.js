import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist } from "../controllers/playlist.controller.js";

const router = Router()

router.route("/create-playlist").post(verifyJWT, createPlaylist);

router.route("/add-video-to-playlist/:playlistId/:videoId").post(verifyJWT, addVideoToPlaylist);

router.route("/remove-video-from-playlist/:playlistId/:videoId").post(verifyJWT, removeVideoFromPlaylist);

router.route("/get-user-playlists").get(verifyJWT, getUserPlaylists);

router.route("/get-paylist-by-id/:playlistId").get(verifyJWT, getPlaylistById);

export default router