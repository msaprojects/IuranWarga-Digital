import apiInfo from "./openapi/info.ts"
import organisasiPaths from "./openapi/organisasi.ts"
import organisasiSchemas from "./openapi/schemas/organisasi.ts"
import userSchemas from "./openapi/schemas/user.ts"
import pesertaPaths from "./openapi/peserta.ts"
import pesertaSchemas from "./openapi/schemas/peserta.ts"
import userPaths from "./openapi/user.ts"
import commonSchemas from "./openapi/schemas/common.ts"
import detailPesertaPaths from "./openapi/detail_peserta.ts"
import detailPesertaSchemas from "./openapi/schemas/detail_peserta.ts"
import jenisIuranPaths from "./openapi/jenis_iuran.ts"
import jenisIuranSchemas from "./openapi/schemas/jenis_iuran.ts"
import tagihanIuranPaths from "./openapi/tagihan_iuran.ts"
import tagihanIuranSchemas from "./openapi/schemas/tagihan_iuran.ts"
import subOrganisasiPaths from "./openapi/sub_organisasi.ts"
import subOrganisasiSchemas from "./openapi/schemas/sub_organisasi.ts"
import anggotaSubOrganisasiPaths from "./openapi/anggota_sub_organisasi.ts"
import anggotaSubOrganisasiSchemas from "./openapi/schemas/anggota_sub_organisasi.ts"
import pengurusSubOrganisasiPaths from "./openapi/pengurus_sub_organisasi.ts"
import pengurusSubOrganisasiSchemas from "./openapi/schemas/pengurus_sub_organisasi.ts"
import komponenSubOrganisasiPaths from "./openapi/komponen_sub_organisasi.ts"
import komponenSubOrganisasiSchemas from "./openapi/schemas/komponen_sub_organisasi.ts"
import pembayaranIuranPaths from "./openapi/pembayaran_iuran.ts"
import pembayaranIuranSchemas from "./openapi/schemas/pembayaran_iuran.ts"
import keuanganPaths from "./openapi/keuangan.ts"
import keuanganSchemas from "./openapi/schemas/keuangan.ts"
import transactionLedgerPaths from "./openapi/transaction_ledger.ts"
import transactionLedgerSchemas from "./openapi/schemas/transaction_ledger.ts"

const BEARER_SECURITY = [{ BearerAuth: [] }]
const PUBLIC_SECURITY: Record<string, never>[] = []

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options"])

type OpenApiOperation = {
    description?: string
    security?: unknown
    [key: string]: unknown
}
type OpenApiPathItem = Record<string, unknown>
type OpenApiPaths = Record<string, OpenApiPathItem>

// Endpoint yang TIDAK berada di belakang `authenticateJWT` men-set `security: []`.
// Selain itu (dikosongkan atau berisi BearerAuth) dianggap butuh autentikasi.
function isPublicOperation(operation: OpenApiOperation): boolean {
    return Array.isArray(operation.security) && operation.security.length === 0
}

function annotateOperation(operation: OpenApiOperation): OpenApiOperation {
    const isPublic = isPublicOperation(operation)
    const marker = isPublic
        ? "**PUBLIK** - endpoint ini dapat dipanggil tanpa token autentikasi."
        : "**WAJIB AUTENTIKASI** - kirim header `Authorization: Bearer <token>` (JWT)."
    const existing = operation.description ? `${operation.description}` : ""
    return {
        ...operation,
        // Tandai secara eksplisit per-operasi agar Swagger UI menampilkan gembok yang sesuai.
        security: isPublic ? PUBLIC_SECURITY : BEARER_SECURITY,
        description: existing ? `${marker}\n\n${existing}` : marker,
    }
}

function annotatePaths(paths: OpenApiPaths): OpenApiPaths {
    const result: OpenApiPaths = {}
    for (const [path, pathItem] of Object.entries(paths)) {
        const annotatedItem: OpenApiPathItem = {}
        for (const [key, value] of Object.entries(pathItem)) {
            annotatedItem[key] = HTTP_METHODS.has(key.toLowerCase())
                ? annotateOperation(value as OpenApiOperation)
                : value
        }
        result[path] = annotatedItem
    }
    return result
}

const rawPaths = {
    ...organisasiPaths,
    ...userPaths,
    ...pesertaPaths,
    ...detailPesertaPaths,
    ...jenisIuranPaths,
    ...tagihanIuranPaths,
    ...subOrganisasiPaths,
    ...anggotaSubOrganisasiPaths,
    ...pengurusSubOrganisasiPaths,
    ...komponenSubOrganisasiPaths,
    ...pembayaranIuranPaths,
    ...keuanganPaths,
    ...transactionLedgerPaths,
} as unknown as OpenApiPaths

const openApiSpec = {
    ...apiInfo,
    paths: annotatePaths(rawPaths),
    security: BEARER_SECURITY,
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description:
                    "Kirim access token hasil login sebagai `Authorization: Bearer <token>`.",
            },
        },
        responses: {
            Unauthorized: {
                description: "Bearer token tidak ada, kedaluwarsa, atau tidak valid.",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/AuthenticationError" },
                        examples: {
                            missing: { value: { message: "Unauthorized" } },
                            expired: { value: { message: "Token expired" } },
                            invalid: { value: { message: "Invalid token" } },
                        },
                    },
                },
            },
        },
        schemas: {
            ...commonSchemas,
            ...organisasiSchemas,
            ...userSchemas,
            ...pesertaSchemas,
            ...detailPesertaSchemas,
            ...jenisIuranSchemas,
            ...tagihanIuranSchemas,
            ...subOrganisasiSchemas,
            ...anggotaSubOrganisasiSchemas,
            ...pengurusSubOrganisasiSchemas,
            ...komponenSubOrganisasiSchemas,
            ...pembayaranIuranSchemas,
            ...keuanganSchemas,
            ...transactionLedgerSchemas,
        },
    },
}

export default openApiSpec
