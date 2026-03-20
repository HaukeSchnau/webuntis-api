import type { Schema } from "effect";

export const RequestPolicy = {
  Metadata: "metadata",
  AuthOnly: "auth-only",
} as const;

export type RequestPolicy = (typeof RequestPolicy)[keyof typeof RequestPolicy];

export type QueryParams = Readonly<
  Record<string, string | number | boolean | undefined>
>;
export type HeaderParams = Readonly<Record<string, string | undefined>>;

export interface RequestDescriptor<Input> {
  readonly method: "GET" | "POST" | "PUT";
  readonly path: string | ((input: Input) => string);
  readonly policy: RequestPolicy;
  readonly query?: ((input: Input) => QueryParams) | undefined;
  readonly headers?: ((input: Input) => HeaderParams) | undefined;
  readonly body?: ((input: Input) => unknown) | undefined;
}

export interface SchemaRequestDescriptor<Input, S extends Schema.Top>
  extends RequestDescriptor<Input> {
  readonly schema: S;
}

export const request = <Input>(
  descriptor: RequestDescriptor<Input>,
): RequestDescriptor<Input> => descriptor;

export const schemaRequest = <Input, S extends Schema.Top>(
  descriptor: SchemaRequestDescriptor<Input, S>,
): SchemaRequestDescriptor<Input, S> => descriptor;

export const pathFor = <Input>(
  descriptor: RequestDescriptor<Input>,
  input: Input,
): string =>
  typeof descriptor.path === "function"
    ? descriptor.path(input)
    : descriptor.path;
