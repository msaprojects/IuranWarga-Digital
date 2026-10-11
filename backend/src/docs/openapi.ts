import apiInfo from "./openapi/info.ts";
import organisasiPaths from "./openapi/organisasi.ts";
import schemas from "./openapi/schemas.ts";

const openApiSpec = {
  ...apiInfo,
  paths: organisasiPaths,
  components: { schemas },
} as const;

export default openApiSpec;
