uniform float uTime;
uniform sampler2D tDiffuse;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vPosition;


void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;

    vec4 text = texture2D(tDiffuse, uv);

    gl_FragColor = text;

	// tone mapping from outputpass
    gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

	// srgb convertion from outputpass
	gl_FragColor = sRGBTransferOETF( gl_FragColor );

}