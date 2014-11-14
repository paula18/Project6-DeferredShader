precision highp float;

uniform sampler2D u_sampler;

uniform vec3 u_modelColor;

void main(void){
	gl_FragColor = vec4(vec3(u_modelColor), 1.0);
}
