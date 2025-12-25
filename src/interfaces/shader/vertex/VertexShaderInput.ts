// import: local types
import { Vector2 } from '../../../types/math/Vector2.js'
import { Vector3 } from '../../../types/math/Vector3.js'
import { Vector4 } from '../../../types/math/Vector4.js'

// declaration
export interface VertexShaderInput {
    position: Vector2 | Vector3 | Vector4
}