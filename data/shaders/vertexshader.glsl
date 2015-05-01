// switch on high precision floats
#ifdef GL_ES
    precision highp float;
#endif

varying vec3 vNormal;
uniform vec3 lightPos;
varying float intensity;
varying float intensity2;
varying float dirLightIntensity;

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

    // get the light intensities
    intensity = getLightIntensity(80.0, vNormal, vec3(lightPos.x, lightPos.y, lightPos.z + 5.5), worldPos);
    intensity2 = getLightIntensity(160.0, vNormal, vec3(lightPos.x + 16.0, lightPos.y + 16.0, lightPos.z + 48.0), worldPos);

    // directional light
    vec3 dirLight = normalize(vec3(100, 50, 24));
    dirLightIntensity = max(dot(vNormal, dirLight), 0.0);
}
