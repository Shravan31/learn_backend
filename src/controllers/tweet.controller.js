import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import { isValidObjectId } from "mongoose";


const createTweet = asyncHandler(async(req, res)=>{
    const {content} = req.body;

    if(content.trim()===""){
        throw new ApiError(400, "content can't be empty")
    }

    const createdTweet = await Tweet.create({
        content: content,
        owner: req.user?._id
    })

    if(!createdTweet){
        throw new ApiError(400, "couldn't create tweet please try again")
    }

    return res.status(201).json(new ApiResponse(201, createdTweet, "tweet created successfully"))

})

const getUserTweets = asyncHandler(async(req, res)=>{
    const {userId} = req.query
    if(!isValidObjectId(userId)){
        throw new ApiError(404, "User not found");
    }
    const userTweets = await Tweet.find({owner: userId}).populate("owner", "username avatar coverImage")
    
    return res.status(200).json(new ApiResponse(200, userTweets, "Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async(req, res)=>{
    const {tweetId} = req.query
    const {content} = req.body
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid TweetId")
    }
    if(content.trim()===""){
        throw new ApiError(400, "content can't be empty")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: {
            content: content
        }
    },
    {new: true}).populate('owner', 'username avatar coverImage')

    if(!updatedTweet){
        throw new ApiError(400, "Unable to update the tweet Please try again")
    }

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async(req, res)=>{
    const {tweetId} = req.query
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid TweetId")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet){
        throw new ApiError(400, 'unable to delete your tweet. Please try again')
    }

    return res.status(200).json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}