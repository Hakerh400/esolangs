'use strict';

const O = require('omikron');

class Vector{
  constructor(x=0, y=0){
    this.set(x, y);
  }

  static fromAngle(len, angle){
    var x = Math.cos(angle) * len;
    var y = Math.sin(angle) * len;

    return new Vector(x, y);
  }

  set(x, y){
    if(x instanceof Vector)
      ({x, y} = x);

    this.x = x;
    this.y = y;

    return this;
  }

  clone(){
    return new Vector(this.x, this.y);
  }

  add(x, y){
    if(x instanceof Vector)
      ({x, y} = x);

    this.x += x;
    this.y += y;

    return this;
  }

  sub(x, y){
    if(x instanceof Vector)
      ({x, y} = x);

    this.x -= x;
    this.y -= y;

    return this;
  }

  mul(val){
    this.x *= val;
    this.y *= val;

    return this;
  }

  div(val){
    this.x /= val;
    this.y /= val;

    return this;
  }

  combine(len, angle){
    this.x += Math.cos(angle) * len;
    this.y += Math.sin(angle) * len;

    return this;
  }

  dec(x, y){
    if(x instanceof Vector)
      ({x, y} = x);

    if(x !== 0){
      var sx = this.x > 0 ? 1 : -1;
      if(Math.abs(this.x) > x) this.x = x * sx - this.x;
      else this.x = 0;
    }

    if(y !== 0){
      var sy = this.y > 0 ? 1 : -1;
      if(Math.abs(this.y) > y) this.y = y * sy - this.y;
      else this.y = 0;
    }

    return this;
  }

  len(){
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lenM(){
    return Math.abs(this.x) + Math.abs(this.y);
  }

  setLen(len){
    var angle = this.angle();

    this.x = Math.cos(angle) * len;
    this.y = Math.sin(angle) * len;

    return this;
  }

  angle(){
    return Math.atan2(this.y, this.x);
  }

  setAngle(angle){
    var len = this.len();

    this.x = Math.cos(angle) * len;
    this.y = Math.sin(angle) * len;

    return this;
  }

  norm(){
    this.div(this.len());

    return this;
  }

  dist(x, y){
    if(x instanceof Vector)
      ({x, y} = x);

    var dx = this.x - x;
    var dy = this.y - y;

    return Math.sqrt(dx * dx + dy * dy);;
  }

  maxLen(maxLen){
    if(this.len() > maxLen)
      this.setLen(maxLen);

    return this;
  }

  rotate(angle){
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    var x = this.x * cos - this.y * sin;
    var y = this.x * sin + this.y * cos;

    this.x = x;
    this.y = y;

    return this;
  }

  isIn(x1, y1, x2, y2){
    var {x, y} = this;
    return x >= x1 && y >= y1 && x < x2 && y < y2;
  }
}

module.exports = Vector;