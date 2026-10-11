import express from 'express'
import cors from 'cors'
import {router} from './routes/routers.ts'
import { errorHandler, resHandler } from './utils/response_handler.ts'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', router)

app.use((_req, res) => {
  resHandler.error(res, 404, 'Route not found')
})

app.use(errorHandler)

export default app