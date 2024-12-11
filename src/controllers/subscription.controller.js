import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from '../models/subscription.model.js'
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.query
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "channelId is required");
    }

    // check if user is subscribed already
    // if subscribed unsubscribe 
    // else subscribe

    const subscriptionEntry = await Subscription.aggregate([
        {
            $match: {
                $and:[
                    { subscriber: req.user?._id },
                    { channel : new mongoose.Types.ObjectId(channelId) }
                ]
            }
        }
    ])

    console.log("subscriptionEntry>>", subscriptionEntry);
    

    if(subscriptionEntry.length === 0){
        // create subscribe entry
        const newSubscription = await Subscription.create({
            subscriber: req.user?._id,
            channel: new mongoose.Types.ObjectId(channelId)
        })

        if(!newSubscription){
            throw new ApiError(400, "could not subscribe due some reason.Please try again")
        }

        return res.status(201).json(new ApiResponse(201, newSubscription, "Subscription successfull"))
    }
    else{
        // remove subscribe entry
        const deletedEntry = await Subscription.findByIdAndDelete(subscriptionEntry[0]._id);

        if(!deletedEntry){
            throw new ApiError(400, "could not unsubscribe due some reason.Please try again")
        }

        return res.status(200).json(new ApiResponse(200, deletedEntry, "unsubscribed successfully"))
    }
})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}