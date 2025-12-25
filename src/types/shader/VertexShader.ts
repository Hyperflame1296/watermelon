// import: local interfaces
import { VertexShaderInput } from '../../interfaces/shader/vertex/VertexShaderInput.js';
import { VertexShaderOutput } from '../../interfaces/shader/vertex/VertexShaderOutput.js';

// declaration
export type VertexShader =
    (input: VertexShaderInput) => VertexShaderOutput