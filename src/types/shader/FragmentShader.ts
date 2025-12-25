// import: local interfaces
import { FragmentShaderInput } from '../../interfaces/shader/fragment/FragmentShaderInput.js';
import { FragmentShaderOutput } from '../../interfaces/shader/fragment/FragmentShaderOutput.js';

// declaration
export type FragmentShader =
    (input: FragmentShaderInput) => FragmentShaderOutput