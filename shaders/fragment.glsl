uniform float uTime;
uniform sampler2D tDiffuse;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vPosition;


void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;

    vec4 text = texture2D(tDiffuse, uv);

    gl_FragColor = text;

	// color space
	gl_FragColor =  sRGBTransferOETF( gl_FragColor );
}