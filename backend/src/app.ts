import express from "express"
import cors from "cors"
import { router } from "./routes/routers.ts"
import { errorHandler, resHandler } from "./utils/response_handler.ts"
import { requestId } from "./middlewares/request_id.ts"
import swaggerUi from "swagger-ui-express"
import redoc from "redoc-express"
import openApiSpec from "./docs/openapi.ts"
import helmet from "helmet"
import morgan from "morgan"

const app = express()

// 1. Request-ID → WAJIB paling awal, agar setiap log & error bisa dikorelasikan.
app.use(requestId)

// 2. Access log setelah requestId supaya `X-Request-Id` response ikut tercetak.
//
// Catatan API: morgan hanya menerima format sebagai ARGUMEN PERTAMA (nama preset,
// token-string, atau FormatFn). `Options`-nya hanya berisi `{stream, skip, immediate}`
// — tidak ada field `format` di dalam options. Menulis `morgan("dev", {format: ...})`
// gagal TS2769 karena objek dengan properti tak dikenal mencocokkan overload
// `morgan(fmt: FormatFn, …)`.
app.use(
    morgan(
        // Token header memakai kurung SIKU: `:res[nama-header]`. Kurung bulat
        // (`:res(...)`) membuat morgan mengirim `undefined` ke `res.getHeader()`
        // → TypeError "name argument must be of type string".
        ":method :url :status :response-time ms - :res[content-length] [:res[X-Request-Id]]",
    ),
)

// 3. Security headers & body parser.
app.use(helmet())
app.use(cors())
// Batasi ukuran body: default 100kb express.json sudah cukup, tapi buat eksplisit
// + handal agar `entity.too.large` memicu branch 413 di errorHandler.
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

// CSP khusus halaman dokumentasi.
//
// `helmet()` di atas memasang `script-src 'self'`. Halaman ReDoc dari
// `redoc-express` melanggar aturan itu dua kali: bundle-nya dimuat dari
// `https://unpkg.com`, lalu bootstrap `Redoc.init(...)` ditulis sebagai
// `<script>` inline tanpa nonce (opsi `nonce` redoc-express hanya menempel ke
// tag eksternal). Catatan CSP: begitu sebuah direktif memuat nonce/hash,
// `'unsafe-inline'` diabaikan browser — jadi jangan dicampur.
//
// Pelonggaran ini sengaja dibatasi pada rute dokumentasi; seluruh `/api` tetap
// memakai CSP ketat bawaan helmet.
const docsCsp = helmet({
    contentSecurityPolicy: {
        directives: {
            "script-src": ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        },
    },
})

app.get("/api-docs.json", (_req, res) => {
    res.json(openApiSpec)
})
app.use("/api-docs", docsCsp, swaggerUi.serve, swaggerUi.setup(openApiSpec))
app.get(
    "/redoc",
    docsCsp,
    redoc({
        title: "Iuran Warga API Documentation",
        specUrl: "/api-docs.json",
    }),
)

app.use("/api", router)

app.use((_req, res) => {
    resHandler.error(res, 404, "Route not found")
})

// errorHandler HARUS paling akhir agar menangkap semua next(err).
app.use(errorHandler)

export default app
