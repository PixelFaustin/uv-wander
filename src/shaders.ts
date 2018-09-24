export const fragmentSrc: string = `#version 300 es

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_texture;
uniform sampler2D u_texture_alt;
uniform sampler2D u_texture_noise;
uniform bool u_useAlt;

out vec4 outColor;

//ashima simplex noise
lowp vec3 permute(in lowp vec3 x) { return mod( x*x*34.+x, 289.); }
lowp float snoise(in lowp vec2 v) {
  lowp vec2 i = floor((v.x+v.y)*.36602540378443 + v),
      x0 = (i.x+i.y)*.211324865405187 + v - i;
  lowp float s = step(x0.x,x0.y);
  lowp vec2 j = vec2(1.0-s,s),
      x1 = x0 - j + .211324865405187, 
      x3 = x0 - .577350269189626; 
  i = mod(i,289.);
  lowp vec3 p = permute( permute( i.y + vec3(0, j.y, 1 ))+ i.x + vec3(0, j.x, 1 )   ),
       m = max( .5 - vec3(dot(x0,x0), dot(x1,x1), dot(x3,x3)), 0.),
       x = fract(p * .024390243902439) * 2. - 1.,
       h = abs(x) - .5,
      a0 = x - floor(x + .5);
  return .5 + 65. * dot( pow(m,vec3(4.))*(- 0.85373472095314*( a0*a0 + h*h )+1.79284291400159 ), a0 * vec3(x0.x,x1.x,x3.x) + h * vec3(x0.y,x1.y,x3.y));
}

vec3 average(float mag, float off, vec2 uv)
{
  vec3 total = vec3(0.);
  float count = 0.;
  for (float x = -mag; x <= mag; x++)
  {
    for (float y = -mag; y <= mag; y++)
    {
      vec2 offset = vec2(x*off, y*off);
      total += texture(u_texture_alt, uv + offset).rgb;
      count += 1.;
    }
  }

  return total / (count-1.);
}

void main() 
{
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  vec2 lastUV = texture(u_texture, vec2(uv)).rg;
  float mag = 0.01;
  float x = ((snoise(lastUV * 100.) * 2.)-1.) * mag;
  float y = ((snoise(lastUV * 43.1123) * 2.)-1.) * mag;
  
  x = abs(x);
  y = abs(y);

  lastUV += vec2(x, y);
  
  outColor = vec4(lastUV, 0.0*u_time, 1.0);
  if (u_useAlt) 
  {
    float off = 0.05;
    vec2 lv = vec2(lastUV.x, 1. - lastUV.y);

     
    
    outColor = vec4(average(4., off, lv), 1.);
  }

}
`;

export const initFragmentSrc: string = `#version 300 es

precision mediump float;

uniform vec2 u_resolution;

out vec4 outColor;

void main() 
{
  vec2 uv = gl_FragCoord.xy / u_resolution.xy; 
  outColor = vec4(uv, 0.0, 1.0);
}`;

export const vertexSrc: string = `#version 300 es

  in vec4 a_position;
  
  void main() {
    gl_Position = a_position;
  }
`;
