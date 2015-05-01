#ifdef GL_ES
    precision highp float;
#endif

uniform vec3 blockColor;
varying vec3 vNormal;
varying float intensity;
varying float intensity2;
varying float dirLightIntensity;

void main()
{
    vec3 colorLight1 = vec3(1.0, 0.66, 0.1);
    float powerLight1 = 0.8;

    vec3 colorLight2 = vec3(1.0, 0.95, 0.93);
    float powerLight2 = 1.0;

    vec3 colorDir = vec3(1.0, 1.0, 1.0);
    float powerDir = 0.2;

    float weightedPower = (powerLight1 + powerLight2 + powerDir) / 3.0;

    vec3 color = colorLight1 * intensity * powerLight1 * weightedPower;
    color += colorLight2 * intensity2 * powerLight2 * weightedPower;
    color += colorDir * dirLightIntensity * powerDir * weightedPower;

    gl_FragColor = vec4(blockColor * color, 1.0);
}
