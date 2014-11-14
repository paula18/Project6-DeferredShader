precision highp float;

uniform sampler2D u_sampler;

varying vec4 v_pos;
varying vec3 v_normal;
varying vec2 v_texcoord;
varying float v_depth;

void main(void){
	gl_FragColor = vec4( normalize(v_normal), 1.0 );
}
