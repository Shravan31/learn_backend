import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import {Comment} from '../models/comment.model.js'
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res)=>{
    const {page = 1, limit=10} = req.query;
    const {videoId} = req.params

    console.log("page, limit, videoId", page, limit, videoId);

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required")
    }

    try {
        const comments = await Comment.aggregate([
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                },
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as: "owner",
                    pipeline:[
                        {
                            $project:{
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                }
            },
            {
                $project:{
                    content:1,
                    owner: 1,
                }
            }
        ])
        console.log("Comments", comments);
        // TODO : add pipeline for comments
        return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"))
        
    } catch (error) {
        throw new ApiError(400, "Something went wrong")
    }
})

const addComment = asyncHandler(async (req, res)=>{
    const { content } = req.body;
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required")
    }
    if(!content){
        throw new ApiError(400, "comment message is required")
    }

    const user_id = req.user._id;

    if(!user_id){
        throw new ApiError(400, "Authentication is required to make any comment")
    }

    const comment = await Comment.create({
        content,
        video: new mongoose.Types.ObjectId(videoId),
        owner: user_id
    })

    if(!comment){
        throw new ApiError(400, "something went wrong while making a comment. Please try again.")
    }

    res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"))

})

const updateComment = asyncHandler(async(req, res)=>{
    const {commentId} = req.params;
    const {newComment} = req.body;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Comment Id is required")
    }
    if(!newComment || newComment.trim()===""){
        throw new ApiError(400, "Comment is empty")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
        $set:{
            content: newComment
        },
    }, {new: true}).select("_id content video owner")

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async(req, res)=>{
    const {commentId} = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Comment Id is required")
    }
    
    const user_id = req.user?._id;

    const commentToDelete = await Comment.aggregate([
        {
            $match:{
                $and: [
                    {_id: new mongoose.Types.ObjectId(commentId)},
                    {owner: user_id}
                ]
            }
        }
    ]);
    // console.log("commentToDelete", commentToDelete)
    if(commentToDelete?.length===0){
        throw new ApiError(400, "You are not authourized to delete this comment")
    }
    
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    console.log("deleted Comment", deletedComment);

    return res.status(200).json(new ApiResponse(200, {}, "Comment Deleted Successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}