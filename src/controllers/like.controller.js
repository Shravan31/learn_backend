import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import mongoose, { isValidObjectId } from "mongoose";


const toggleVideoLike = asyncHandler(async(req, res)=>{
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required")
    }

    // if like made by user already exist then toggle like
    const likeEntryExist = await Like.aggregate([
        {
            $match:{
                $and:[
                    {video: new mongoose.Types.ObjectId(videoId)},
                    {likedBy: req.user?._id}
                ]
            }
        }
    ])

    if(likeEntryExist.length > 0){// toggle the like
        // remove the entry
        console.log("liked video details", likeEntryExist[0])
        const likeToToggle = likeEntryExist[0];

        const deletedLike = await Like.findByIdAndDelete(likeToToggle._id)

        if(!deletedLike){
            throw new ApiError(400, "Could not undo the like operation due some reason please try again")
        }

        return res.status(200).json(new ApiResponse(200, {}, "like operation undone successfully"))

    }
    else{ // else create the like record on that video
        // add the like entry
        const addedLike = await Like.create({
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: req.user?._id
        })

        if(!addedLike){
            throw new ApiError(400, "Could not like the video due some reason please try again")
        }

        console.log("like added", addedLike);

        return res.status(201).json(new ApiResponse(201, addedLike, "Liked video successfully"))
    }
})

const toggleCommentLike = asyncHandler(async(req, res)=>{
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Comment id is required")
    }

    // if like made by user already exist then toggle like
    const likeEntryExist = await Like.aggregate([
        {
            $match:{
                $and:[
                    {comment: new mongoose.Types.ObjectId(commentId)},
                    {likedBy: req.user?._id}
                ]
            }
        }
    ])

    if(likeEntryExist.length > 0){// toggle the like
        // remove the entry
        console.log("liked comment details", likeEntryExist[0])
        const likeToToggle = likeEntryExist[0];

        const deletedLike = await Like.findByIdAndDelete(likeToToggle._id)

        if(!deletedLike){
            throw new ApiError(400, "Could not undo the like operation due some reason please try again")
        }

        return res.status(200).json(new ApiResponse(200, {}, "like operation undone successfully"))

    }
    else{ // else create the like record on that comment
        // add the like entry
        const addedLike = await Like.create({
            comment: new mongoose.Types.ObjectId(commentId),
            likedBy: req.user?._id
        })

        if(!addedLike){
            throw new ApiError(400, "Could not like the comment due some reason please try again")
        }

        console.log("like added", addedLike);

        return res.status(201).json(new ApiResponse(201, addedLike, "Liked comment successfully"))
    }

    
})

const toggleTweetLike = asyncHandler(async(req, res)=>{
    const {tweetId} = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "TwwetId is required")
    }

    const likeEntryExist = await Like.aggregate([
        {
            $match:{
                $and:[
                    {tweet: new mongoose.Types.ObjectId(tweetId)},
                    {likedBy: req.user?._id}
                ]
            }
        }
    ])

    if(likeEntryExist.length > 0){// toggle the like
        // remove the entry
        console.log("liked comment details", likeEntryExist[0])
        const likeToToggle = likeEntryExist[0];

        const deletedLike = await Like.findByIdAndDelete(likeToToggle._id)

        if(!deletedLike){
            throw new ApiError(400, "Could not undo the like operation due some reason please try again")
        }

        return res.status(200).json(new ApiResponse(200, {}, "like operation undone successfully"))

    }
    else{ // else create the like record on that tweet
        // add the like entry
        const addedLike = await Like.create({
            tweet: new mongoose.Types.ObjectId(tweetId),
            likedBy: req.user?._id
        })

        if(!addedLike){
            throw new ApiError(400, "Could not like the tweet due some reason please try again")
        }

        console.log("like added", addedLike);

        return res.status(201).json(new ApiResponse(201, addedLike, "Liked tweet successfully"))
    }

})

const getLikedVideos = asyncHandler(async(req, res)=>{

})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike
}