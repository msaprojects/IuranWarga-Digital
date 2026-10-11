import type { ErrorRequestHandler, Response } from "express";
import { ZodError } from "zod";

type SuccessResponse<TData> = {
    status: "success";
    message: string;
    data: TData;
};

type ErrorResponse = {
    status: "failed";
    message: string;
    errors?: unknown;
};

class ResponseHandler {
    success<TData>(res: Response, statusCode: number, message: string, data: TData): void {
        res.status(statusCode).json({
            status: "success",
            message,
            data,
        } satisfies SuccessResponse<TData>);
    }

    error(res: Response, statusCode: number, message: string, errors?: unknown): void {
        const body: ErrorResponse = { status: "failed", message };
        if (errors !== undefined) {
            body.errors = errors;
        }
        res.status(statusCode).json(body);
    }
}

export const resHandler = new ResponseHandler();

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
        resHandler.error(
            res,
            400,
            "Validation Error",
            error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        );
        return;
    }

    console.error("Unhandled request error:", error);
    resHandler.error(res, 500, "Internal Server Error");
};
