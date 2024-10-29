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

// user routes declaration
app.use('/api/v1/user', userRouter);
// video routes declaration
app.use('/api/v1/video/', videoRouter);

export {app};