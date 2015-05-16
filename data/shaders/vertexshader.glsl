// switch on high precision floats
#ifdef GL_ES
    precision highp float;
#endif

attribute vec3 blockColor;
attribute float blockLightIntensity;
attribute vec3 blockLightColor;

uniform vec3 lightPos;
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
varying vec3 vBlockLightColor;

float getLightIntensity(float lightDist, vec3 vNormal, vec3 vLightPos, vec4 worldPos) {
    // light position is in world coordinates
    vec4 light = vec4(vLightPos, 1.0);

    // light attenuation
    float dist = distance(worldPos, light);
    float distIntensity = clamp(1.0 - (dist * dist)/(lightDist * lightDist), 0.0, 1.0);
    distIntensity *= distIntensity;

    // intensity based on angle of light
    vec3 l = normalize(vec3(light - worldPos));
    float normIntensity = max(dot(vNormal, l), 0.0);

    // combine the two
    return normIntensity * distIntensity;
}

void main()
{
    // convert vertex position to world coordinates
    vec4 worldPos = modelMatrix * vec4(position,1.0);

    // send normal to fragment shader
    vNormal = normalMatrix * normal;

    // set the position
    gl_Position = projectionMatrix * viewMatrix * worldPos;

    // normal in world coords
    vec3 vNormal = normalize(vec3(modelMatrix * vec4(normal,0.0)));

    if(isIndoors > 0.0) {
        // get the light intensities
        intensity = getLightIntensity(80.0, vNormal, vec3(lightPos.x, lightPos.y, lightPos.z + 5.5), worldPos);
        intensity2 = getLightIntensity(160.0, vNormal, vec3(lightPos.x + 16.0, lightPos.y + 16.0, lightPos.z + 48.0), worldPos);

        // directional light
        vec3 dirLight = normalize(vec3(100, 50, 24));
        dirLightIntensity = max(dot(vNormal, dirLight), 0.0);
    } else {
        vec3 key1Dir = normalize(vec3(0, 3, 3));
        key1Intensity = max(dot(vNormal, key1Dir), 0.0);

        vec3 key2Dir = normalize(vec3(3, 3, 0));
        key2Intensity = max(dot(vNormal, key2Dir), 0.0);

        vec3 key3Dir = normalize(vec3(3, 0, 3));
        key3Intensity = max(dot(vNormal, key3Dir), 0.0);
    }

    vBlockColor = blockColor;
    fBlockLightIntensity = blockLightIntensity;
    vBlockLightColor = blockLightColor;
}
