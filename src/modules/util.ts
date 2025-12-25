// code
export const util = {
    math: {
        blend: {
            lerp: (a: number, b: number, t: number) => a + (b - a) * t
        },
        max: (arr: Set<number> | number[]) => {
            let max = -Infinity
            for (let v of arr) {
                if (v > max) max = v
            }
            return max
        },
        min: (arr: Set<number> | number[]) => {
            let min = Infinity
            for (let v of arr) {
                if (v < min) min = v
            }
            return min
        }
    }
}