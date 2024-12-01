import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const createPlaylist = asyncHandler(async(req, res)=>{
    const { name, description } = req.body;

    if(!name){
        throw new ApiError(400, "Name for the playlist is required")
    }

    const playlist = await Playlist.create({
        name: name,
        description: description || "",
        videos: [],
        owner: req.user?._id
    })
    console.log("Created playlist: ", playlist)

    if(!playlist){
        throw new ApiError(400, "Unable to create playlist. Please try again later");
    }

    return res.status(201).json(new ApiResponse(201, playlist, "playlist created"));
})

const getUserPlaylists = asyncHandler(async(req, res)=>{
    const playlists = await Playlist.aggregate(
        [
            {
                '$match': {
                    'owner': req.user?._id
                }
            }, 
            {
                '$lookup': {
                    'from': 'videos', 
                    'localField': 'videos', 
                    'foreignField': '_id', 
                    'as': 'playlist', 
                    'pipeline': [
                        {
                            '$match': {
                            'isPublished': true
                            }
                        }, 
                        {
                            '$lookup': {
                                'from': 'users', 
                                'localField': 'owner', 
                                'foreignField': '_id', 
                                'as': 'owner', 
                                'pipeline': [
                                    {
                                        '$project': {
                                            'username': 1, 
                                            'avatar': 1
                                        }
                                    }
                                ]
                            }
                        }, 
                        {
                            '$addFields': {
                                'owner': {
                                    '$first': '$owner'
                                }
                            }
                        }, 
                        {
                            '$project': {
                                'title': 1, 
                                'description': 1, 
                                'videoFile': 1, 
                                'thumbnail': 1, 
                                'owner': 1, 
                                'view': 1, 
                                'duration': 1
                            }
                        }
                    ]
                }
            }, 
            {
                '$project': {
                    'playlist': 1, 
                    'name': 1, 
                    'description': 1
                }
            }
        ]
    )
    if(!playlists){
        throw new ApiError(400, "user has no playlists");
    }
    console.log("playlists ", playlists);
    return res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.query
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "PlaylistId is required");
    }

    const playList = await Playlist.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(playlistId),
          },
        },
        {
          $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "playlistVideos",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "owner",
                  pipeline: [
                    {
                      $project: {
                        username: 1,
                        avatar: 1,
                      },
                    },
                  ],
                },
              },
              {
                $addFields: {
                  owner: {
                    $first: "$owner",
                  },
                },
              },
              {
                $project: {
                  thumbnail: 1,
                  duration: 1,
                  owner: 1,
                  videoFile: 1,
                  title: 1,
                  description: 1,
                  isPublished: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
              {
                $project: {
                  username: 1,
                  avatar: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            owner: {
              $first: "$owner",
            },
          },
        },
        {
          $project: {
            owner: 1,
            playlistVideos: 1,
          },
        },
    ])

    if(!playList){
        throw new ApiError(400, "failed to fetch playlist try again");
    }

    return res.status(200)
            .json(new ApiResponse(200, playList, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.query;

    console.log("id's", req.query);

    if(!(isValidObjectId(playlistId) && isValidObjectId(videoId))){
        throw new ApiError(400, "PlaylistId and videoId both are required");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400, "playList not found");
    }

    playlist.videos.push(new mongoose.Types.ObjectId(videoId));

    const videoAddedInPlaylist = await playlist.save({validateBeforeSave: false});

    console.log("video Added In Playlist", videoAddedInPlaylist);

    return res.status(201).json(new ApiResponse(201, videoAddedInPlaylist, "video added to the playlist"));

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.query
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)){
        throw new ApiError(400, "PlaylistId and VideoId required")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400, "playList not found");
    }

    playlist.videos = playlist.videos.filter(playlistVideoId => playlistVideoId.toString() !== new mongoose.Types.ObjectId(videoId).toString())
    
    const playlistAfterVideoRemoved = await playlist.save({validateBeforeSave: false});

    console.log("Video removed from playlist", playlistAfterVideoRemoved);

    return res.status(200).json(new ApiResponse(200, playlistAfterVideoRemoved, "video removed successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.query
    console.log("playlistId", playlistId)
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlistId is required")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if(!deletedPlaylist){
        throw new ApiError(400, "Unable to delete playlist due some reason please try again")
    }

    console.log("deleted playlist", deletedPlaylist);

    return res.status(200).json(new ApiResponse(200, {}, "playlist deleted successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.query
    const {name, description} = req.body

    console.log("name, description",name, description)
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlistId is required")
    }

    if(!name){
        throw new ApiError(400, "name is required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $set:{
            name: name,
            description: description
        }
    },
    {
        new: true
    })

    if(!updatedPlaylist){
        throw new ApiError(400, "something went wrong while updating the playlist details, please try again")
    }

    console.log("updated playlist", updatedPlaylist);

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "playlist details updated successfully"))

})



export {
    createPlaylist,
    getUserPlaylists,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist
}