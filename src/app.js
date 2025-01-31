import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true, limit:'16kb'}))
app.use(express.static("public"))

// import Routes
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import healthcheckRouter from './routes/healthcheck.routes.js'
import { ApiError } from './utils/ApiError.js';

// user routes declaration
app.use('/api/v1/user', userRouter);
// video routes declaration
app.use('/api/v1/video', videoRouter);
// comment routes declaration
app.use('/api/v1/comment', commentRouter);
// like routes declaration
app.use('/api/v1/like', likeRouter);
// playlist routes declaration
app.use('/api/v1/playlist', playlistRouter);
// subscription routes declaration
app.use('/api/v1/subscription', subscriptionRouter);
// tweet routes declaration
app.use('/api/v1/tweet', tweetRouter);
// dashboard routes declaration
app.use('/api/v1/dashboard', dashboardRouter);
// healthcheck routes declaration
app.use('/api/v1/healthcheck', healthcheckRouter);


app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
        });
    }

    // Log the error and send a generic response for unexpected errors
    console.error(err);  // Log error to console
    return res.status(500).json({
        success: false,
        message: 'Something went wrong on the server',
    });
});

export {app};
