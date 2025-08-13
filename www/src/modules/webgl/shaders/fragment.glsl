precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_gridSize;
uniform float u_gridWidth;
uniform bool u_showGrid;

varying vec2 v_texCoord;

void main() {
    float v = 1.0 - texture2D(u_texture, v_texCoord).r;
    vec3 cellColor = vec3(v, v, v);

    if (u_showGrid) {
        // Calculate grid lines
        vec2 pixelCoord = v_texCoord * u_resolution;
        vec2 gridCoord = mod(pixelCoord, u_gridSize);

        // Create grid lines
        float gridLine = 0.0;
        if (gridCoord.x < u_gridWidth || gridCoord.y < u_gridWidth) {
            gridLine = 1.0;
        }

        // Blend grid with cell color
        vec3 gridColor = vec3(0.8, 0.8, 0.8); // Light gray grid
        cellColor = mix(cellColor, gridColor, gridLine * 0.3);
    }

    gl_FragColor = vec4(cellColor, 1.0);
}
