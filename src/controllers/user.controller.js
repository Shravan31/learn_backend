import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError } from "../utils/ApiError.js" 
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from '../utils/ApiResponse.js'

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

export {registerUser}