import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError } from "../utils/ApiError.js" 
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
    
        await user.save({validateBeforeSave: false});
    
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong while generating access and refresh tokens")
    }
    
}

const registerUser = asyncHandler(async (req, res)=>{
    // get data form the frontend
    // data validation --> not empty data
    // check user already registered
    // images uploaded --> avatar is mandetory
    // upload the images on cloudinary --> avatar(must)
    // create user
    // check for user creation in db
    // send response without password and refreshToken

    const {username, email, password, fullName} = req.body;
    // console.log("user req body", req.body);
    
    
    const isInvalidData = [username, email, password, fullName].some(field => field?.trim() === "")

    if(isInvalidData){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or:[{email}, {username}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocatPath = req.files?.avatar[0]?.path;
    // const coverImageLocatPath = req.files?.coverImage[0]?.path;
    console.log("req.files", req.files);
    

    let coverImageLocatPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocatPath = req.files.coverImage[0].path;
    }

    if(!avatarLocatPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocatPath);
    const coverImage = await uploadOnCloudinary(coverImageLocatPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        fullName,
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while creating user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User Registered Successfully")
    )
})

const loginUser = asyncHandler(async(req, res)=>{
    // get data from user
    // validate the data
    // find the user
    // check password
    // access and refreshToken generation
    // send cookie

    const {username, email, password} = req.body;

    if(!(username && email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or:[{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "user does not exist")
    }

    const isValidUser = await user.isPasswordCorrect(password);

    if(!isValidUser){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully"),
    )
})


const logoutUser = asyncHandler(async (req, res)=>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )
}) 

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unautherized request");
    }

    try {
        const decodedRefreshToken = jwt.decode(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedRefreshToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token");
        }
    
        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Invalid or Expired Refresh Token");
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {accessToken, refreshToken}, "Access Token Refreshed")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Incorrect password")
    }

    user.password = newPassword;

    await user.save({validateBeforeSave: false});

    return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password changed Successfully"))

})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res.status(200).json(new ApiResponse(200, req.user, "Success"))
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body;
    if(!fullName || !email){
        throw new ApiError(400, "fullName and email are required")
    }

    const user = await User.findByIdAndUpdate(req.user._id, 
        {
            $set:{
                fullName, email
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    return res.status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateAvatarImage = asyncHandler(async(req, res)=>{
    
    const avatarLocatPath = req.file?.path;

    if(!avatarLocatPath){
        throw new ApiError(400, "Avatar image is missing");
    }

    // delete the older immage from cloudinary after user successfully uploads new image
    const avatarToDeleteFromCloudinary = await User.findById(req.user._id).select("avatar");
    const avatarFileName = avatarToDeleteFromCloudinary.avatar.substring(avatarToDeleteFromCloudinary.avatar.lastIndexOf('/')+1)
    const avatarToDelete = avatarFileName.substring(0, avatarFileName.lastIndexOf('.'));
    // console.log("avatarFileName", avatarFileName, avatarToDelete);

    const avatar = await uploadOnCloudinary(avatarLocatPath)

    if(!avatar?.url){
        throw new ApiError(400, "Something went wrong while uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password");

    const deletedAvatarResponse = await deleteFromCloudinary(avatarToDelete);

    console.log("old avatar deleted ", deletedAvatarResponse)

    res.status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"))
})

const updateCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocatPath = req.file?.path;

    if(!coverImageLocatPath){
        throw new ApiError(400, "cover image is missing");
    }
    // TODO : delete the older immage from cloudinary after user successfully uploads new image
    const coverImageToDeleteFromCloudinary = await User.findById(req.user._id).select("coverImage");

    const coverImage = await uploadOnCloudinary(coverImageLocatPath)

    if(!(coverImage?.url)){
        throw new ApiError(400, "Something went wrong while uploading the cover image")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {
            new : true
        }
    ).select("-password");

    if(coverImageToDeleteFromCloudinary){
        const coverImageFileName = coverImageToDeleteFromCloudinary.coverImage.substring(coverImageToDeleteFromCloudinary.coverImage.lastIndexOf('/')+1)
        const coverImageToDelete = coverImageFileName.substring(0, coverImageFileName.lastIndexOf('.'));
        const deletedCoverImageResponse = await deleteFromCloudinary(coverImageToDelete);
        // console.log("old cover Image deleted ", deletedCoverImageResponse)
    }

    res.status(200)
    .json(new ApiResponse(200, user, "cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req, res)=>{
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "channel does not exist with provided username");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond:{
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(400, "Channel does not exists");
    }
    console.log("channel", channel);
    
    return new ApiResponse(200, channel[0], "Channel details fetched successfully")
})

export {
    registerUser, 
    loginUser, 
    logoutUser, 
    updateAvatarImage, 
    updateCoverImage,
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    getUserChannelProfile
}