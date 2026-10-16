const commonSchemas = {
    Error: {
        type: "object",
        required: ["status", "message"],
        properties: {
            status: { type: "string", const: "failed" },
            message: { type: "string" },
            errors: {},
        },
    },
    ValidationError: {
        type: "object",
        required: ["status", "message", "errors"],
        properties: {
            status: { type: "string", const: "failed" },
            message: { type: "string", const: "Validation Error" },
            errors: {
                type: "array",
                items: {
                    type: "object",
                    required: ["field", "message"],
                    properties: {
                        field: { type: "string" },
                        message: { type: "string" },
                    },
                },
            },
        },
    },
} as const;

export default commonSchemas;
