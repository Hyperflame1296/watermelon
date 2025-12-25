// import: local interfaces
import { FragmentShader } from '../../types/shader/FragmentShader.js';
import { VertexShader } from '../../types/shader/VertexShader.js';

// declaration
export interface ShaderCache { 
    vertex: Record<string, VertexShader>, 
    fragment: Record<string, FragmentShader>
}