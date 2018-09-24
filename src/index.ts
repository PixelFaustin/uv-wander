import { vertexSrc, fragmentSrc, initFragmentSrc } from './shaders';

console.log(vertexSrc);
console.log(fragmentSrc);

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function loadTexture(gl: WebGL2RenderingContext, url) {
  return new Promise((resolve, reject) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel
    );

    const image = new Image();
    image.crossOrigin = '';
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        image
      );

      // WebGL1 has different requirements for power of 2 images
      // vs non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      } else {
        // No, it's not a power of 2. Turn of mips and set
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }

      console.log('resolved');
      resolve(texture);
    };

    image.src = url;
  });
}

const canvas: HTMLCanvasElement = document.getElementById(
  'app-canvas'
) as HTMLCanvasElement;

const context: WebGL2RenderingContext = canvas.getContext(
  'webgl2'
) as WebGL2RenderingContext;

function createShader(
  gl: WebGL2RenderingContext,
  source: string,
  type: number
): WebGLShader {
  const shader: WebGLShader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    let errorMessage: string = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(errorMessage);
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertex: WebGLShader,
  fragment: WebGLShader
): WebGLProgram {
  const program: WebGLProgram = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    throw new Error(gl.getProgramInfoLog(program));
  }

  return program;
}

class Shader {
  public program: WebGLProgram;
  public initialContext: WebGL2RenderingContext;
  constructor(gl: WebGL2RenderingContext, program: WebGLProgram) {
    this.program = program;
    this.initialContext = gl;
  }
}

class ShaderBuilder {
  private vertexShader: WebGLShader;
  private fragmentShader: WebGLShader;

  private gl: WebGL2RenderingContext;
  private vertexCreated: boolean;
  private fragmentCreated: boolean;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  vertex(source: string): ShaderBuilder {
    this.vertexShader = createShader(this.gl, source, this.gl.VERTEX_SHADER);
    this.vertexCreated = true;

    return this;
  }

  fragment(source: string): ShaderBuilder {
    this.fragmentShader = createShader(
      this.gl,
      source,
      this.gl.FRAGMENT_SHADER
    );
    this.fragmentCreated = true;

    return this;
  }

  build(): Shader {
    if (!this.fragmentCreated || !this.vertexCreated) {
      throw new Error('Must include both vertex and fragment shaders');
    }

    const program: WebGLProgram = createProgram(
      this.gl,
      this.vertexShader,
      this.fragmentShader
    );
    return new Shader(this.gl, program);
  }
}

let shader: Shader = new ShaderBuilder(context)
  .vertex(vertexSrc)
  .fragment(fragmentSrc)
  .build();

let initShader: Shader = new ShaderBuilder(context)
  .vertex(vertexSrc)
  .fragment(initFragmentSrc)
  .build();

let gl = context;
gl.canvas.width = 640;
gl.canvas.height = 480;

const textureWidth = gl.canvas.width;
const textureHeight = gl.canvas.height;
const textureFlip = gl.createTexture();
const textureFlop = gl.createTexture();

gl.activeTexture(gl.TEXTURE0 + 0);
gl.bindTexture(gl.TEXTURE_2D, textureFlip);
{
  const level = 0;
  const internalFormat = gl.RGBA;
  const border = 0;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  const data = null;
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    textureWidth,
    textureHeight,
    border,
    format,
    type,
    data
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_2D, textureFlop);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    textureWidth,
    textureHeight,
    border,
    format,
    type,
    data
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

//create framebuffer
const fbFlip = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbFlip);

const fbFlop = gl.createFramebuffer();

const attachmentPt = gl.COLOR_ATTACHMENT0;
gl.framebufferTexture2D(
  gl.FRAMEBUFFER,
  attachmentPt,
  gl.TEXTURE_2D,
  textureFlip,
  0
);

gl.bindFramebuffer(gl.FRAMEBUFFER, fbFlop);
gl.framebufferTexture2D(
  gl.FRAMEBUFFER,
  attachmentPt,
  gl.TEXTURE_2D,
  textureFlop,
  0
);

const positionAttribLoc = context.getAttribLocation(
  shader.program,
  'a_position'
);

const positions = [-1, -1, 1, -1, 1, 1, -1, 1];
const indices = [0, 2, 1, 2, 0, 3];

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(
  gl.ELEMENT_ARRAY_BUFFER,
  new Uint16Array(indices),
  gl.STATIC_DRAW
);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.enableVertexAttribArray(positionAttribLoc);
gl.vertexAttribPointer(positionAttribLoc, 2, gl.FLOAT, false, 0, 0);

gl.canvas.width = 640;
gl.canvas.height = 480;
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0.3, 0.31, 0.32, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

//render framebuffer
{
  const program = initShader.program;
  gl.useProgram(program);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbFlip);

  const resLoc = gl.getUniformLocation(program, 'u_resolution');

  gl.bindVertexArray(vao);
  gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

let lenaTexture;
let noiseTexture;

loadTexture(gl, 'http://i.imgur.com/SlXWR42l.jpg')
  .then(tex => {
    lenaTexture = tex;
    return loadTexture(
      gl,
      'http://gpuopen.com/wp-content/uploads/2015/12/LottesGrain7.png'
    );
  })
  .then(tex => {
    noiseTexture = tex;

    const resLoc = gl.getUniformLocation(shader.program, 'u_resolution');
    const timeLoc = gl.getUniformLocation(shader.program, 'u_time');
    const texLoc = gl.getUniformLocation(shader.program, 'u_texture');
    const tex2loc = gl.getUniformLocation(shader.program, 'u_texture_alt');
    const noiseTexLoc = gl.getUniformLocation(
      shader.program,
      'u_texture_noise'
    );
    const altSwitchLoc = gl.getUniformLocation(shader.program, 'u_useAlt');

    let otherFb = fbFlop;
    let activeTexture = textureFlip;
    let otherTexture = textureFlop;

    function flip() {
      if (otherFb === fbFlop) {
        otherFb = fbFlip;
      } else {
        otherFb = fbFlop;
      }

      if (activeTexture === textureFlip) {
        activeTexture = textureFlop;
      } else {
        activeTexture = textureFlip;
      }

      if (otherTexture === textureFlip) {
        otherTexture = textureFlop;
      } else {
        otherTexture = textureFlip;
      }
    }

    function render() {
      gl.useProgram(shader.program);

      gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(timeLoc, performance.now() / 1000);
      gl.uniform1i(texLoc, 0);
      gl.uniform1i(tex2loc, 1);
      gl.uniform1i(noiseTexLoc, 2);
      gl.uniform1i(altSwitchLoc, 0);

      //bind init texture (targetTexture) (bind only once)
      //render to warpTexture framebuffer
      //render to canvas

      //render to other fb
      gl.bindFramebuffer(gl.FRAMEBUFFER, otherFb);
      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, activeTexture);
      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, lenaTexture);
      gl.activeTexture(gl.TEXTURE0 + 2);
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

      //render to canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, otherTexture);
      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, lenaTexture);
      gl.activeTexture(gl.TEXTURE0 + 2);
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.uniform1i(altSwitchLoc, 1);

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

      flip();
      requestAnimationFrame(render);
    }

    render();
  });
