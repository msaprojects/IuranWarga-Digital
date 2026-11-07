import type { Express } from "express"

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

type TestResponse = {
    status: number
    body: any
    text: string
    headers: Record<string, string>
}

class TestRequest implements PromiseLike<TestResponse> {
    private readonly headers = new Headers()
    private body?: string

    constructor(
        private readonly app: Express,
        private readonly method: HttpMethod,
        private readonly path: string,
    ) {}

    set(name: string, value: string) {
        this.headers.set(name, value)
        return this
    }

    send(body: unknown) {
        this.body = JSON.stringify(body)
        if (!this.headers.has("content-type")) {
            this.headers.set("content-type", "application/json")
        }
        return this
    }

    then<TResult1 = TestResponse, TResult2 = never>(
        onfulfilled?: ((value: TestResponse) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
        return this.execute().then(onfulfilled, onrejected)
    }

    private async execute(): Promise<TestResponse> {
        const server = this.app.listen(0, "127.0.0.1")
        await new Promise<void>((resolve, reject) => {
            server.once("listening", resolve)
            server.once("error", reject)
        })

        try {
            const address = server.address()
            if (!address || typeof address === "string") {
                throw new Error("Unable to determine the test server address.")
            }

            const response = await fetch(`http://127.0.0.1:${address.port}${this.path}`, {
                method: this.method,
                headers: this.headers,
                body: this.body,
            })
            const text = await response.text()
            const isJson = response.headers.get("content-type")?.includes("application/json")
            const headers: Record<string, string> = {}
            response.headers.forEach((value, name) => {
                headers[name] = value
            })

            return {
                status: response.status,
                body: isJson && text ? JSON.parse(text) : undefined,
                text,
                headers,
            }
        } finally {
            await new Promise<void>((resolve, reject) => {
                server.close((error) => (error ? reject(error) : resolve()))
            })
        }
    }
}

export const request = (app: Express) => ({
    get: (path: string) => new TestRequest(app, "GET", path),
    post: (path: string) => new TestRequest(app, "POST", path),
    patch: (path: string) => new TestRequest(app, "PATCH", path),
    put: (path: string) => new TestRequest(app, "PUT", path),
    delete: (path: string) => new TestRequest(app, "DELETE", path),
})
