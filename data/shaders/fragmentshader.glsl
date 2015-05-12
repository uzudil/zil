#ifdef GL_ES
    precision highp float;
#endif

uniform float isIndoors;

varying vec3 vNormal;
varying float intensity;
varying float intensity2;
varying float dirLightIntensity;
varying float key1Intensity;
varying float key2Intensity;
varying float key3Intensity;
varying vec3 vBlockColor;
varying float fBlockLightIntensity;

void main()
{
    if(isIndoors > 0.0) {
        vec3 colorLight1 = vec3(1.0, 0.66, 0.1);
        float powerLight1 = 0.8;

        vec3 colorLight2 = vec3(1.0, 0.95, 0.93);
        float powerLight2 = 1.0;

        vec3 colorDir = vec3(1.0, 1.0, 1.0);
        float powerDir = 0.2;

        vec3 colorEmitted = vec3(1.0, 0.75, 0.33);
        float powerEmitted = 0.9;

        float weightedPower = (powerLight1 + powerLight2 + powerDir + powerEmitted) / 4.0;

        vec3 color = colorLight1 * intensity * powerLight1 * weightedPower;
        color += colorLight2 * intensity2 * powerLight2 * weightedPower;
        color += colorDir * dirLightIntensity * powerDir * weightedPower;
        color += colorEmitted * fBlockLightIntensity * powerEmitted * weightedPower;

        gl_FragColor = vec4(vBlockColor * color, 1.0);
    } else {
        vec3 ambientColor = vec3(0.03, 0.03, 0.03);

        vec3 colorKey1 = vec3(1.0, 1.0, 1.0);
        float powerKey1 = 0.8;

        vec3 colorKey2 = vec3(1.0, 1.0, 1.0);
        float powerKey2 = 0.4;

        vec3 colorKey3 = vec3(1.0, 1.0, 1.0);
        float powerKey3 = 1.0;

        float weightedPower = (powerKey1 + powerKey2 + powerKey3) / 3.0;

        vec3 color = colorKey1 * key1Intensity * powerKey1 * weightedPower;
        color += colorKey2 * key2Intensity * powerKey2 * weightedPower;
        color += colorKey3 * key3Intensity * powerKey3 * weightedPower;
        color = max(color, ambientColor);

        gl_FragColor = vec4(vBlockColor * color, 1.0);
    }
}
