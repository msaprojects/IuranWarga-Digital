import express from "express";
import cors from "cors";
import { router } from "./routes/routers.ts";
import { errorHandler, resHandler } from "./utils/response_handler.ts";
import swaggerUi from "swagger-ui-express";
import redoc from "redoc-express";
import openApiSpec from "./docs/openapi.ts";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api-docs.json", (_req, res) => {
    res.json(openApiSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get(
    "/redoc",
    redoc({
        title: "Iuran Warga API Documentation",
        specUrl: "/api-docs.json",
    }),
);

app.use("/api", router);

app.use((_req, res) => {
    resHandler.error(res, 404, "Route not found");
});

app.use(errorHandler);

export default app;
