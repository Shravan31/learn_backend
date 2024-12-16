import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";


const getChannelStats = asyncHandler(async(req, res)=>{

    const channelData = await Video.aggregate([
        {
            $match: { owner: req.user?._id }
        },
        // lookup for subscribers of the channel
        {
            $lookup:{
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // lookup for channels to which owner subscribed
        {
            $lookup: {
                from : "subscriptions",
                localField: "owner",
                foreignField: "subscriber",
                as : "subscribedTo"
            }
        },
        // lookup for likes for users videos
        {
            $lookup:{
                from : "likes",
                localField: "_id",
                foreignField: "video",
                as : "videoLikes"
            }
        },
        // lookup for comments on videos
        {
            $lookup:{
                from : "comments",
                localField: "_id",
                foreignField: "video",
                as: "videoComments"
            }
        },
        // lookup for tweets by the user
        {
            $lookup:{
                from: "tweets",
                foreignField: "owner",
                localField: "owner",
                as : "userTweets"
            }
        },
        // group to calculate stats
        {
            $group:{
                _id: null,
                totalVideos: {
                    $sum: 1
                },
                totalViews: {
                    $sum: '$view'
                },
                subscribers: {
                    $first: '$subscribers'
                },
                subscribedTo:{
                    $first: '$subscribedTo'
                },
                totalLikes: {
                    $sum: "$videoLikes"
                },
                totalComments: {
                    $sum: "$videoComments"
                },
                totalTweets: {
                    $sum: "$userTweets"
                }
            }
        },
        {
            $project:{
                totalVideos: 1,
                totalViews: 1,
                subscribers: 1,
                subscribedTo: 1,
                totalLikes: 1,
                totalComments: 1,
                totalTweets: 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, channelData, "channel stats fetched successfully"))

})

const getChannelVideos = asyncHandler(async(req, res)=>{
    const channelVideos = await Video.find({
        owner: req.user?._id
    })

    if(channelVideos.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "No videos present"))
    }
    else{
        return res.status(200).json(new ApiResponse(200, channelVideos, "channel videos fetched successfully"))
    }
})

export {
    getChannelStats,
    getChannelVideos
}