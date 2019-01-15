//http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
  h %= 1.0;
  var r, g, b;

  if(s == 0){
      r = g = b = l; // achromatic
  }else{
    var hue2rgb = function hue2rgb(p, q, t){
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  // return Math.round(r * 255)*256*256 + Math.round(g * 255)*256 + Math.round(b * 255);
  return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}


class Particle {
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.color = new Array(3);
    this.size = 0;
    this.cnt = new Array(3);
    for(let i=0; i<3; i++){
      this.cnt[i] = new Array(256);
      for(let j=0; j<256; j++){
        this.cnt[i][j] = 0;
      }
    }
    this.score = 0;
    this.scorePerPixel = 0.0;
  }

  setMeanColor(){
    this.score = 0;
    for(let i=0; i<3; i++){
      let sum = 0;
      for(let j=0; j<256; j++){
        sum += this.cnt[i][j];
        if(sum >= this.size / 2){
          this.color[i] = j;
          break;
        }
      }
      for(let j=0; j<256; j++){
        this.score += Math.abs(this.color[i] - j) * this.cnt[i][j];
      }
    }
    this.scorePerPixel = (this.score / this.size) / (255 * 3);
  }

  getScore(){
    return this.score;
  }

  getScorePerPixel(){
    return this.scorePerPixel;
  }

  getColor(){
    let res = 0;
    let k = 1;
    for(let i=0; i<3; i++){
      res += this.color[i] * k;
      k <<= 8;
    }
  }

  add(color){
    this.size += 1;
    let tmp = color;
    for(let i=0; i<3; i++){
      let c = tmp & 255;
      tmp >>= 8;
      this.cnt[i][c] += 1;
    }
  }

  remove(color){
    this.size -= 1;
    let tmp = color;
    for(let i=0; i<3; i++){
      let c = tmp & 255;
      tmp >>= 8;
      this.cnt[i][c] -= 1;
    }
  }
}

class Button {
  constructor(canv, displayText, callback, defaultValue, x, y, w, h){
    this.value = defaultValue;
    this.callback = callback;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.displayText = displayText;

    this.setEventListener(canv);
  }

  setEventListener(canv){
    canv.addEventListener('mousedown', (mouseEvent)=>{
      let x = mouseEvent.clientX - canv.offsetLeft - this.x;
      let y = mouseEvent.clientY - canv.offsetTop - this.y;
      if(x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      if(this.value != null){
        this.value = !this.value;
      }
      this.callback(this.value);
    }, false);
  }

  draw(ctx){
    ctx.fillStyle = this.value ? "DarkBlue" : "black";
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.font = "16px Consolas";
    ctx.fillStyle = "yellow";
    ctx.fillText(this.displayText, this.x+10, this.y+10);
  }
}

class FenwickTree{
  constructor(){
    this.n = 1023 + 1;
    this.data = new Array(this.n);
    for(let i=0; i<this.n; i++){
      this.data[i] = 0;
    }
  }

  add(at, val){
    for(let i=at + 1; i<this.n; i += i & -i){
      this.data[i] += val;
    }
  }

  get(at){
    let sum = 0;
    for(let i=at + 1; i>0; i -= i & -i){
      sum += this.data[i];
    }
    return sum;
  }

  find(val){
    let i = 0;
    let k = 512;
    for(let k=512; k > 0; k >>= 1){
      if(i + k < this.n && this.data[i + k] < val){
        val -= this.data[i + k];
        i += k;
      }
    }
    return i + 1;
  }
}

class SA{
  constructor(){
    this.itr = 0;
  }
  accept(diff){
    if(diff <= 0.0) return true;
    return false;
    this.itr += 1;
    let T = this.getTemp();
    let A = Math.exp( -diff * 3e5 / T );
    return Math.random() < A;
  }

  getTemp(){
    return Math.max(0.001, 2.0 - this.itr * 2e-5);
  }
  getItr(){
    return this.itr;
  }
}

class StainedGlass{
  constructor(image){
    this.infoSize = 200;
    this.setOrigData(image);
    this.initMyCanv();
    this.initParams();
    this.initButtons();
    this.setEvents();
  }

  setOrigData(image){
    let canv = document.createElement("canvas");
    let context = canv.getContext('2d');

    let scale = 1.0;
    let maxSize = 500;
    if(image.width > maxSize || image.height > maxSize){
      scale = Math.min(maxSize / image.width, maxSize / image.height);
    }
    console.log("image scale :", scale);
    canv.width = Math.floor(image.width * scale);
    canv.height = Math.floor(image.height * scale);
    context.drawImage(image, 0, 0, image.width, image.height, 0, 0,
      canv.width, canv.height);

    this.width = canv.width;
    this.height = canv.height;
    console.log(canv.width, canv.height);

    this.origData = new Array(this.width * this.height);
    let data = context.getImageData(0, 0, this.width, this.height);
    for(let y=0; y<this.height; y++){
      for(let x=0; x<this.width; x++){
        let tmp = 0;
        let k = 0;
        for(let j=0; j<3; j++){
          tmp += data.data[y * (this.width * 4) + x * 4 + j] << k;
          k += 8;
        }
        this.origData[y * this.width + x] = tmp;
      }
    }

    this.maskData = data;
    for(let y=0; y<this.height; y++){
      for(let x=0; x<this.width; x++){
        let p = y * this.width + x;
        this.maskData.data[p * 4 + 3] = 255;
      }
    }
  }

  initMyCanv(){
    this.canv = document.querySelector("#canvas");
    this.canv.height = this.height;
    this.canv.width = this.width + this.infoSize;
    this.ctx = this.canv.getContext("2d");
  }

  initParams(){
    this.data = new Array(this.width * this.height);
    for(let y=0; y<this.height; y++){
      for(let x=0; x<this.width; x++){
        this.data[y * this.width + x] = -1;
      }
    }
    this.particles = (new Array(1000)).map( () => new Particle(-1, -1) );
    this.validParticles = new Set();
    this.validParticlePos = new Set();
    this.score = 1e10;

    this.fenwicktree = new FenwickTree();
    this.cellsAffected = new Set();

    this.sa = new SA();
  }

  initButtons(){
    this.showOrig = false;
    this.showSPP = false;
    this.showPP = true;

    this.buttons = [];
    let py = 80;
    let dy = 40;
    this.buttons.push(new Button(
      this.canv,
      "Original Image",
      (val)=>{
        this.showOrig = val;
        this.draw();
      },
      false,
      0,
      py,
      this.infoSize, 20));

    py += dy;

    this.buttons.push(new Button(
      this.canv,
      "Show Points",
      (val)=>{
        this.showPP = val;
        this.draw();
      },
      true,
      0,
      py,
      this.infoSize, 20));

    py += dy;

    this.buttons.push(new Button(
      this.canv,
      "Score Per Pixel",
      (val)=>{
        this.showSPP = val;
        this.draw();
      },
      false,
      0,
      py,
      this.infoSize, 20));

    py += dy + 20;

    this.buttons.push(new Button(
      this.canv,
      "Kick Random Points",
      ()=>{
        if(this.validParticles.size == 0) return;
        for(let k=0; k<1000; k++){
          let prevScore = this.score;
          let i = Math.floor(Math.random() * this.validParticles.size);
          i = [...this.validParticles][i];
          let x_ = this.particles[i].x;
          let y_ =  this.particles[i].y;
          this.eraseParticle(x_, y_);

          let x;
          let y;
          while(true){
            let v = Math.floor(Math.random() * this.fenwicktree.get(1000));
            let t = this.fenwicktree.find(v);
            if(this.validParticles.has(t) == false) continue;
            let w0 = Math.random();
            let w1 = Math.random();
            let z0 = Math.sqrt(-2 * Math.log(w0)) * Math.cos(2 * Math.PI * w1);
            let z1 = Math.sqrt(-2 * Math.log(w1)) * Math.sin(2 * Math.PI * w0);
            x = Math.floor(this.particles[t].x + z0 * 10);
            y = Math.floor(this.particles[t].y + z1 * 10);
            if(y<0 || x<0 || x>=this.width || y>=this.height) continue;
            if(this.validParticlePos.has(y * this.width + x)) continue;
            let res = this.addParticle(x, y);
            if(res) break;
          }

          let nextScore = this.score;

          let diff = (nextScore - prevScore) / (this.width * this.height * 255 * 3);
          if(this.sa.accept(diff)){

          }else{
            this.eraseParticle(x, y);
            this.addParticle(x_, y_);
            //this.calcScore();
          }
        }
        this.draw();
      },
      null,
      0,
      py,
      this.infoSize, 20));

    py += dy;

    this.buttons.push(new Button(
      this.canv,
      "Move Random Points",
      ()=>{
        if(this.validParticles.size < 5) return;

        let cx = [0, 0, -1, 1];
        for(let t=0; t<1000; t++){
          let prevScore = this.score;
          let i = Math.floor(Math.random() * this.validParticles.size);
          i = [...this.validParticles][i];
          let x_ = this.particles[i].x;
          let y_ =  this.particles[i].y;
          this.eraseParticle(x_, y_);

          this.cellsAffected.delete(i);

          let rollback;
          // while(true){
          //   let t = [...this.cellsAffected][Math.floor(Math.random() * this.cellsAffected.size)];
          //   let x = this.particles[t].x;
          //   let y = this.particles[t].y;
          //   let dx = x_ - x;
          //   let dy = y_ - y;
          //   let r = Math.sqrt(dx * dx + dy * dy) * 0.5;
          //   let theta = (Math.random() - 0.5) * (Math.PI);
          //   let vx = Math.cos(theta) * r;
          //   let vy = Math.sin(theta) * r;
          //   let kx = x_ < x ? 1 : -1;
          //   let ky = y_ < y ? 1 : -1;
          //   let p0 = [x_ + vx * kx, y_ + vy * ky].map(v => Math.floor(v));
          //   let p1 = [x - vx * kx, y - vy * ky].map(v => Math.floor(v));
          //   if(p0[0] == p1[0] && p0[1] == p1[1]) continue;
          //   console.log(p0, p1);
          //   if(p0[1]<0 || p0[0]<0 || p0[0]>=this.width || p0[1]>=this.height) continue;
          //   if(p1[1]<0 || p1[0]<0 || p1[0]>=this.width || p1[1]>=this.height) continue;
          //   if(this.validParticlePos.has(p0[1] * this.width + p0[0])) continue;
          //   if(this.validParticlePos.has(p1[1] * this.width + p1[0])) continue;
          //   this.addParticle(p0[0], p0[1]);
          //   this.eraseParticle(x, y);
          //   this.addParticle(p1[0], p1[1]);
          //   rollback = ()=>{
          //     this.eraseParticle(p1[0], p1[1]);
          //     this.addParticle(x, y);
          //     this.eraseParticle(p0[0], p0[1]);
          //     this.addParticle(x_, y_);
          //   };
          //   break;
          // }

          while(true){
            let d = Math.floor(Math.random() * 4 + 1.0);
            let k = Math.floor(Math.random() * 3.999);
            let x = x_ + cx[k] * d;
            d = Math.floor(Math.random() * 4 + 1.0);
            k = Math.floor(Math.random() * 3.999);
            let y = y_ + cx[(k+2)%4] * d;
            if(y<0 || x<0 || x>=this.width || y>=this.height) continue;
            if(this.validParticlePos.has(y * this.width + x)) continue;
            let res = this.addParticle(x, y);
            if(res == false) continue;
            rollback = ()=>{
              this.eraseParticle(x, y);
              this.addParticle(x_, y_);
            }
            break;
          }

          let nextScore = this.score;
          let diff = (nextScore - prevScore) / (this.width * this.height * 255 * 3);

          if(this.sa.accept(diff)){

          }else{
            rollback();
          }

        }
        this.draw();
      },
      null,
      0,
      py,
      this.infoSize, 20));

    py += dy;

    this.buttons.push(new Button(
      this.canv,
      "Set Random Points",
      ()=>{
        this.initParams();
        let pts = new Set();
        for(let i=0; pts.size < 1000; i++){
          let x = Math.floor(Math.random() * this.width);
          let y = Math.floor(Math.random() * this.height);
          pts.add(y * this.width + x);
        }
        this.addMultipleParticles([...pts]);
        this.draw();
      },
      null,
      0,
      py,
      this.infoSize, 20));

    py += dy;

    this.buttons.push(new Button(
      this.canv,
      "Delete All Points",
      ()=>{
        this.initParams();
        this.draw();
      },
      null,
      0,
      py,
      this.infoSize, 20));

    py += dy;
  }

  setEvents(){
    this.canv.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canv.addEventListener('mousedown', (mouseEvent)=>{
      let x = mouseEvent.clientX - this.canv.offsetLeft - this.infoSize;
      let y = mouseEvent.clientY - this.canv.offsetTop;
      if(x < 0 || y < 0 || x >= this.width || y >= this.height) return;
      if(mouseEvent.button == 0){
        if(this.addParticle(x, y)) this.draw();
      }else{
        if(this.eraseParticle(x, y)) this.draw();
      }
    }, false);
  }

  drawData(){
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(this.infoSize, 0, this.width, this.height);
    let imageData = this.ctx.createImageData(this.width, this.height);
    for(let y=0; y<this.height; y++){
      for(let x=0; x<this.width; x++){
        let j = y * this.width + x;
        let i = j * 4;
        if(this.data[j] == -1) continue;
        let k = this.data[j];
        for(let h=0; h<3; h++){
          imageData.data[i + h] = this.particles[k].color[h];
        }
        imageData.data[i + 3] = 255;
      }
    }
    this.ctx.putImageData(imageData, this.infoSize, 0);
  }

  drawSPPData(){
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(this.infoSize, 0, this.width, this.height);
    let imageData = this.ctx.createImageData(this.width, this.height);
    for(let y=0; y<this.height; y++){
      for(let x=0; x<this.width; x++){
        let j = y * this.width + x;
        let i = j * 4;
        if(this.data[j] == -1) continue;
        let k = this.data[j];
        let spp = this.particles[k].getScorePerPixel();
        let colors = hslToRgb(spp * 0.5 + 0.5, 0.8, 0.6);
        for(let h=0; h<3; h++){
          imageData.data[i + h] = colors[h];
        }
        imageData.data[i + 3] = 255;
      }
    }
    this.ctx.putImageData(imageData, this.infoSize, 0);
  }

  drawOriginalData(){
    this.ctx.putImageData(this.maskData, this.infoSize, 0);
  }

  drawParticlePoints(){
    this.ctx.fillStyle = 'black';
    this.validParticles.forEach(i => {
      let y = this.particles[i].y;
      let x = this.particles[i].x + this.infoSize;
      this.ctx.fillRect(x-1, y-1, 3, 3);
    });
  }

  drawParameters(){
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.infoSize, this.height);
    this.ctx.font = "16px Consolas";
    this.ctx.fillStyle = "yellow";

    this.ctx.fillText(`n      = ${this.validParticles.size} / 1000`, 10, 30);
    this.ctx.fillText(`score  = ${this.score / (this.width * this.height * 255 * 3)}`, 10, 50);
    // this.ctx.fillText(`SA Itr = ${this.sa.getItr()}`, 10, 70);
    // this.ctx.fillText(`SA Tmp = ${this.sa.getTemp()}`, 10, 90);

    this.buttons.forEach((b) => b.draw(this.ctx));
  }

  calcScore(){
    if(this.validParticles.size > 0){
      this.fenwicktree = new FenwickTree();
      [...this.validParticles].map(i => [i, this.particles[i]]).forEach(p => {
        p[1].setMeanColor();
        this.fenwicktree.add(p[0], p[1].getScore() * p[1].getScore());
      });
      this.score = [...this.validParticles].map(i => this.particles[i]).map(p => p.getScore()).reduce((i,j) => i+j);
      // this.score = this.fenwicktree.get(1000);
    }
    return this.score;
  }

  draw(){
    this.calcScore();
    if(this.showOrig == true){
      this.drawOriginalData();
    }else{
      if(this.showSPP == true){
        this.drawSPPData();
      }else{
        this.drawData();
      }
    }
    if(this.showPP){
      this.drawParticlePoints();
    }
    this.drawParameters();
  }

  updatePixel(x, y, i){
    let p = y * this.width + x;
    let j = this.data[p];
    if(j != -1){
      this.particles[j].remove(this.origData[p]);
      this.cellsAffected.add(j);
    }
    this.cellsAffected.add(i);
    this.particles[i].add(this.origData[p]);
    this.data[p] = i;
  }

  addParticle(x, y){
    if(this.validParticlePos.has(y * this.width + x)){
    // if([...this.validParticles].filter(i => this.particles[i].y == y && this.particles[i].x == x).length != 0){
      console.log(`error : duplicate points at ${y}, ${x}`);
      return false;
    }
    if(this.validParticles.size == 1000){
      console.log(`error : num particles must be less than or equal to 1000`);
      return false;
    }
    
    let i = 0;
    while(this.validParticles.has(i)) i++;

    this.validParticles.add(i);
    this.validParticlePos.add(y * this.width + x);
    this.particles[i] = new Particle(x, y);

    let dx = [0, 0, 1, -1];
    let dy = [1, -1, 0, 0];

    this.cellsAffected = new Set([i]);

    let queue = new Array();
    let head = 0;
    this.updatePixel(x, y, i);
    queue.push([x, y]);
    while(head < queue.length){
      let now = queue[head];
      head++;
      for(let k=0; k<4; k++){
        let x_ = now[0] + dx[k];
        let y_ = now[1] + dy[k];
        if(y_ < 0 || x_ < 0 || y_ >= this.height || x_ >= this.width) continue;
        let p = y_ * this.width + x_;
        if(this.data[p] == -1){
          this.updatePixel(x_, y_, i);
          queue.push([x_, y_]);
          continue;
        }
        let j = this.data[p];
        if(i == j) continue;
        let d0 = Math.pow(x_ - this.particles[j].x, 2) + Math.pow(y_ - this.particles[j].y, 2);
        let d1 = Math.pow(x_ - this.particles[i].x, 2) + Math.pow(y_ - this.particles[i].y, 2);
        if(d0 > d1 || d0 == d1 && i < j){
          this.updatePixel(x_, y_, i);
          queue.push([x_, y_]);
        }
      }
    }

    this.cellsAffected.forEach(i => {
      this.score -= this.particles[i].getScore();
      this.fenwicktree.add(i, - this.particles[i].getScore() * this.particles[i].getScore());
      this.particles[i].setMeanColor();
      this.score += this.particles[i].getScore();
      this.fenwicktree.add(i, this.particles[i].getScore() * this.particles[i].getScore());
    });

    this.lastAdd = i;
    return true;
  }


  addMultipleParticles(points){
    points = [...new Set(points)];
    points = points.filter(p => this.validParticlePos.has(p[1] * this.width + p[0]) == false)
      .map(p => [p % this.width, Math.floor(p / this.width)]);

    if(this.validParticles.size + points.length > 1000){
      return false;
    }

    let idx = new Array();
    for(let i=0; idx.length < points.length; i++){
      if(this.validParticles.has(i) == false){
        idx.push(i);
        this.validParticles.add(i);
        this.validParticlePos.add(points[idx.length - 1][1] * this.width + points[idx.length - 1][0]);
        this.particles[i] = new Particle(points[idx.length-1][0], points[idx.length-1][1]);
      }
    }

    let dx = [0, 0, 1, -1];
    let dy = [1, -1, 0, 0];

    let queue = new Array();
    let head = 0;
    for(let i=0; i<idx.length; i++){
      this.updatePixel(points[i][0], points[i][1], idx[i]);
      queue.push(points[i]);
    }
    while(head < queue.length){
      let now = queue[head];
      head++;
      let i = this.data[now[1] * this.width + now[0]];
      if(i == -1) continue;
      for(let k=0; k<4; k++){
        let x_ = now[0] + dx[k];
        let y_ = now[1] + dy[k];
        if(y_ < 0 || x_ < 0 || y_ >= this.height || x_ >= this.width) continue;
        let p = y_ * this.width + x_;
        if(this.data[p] == -1){
          this.updatePixel(x_, y_, i);
          queue.push([x_, y_]);
          continue;
        }
        let j = this.data[p];
        if(i == j) continue;
        let d0 = Math.pow(x_ - this.particles[j].x, 2) + Math.pow(y_ - this.particles[j].y, 2);
        let d1 = Math.pow(x_ - this.particles[i].x, 2) + Math.pow(y_ - this.particles[i].y, 2);
        if(d0 > d1 || d0 == d1 && i < j){
          this.updatePixel(x_, y_, i);
          queue.push([x_, y_]);
        }
      }
    }
    return true;
  }


  eraseParticle(x, y){
    let i = this.data[y * this.width + x];
    if(i == -1){
      console.log(`error : invalid particle selected.`);
      return false;
    }

    let dx = [0, 0, 1, -1];
    let dy = [1, -1, 0, 0];

    let queue = new Array();
    let head = 0;
    this.data[y * this.width + x] = -1;
    queue.push([x, y]);

    this.cellsAffected = new Set([i]);

    let adj = new Set;
    while(head < queue.length){
      let now = queue[head];
      head++;
      for(let k=0; k<4; k++){
        let x_ = now[0] + dx[k];
        let y_ = now[1] + dy[k];
        if(y_ < 0 || x_ < 0 || y_ >= this.height || x_ >= this.width) continue;
        let p = y_ * this.width + x_;
        if(this.data[p] == i){
          this.data[p] = -1;
          queue.push([x_, y_]);
        }else if(this.data[p] != -1){
          adj.add(p);
        }
      }
    }

    this.validParticlePos.delete(this.particles[i].y * this.width + this.particles[i].x);
    this.validParticles.delete(i);

    queue = [...adj].map(p => [(p % this.width), Math.floor(p / this.width)]);
    head = 0;
    while(head < queue.length){
      let now = queue[head];
      head++;
      let i = this.data[now[1] * this.width + now[0]];
      if(i == -1) continue;
      for(let k=0; k<4; k++){
        let x_ = now[0] + dx[k];
        let y_ = now[1] + dy[k];
        if(y_ < 0 || x_ < 0 || y_ >= this.height || x_ >= this.width) continue;
        let p = y_ * this.width + x_;
        if(this.data[p] == -1){
          this.updatePixel(x_, y_, i);
          queue.push([x_, y_]);
          continue;
        }
        let j = this.data[p];
        if(i == j) continue;
        let d0 = Math.pow(x_ - this.particles[j].x, 2) + Math.pow(y_ - this.particles[j].y, 2);
        let d1 = Math.pow(x_ - this.particles[i].x, 2) + Math.pow(y_ - this.particles[i].y, 2);
        if(d0 > d1 || d0 == d1 && i < j){
          this.updatePixel(x_, y_, i);
          queue.push([x_, y_]);
        }
      }
    }

    this.cellsAffected.forEach(i => {
      this.score -= this.particles[i].getScore();
      this.fenwicktree.add(i, - this.particles[i].getScore() * this.particles[i].getScore());
      this.particles[i].setMeanColor();
      this.score += this.particles[i].getScore();
      this.fenwicktree.add(i, this.particles[i].getScore() * this.particles[i].getScore());
    });
    return true;
  }
}

function setImage(srcUrl){
  try{
    let img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      let app = new StainedGlass(img);
      let pts = new Array();
      for(let y=10; y<app.height; y += Math.floor(app.height / 25)){
        for(let x=10; x<app.width; x += Math.floor(app.width / 25)){
          pts.push(y * app.width + x);
        }
      }
      app.addMultipleParticles(pts);
      app.draw();
    };
    img.src = srcUrl;
  }catch(e){
    console.log(e);
  }
};

setImage("./img.png");

document.getElementById("file").addEventListener('change', (e)=>{
  let fileData = e.target.files[0];
  let reader = new FileReader();
  reader.onload = (e) => {
    let src = reader.result;
    setImage(src);
  };
  reader.readAsDataURL(fileData);
});

document.getElementById("fileUrl").addEventListener('change', (e)=>{
  console.log(e.target.value);
  setImage(e.target.value);
});
