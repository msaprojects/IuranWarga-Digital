import apiInfo from "./openapi/info.ts";
import organisasiPaths from "./openapi/organisasi.ts";
import organisasiSchemas from "./openapi/schemas/organisasi.ts";
import userSchemas from "./openapi/schemas/user.ts";
import pesertaPaths from "./openapi/peserta.ts";
import pesertaSchemas from "./openapi/schemas/peserta.ts";
import userPaths from "./openapi/user.ts";
import commonSchemas from "./openapi/schemas/common.ts";

const openApiSpec = {
    ...apiInfo,
    paths: { ...organisasiPaths, ...userPaths, ...pesertaPaths },
    components: {
        schemas: {
            ...commonSchemas,
            ...organisasiSchemas,
            ...userSchemas,
            ...pesertaSchemas,
        },
    },
} as const;

export default openApiSpec;
