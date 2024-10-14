import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log("File uploaded successfully ", response)
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved file as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async (cloudinaryImagePublicId)=>{
    try {
        if(!cloudinaryImagePublicId) return null;

        const response = await cloudinary.uploader.destroy(cloudinaryImagePublicId, {
            resource_type: "image"
        })
        return response;
    } catch (error) {
        console.log("Error while destroying the older Image from cloudinary", error)
        return null;
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}