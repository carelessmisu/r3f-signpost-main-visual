export default `
varying vec2 vUv;

varying vec3 Normal;
varying vec3 Position;

void main()	{
    vUv = uv;
    Normal = normalize(normalMatrix * normal);
    Position = vec3(modelViewMatrix * vec4(position, 1.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
`;
