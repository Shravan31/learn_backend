import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = '', sortBy = 'createdAt', sortType = 1, userId = '' } = req.query;
    console.log(">>>query ", query, sortBy, sortType, userId);

    let videoAggregate;

    try {
        // Build the aggregation pipeline
        videoAggregate = [
            {
                $match: {
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $first: '$owner' }
                }
            },
            {
                $sort: {
                    [sortBy]: parseInt(sortType)  // Sorting based on user input
                }
            }
        ];

        // Now use aggregatePaginate to apply pagination automatically
        const options = {
            page: parseInt(page),  // Current page number
            limit: parseInt(limit),  // Items per page
            customLabels: {
                totalDocs: 'totalVideos',
                docs: 'videos'
            }
        };

        Video.aggregatePaginate(videoAggregate, options)
            .then(result => {
                console.log("Paginated result:", result);
                if (result?.videos?.length === 0) {
                    return res.status(200).json(new ApiResponse(200, [], "No videos found"));
                }

                return res.status(200).json(
                    new ApiResponse(200, result, "Videos fetched successfully")
                );
            })
            .catch(error => {
                console.error("Error in pagination:", error);
                throw new ApiError(500, error?.message || "Internal server error in video aggregatePaginate");
            });

    } catch (error) {
        console.log("Error in aggregation");
        throw new ApiError(500, error.message || "Internal server error in video aggregation");
    }


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    const isInvalidVideoData = [title, description].some(field => field.trim() === "");

    if(isInvalidVideoData){
        throw new ApiError(400, "Title and Description fields are required.");
    }

    const videoLocalFile = req.files?.video?.[0]?.path;
    const thumbnailLocalFile = req.files?.thumbnail?.[0]?.path;

    if(!(videoLocalFile && thumbnailLocalFile)){
        throw new ApiError(400, "Video and thumbnail files are required");
    }

    const video = await uploadOnCloudinary(videoLocalFile);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalFile);

    if(!video){
        throw new ApiError(400, "Video file is required");
    }
    if(!thumbnail){
        throw new ApiError(400, "Thumbnail file is required");
    }

    // create video
    const videoPublished = await Video.create({
        title,
        description,
        videoFile:{
            public_id: video.public_id,
            url: video.url
        },
        thumbnail:{
            public_id: thumbnail.public_id,
            url: thumbnail.url
        },
        duration: video.duration,
        owner: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, videoPublished, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    // console.log("Inside the getVideoById fn");
    
    const { videoId } = req.params
    // console.log(videoId)
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is invalid")
    }
    
    //TODO: get video by id
    if(!videoId?.trim()){
        throw new ApiError(400, "Please select video")
    }

    const video = await Video.findById(videoId)

    if(!video){
        return res.status(404).json(new ApiError(404, "Video not found with given id"))
    }

    return res.status(200).json(new ApiResponse(200, video, "Video found."))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required")
    }
    const {title, description } = req.body;

    const isInvalid = [title, description].some(field => field?.trim()==="");

    if(isInvalid){
        throw new ApiError(400, "title and description required")
    }

    const videoToUpdate = await Video.findById(videoId)

    console.log(">>>videoToUpdate", videoToUpdate);
    

    const thumbnailLocalFile = req.file?.path;

    if(!thumbnailLocalFile){
        throw new ApiError(400, "thumbnail file is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalFile);

    if(!thumbnail){
        throw new ApiError(400, "something went wrong while uploading the thumbnail file")
    }

    const deletionProcess = await deleteFromCloudinary(videoToUpdate?.thumbnail.public_id)
    console.log("Deleted Thumbnail", deletionProcess)

    const video = await Video.findByIdAndUpdate(videoId, {
        $set:{
            title: title,
            description: description,
            thumbnail: {
                public_id: thumbnail.public_id,
                url: thumbnail.url
            }
        }
    },
    {new: true})

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required")
    }

    const videoToDelete = await Video.findById(videoId)

    // console.log(">>>videoToDelete", videoToDelete);

    if(!videoToDelete){
        throw new ApiError(404, "Video not found");
    }

    const videoDeleteFile = await deleteFromCloudinary(videoToDelete?.videoFile.public_id);
    const thumbnailDeleteFile = await deleteFromCloudinary(videoToDelete?.thumbnail?.public_id);

    if(!videoDeleteFile){
        throw new ApiError(400, "Something went wrong while deleting video from data source");
    }
    if(!thumbnailDeleteFile){
        throw new ApiError(400, "Something went wrong while deleting thumbnail from data source");
    }

    const deleteVideoResult = await Video.findByIdAndDelete(videoId)

    if(!deleteVideoResult){
        throw new ApiError(400, "Something went wrong while deleting video from db")
    }

    return res.status(200)
    .json(new ApiResponse(200, deleteVideoResult, "Video deleted Successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is required")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;

    const savedVideo = await video.save({validateBeforeSave: false});

    // console.log("saved video", savedVideo);

    return res.status(200).json(new ApiResponse(200, video, "isPublished toggled successfully"))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}