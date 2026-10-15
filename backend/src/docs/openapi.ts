import apiInfo from "./openapi/info.ts";
import organisasiPaths from "./openapi/organisasi.ts";
import organisasiSchemas from "./openapi/schemas/organisasi.ts";
import userSchemas from "./openapi/schemas/user.ts";

const openApiSpec = {
    ...apiInfo,
    paths: organisasiPaths,
    components: { schemas: { ...organisasiSchemas, ...userSchemas } },
} as const;

export default openApiSpec;
