import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile:{
        public_id:{
            type: String, //cloudinary public_id of file
            required: true,
        },
        url:{
            type: String, //cloudinary url
            required: true,
        }
    },
    thumbnail:{
        public_id:{
            type: String, //cloudinary public_id of file
            required: true,
        },
        url:{
            type: String, //cloudinary url
            required: true,
        }
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    duration:{
        type: Number, // cloudinary
        required: true,
    },
    view:{
        type: Number,
        default: 0
    },
    isPublished: {
        type : Boolean,
        default: true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, {timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate);

videoSchema.pre('findOneAndDelete', async(next)=>{
    await mongoose.model('Comment').deleteMany({video: this._id})
    next()
})

export const Video = mongoose.model("Video", videoSchema);